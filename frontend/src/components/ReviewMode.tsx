import React, { useState, useEffect, useRef } from 'react';
import { Home, BookOpen, CheckCircle2, AlertCircle, Brain, FileText, HelpCircle } from 'lucide-react';
import type { Question, Subject } from '../types';
import { QuestionView } from './QuestionView';
import { PdfViewer } from './PdfViewer';
import { ResultsView } from './ResultsView';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';

// Interfaz para sesión restaurada
interface ResumeSession {
  subject: Subject;
  mode: 'REVIEW';
  currentQuestionIndex: number;
  questionIds: string[];
  answers: Record<number, string>;
  totalQuestions: number;
}

interface ReviewModeProps {
  subject: Subject;
  onExit: () => void;
  questionCount?: number;
  onSessionChange?: (session: any | null) => void;
  resumeSession?: ResumeSession;
}

interface ReadingText {
  id: number;
  title: string;
  pdf_url: string;
  page_start: number;
  page_end: number;
}

export function ReviewMode({ subject, onExit, questionCount = 0, onSessionChange, resumeSession }: ReviewModeProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([]);
  const [answersRecord, setAnswersRecord] = useState<Record<string, string>>({});
  
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [sessionCreated, setSessionCreated] = useState(false);

  const [activeTab, setActiveTab] = useState<'questions' | 'text'>('questions');
  const [readingTexts, setReadingTexts] = useState<Record<number, ReadingText>>({});
  const lastReadingTextId = useRef<number | null>(null);

  const currentQuestion = questionQueue[currentQuestionIndex] || null;
  const isLanguageQuestion = currentQuestion?.subject === 'L';
  const currentReadingText = currentQuestion?.reading_text_id 
    ? readingTexts[currentQuestion.reading_text_id] 
    : null;

  const hasQuestionLimit = questionCount > 0;
  const effectiveLimit = hasQuestionLimit ? questionCount : questionQueue.length;

  // Función para guardar sesión al salir
  const handleExitWithSave = () => {
    if (onSessionChange && questionQueue.length > 0 && !isFinished) {
      // Guardar sesión actual
      onSessionChange({
        subject,
        mode: 'REVIEW',
        currentQuestionIndex,
        timeRemaining: 999999, // ReviewMode no tiene tiempo límite
        totalQuestions: effectiveLimit,
        questionIds: questionQueue.map(q => q.id),
        answers: answersRecord,
      });
    }
    onExit();
  };

  // Preparar cola de preguntas
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const questions = await getQuestionsBySubject(subject);
        
        if (questions.length === 0) {
          toast.error('No hay preguntas disponibles para esta materia');
          setIsFinished(true);
          setLoading(false);
          return;
        }

        // Verificar si hay sesión para restaurar
        if (resumeSession && resumeSession.questionIds && resumeSession.questionIds.length > 0) {
          // Restaurar sesión: ordenar preguntas según questionIds guardados
          const questionMap = new Map(questions.map(q => [q.id, q]));
          const restoredQueue = resumeSession.questionIds
            .map(id => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);

          if (restoredQueue.length > 0) {
            // Para Lenguaje: cargar textos de lectura
            if (subject === 'L') {
              await loadReadingTexts(restoredQueue);
            }
            
            setQuestionQueue(restoredQueue);
            setCurrentQuestionIndex(resumeSession.currentQuestionIndex);
            
            // Restaurar respuestas anteriores
            if (resumeSession.answers) {
              setAnswersRecord(resumeSession.answers as Record<string, string>);
              const answeredCount = Object.keys(resumeSession.answers).length;
              setQuestionsAnswered(answeredCount);
              
              // Reconstruir answeredQuestions y correctAnswers
              const answered: Question[] = [];
              let correct = 0;
              for (let i = 0; i < answeredCount; i++) {
                const q = restoredQueue[i];
                if (q && resumeSession.answers[i]) {
                  answered.push(q);
                  if (resumeSession.answers[i] === q.correctAnswer) {
                    correct++;
                  }
                }
              }
              setAnsweredQuestions(answered);
              setCorrectAnswers(correct);
            }
            
            // Limpiar la sesión guardada ya que la estamos restaurando
            if (onSessionChange) {
              onSessionChange(null);
            }
            
            setLoading(false);
            return;
          }
        }

        // Para Lenguaje: agrupar por reading_text_id y ordenar
        let orderedQuestions: Question[];
        if (subject === 'L') {
          await loadReadingTexts(questions);
          orderedQuestions = orderLanguageQuestions(questions);
        } else {
          // Para otras materias: barajar aleatoriamente
          orderedQuestions = shuffleArray([...questions]);
        }

        // Aplicar límite si existe
        const limitedQuestions = hasQuestionLimit 
          ? orderedQuestions.slice(0, questionCount)
          : orderedQuestions;

        setQuestionQueue(limitedQuestions);

        // Crear sesión
        if (user) {
          const { error: sessionError } = await supabase.from('user_sessions').insert({
            id: sessionId,
            user_id: user.id,
            subject,
            mode: 'REVIEW',
            questions_total: 0,
            questions_correct: 0,
            time_spent: 0
          });

          if (sessionError) {
            console.error('Error creating session:', sessionError);
          } else {
            setSessionCreated(true);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar las preguntas');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, subject, questionCount]);

  // Ordenar preguntas de Lenguaje por texto
  const orderLanguageQuestions = (questions: Question[]): Question[] => {
    // Agrupar por reading_text_id
    const byText: Record<number, Question[]> = {};
    const noText: Question[] = [];

    questions.forEach(q => {
      if (q.reading_text_id) {
        if (!byText[q.reading_text_id]) {
          byText[q.reading_text_id] = [];
        }
        byText[q.reading_text_id].push(q);
      } else {
        noText.push(q);
      }
    });

    // Ordenar preguntas dentro de cada texto por question_number
    Object.values(byText).forEach(group => {
      group.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
    });

    // Barajar el orden de los textos
    const textIds = shuffleArray(Object.keys(byText).map(Number));
    
    // Construir cola: todas las preguntas de un texto juntas
    const result: Question[] = [];
    textIds.forEach(textId => {
      result.push(...byText[textId]);
    });
    
    // Agregar preguntas sin texto al final (barajadas)
    result.push(...shuffleArray(noText));
    
    return result;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadReadingTexts = async (questions: Question[]) => {
    try {
      const textIds = [...new Set(
        questions
          .filter(q => q.reading_text_id)
          .map(q => q.reading_text_id)
      )];

      if (textIds.length === 0) return;

      const { data: texts, error } = await supabase
        .from('reading_texts')
        .select('*')
        .in('id', textIds);

      if (error) throw error;

      const textsMap: Record<number, ReadingText> = {};
      texts?.forEach(text => {
        textsMap[text.id] = text;
      });
      setReadingTexts(textsMap);
    } catch (error) {
      console.error('Error loading reading texts:', error);
    }
  };

  // Mostrar texto cuando cambia a un nuevo reading_text_id
  useEffect(() => {
    if (currentQuestion?.reading_text_id && 
        currentQuestion.reading_text_id !== lastReadingTextId.current) {
      setActiveTab('text');
      lastReadingTextId.current = currentQuestion.reading_text_id;
    }
  }, [currentQuestion?.reading_text_id]);

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;

    setCurrentAnswer(answer);
    setShowExplanation(true);
    
    const questionIndex = answeredQuestions.length;
    setAnsweredQuestions(prev => [...prev, currentQuestion]);
    setAnswersRecord(prev => ({ ...prev, [questionIndex]: answer }));
    
    setQuestionsAnswered(prev => prev + 1);

    const isCorrect = answer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    saveAttempt(answer, isCorrect);
  };

  const saveAttempt = async (answer: string, isCorrect: boolean) => {
    if (!user || !currentQuestion || !sessionCreated) return;

    try {
      const { error } = await supabase.from('question_attempts').insert({
        user_id: user.id,
        session_id: sessionId,
        question_id: currentQuestion.id,
        subject: currentQuestion.subject,
        selected_answer: answer,
        is_correct: isCorrect,
        time_spent: 0
      });

      if (error) {
        console.error('Error saving attempt:', error);
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  const handleNext = () => {
    setCurrentAnswer(null);
    setShowExplanation(false);

    if (currentQuestionIndex + 1 >= effectiveLimit) {
      saveSession();
      setIsFinished(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleStop = () => {
    saveSession();
    // Limpiar sesión guardada al terminar voluntariamente
    if (onSessionChange) {
      onSessionChange(null);
    }
    setIsFinished(true);
  };

  const saveSession = async () => {
    if (!user || !sessionCreated) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const { error } = await supabase.from('user_sessions')
        .update({
          questions_total: questionsAnswered,
          questions_correct: correctAnswers,
          time_spent: timeSpent
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session:', error);
        toast.error('Error al guardar la sesión');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error al guardar la sesión');
    }
  };

  const getSubjectName = (subjectCode: string) => {
    switch (subjectCode) {
      case 'M1': return 'Matemática 1';
      case 'M2': return 'Matemática 2';
      case 'L': return 'Lenguaje';
      case 'C': return 'Ciencias';
      case 'CB': return 'Ciencias - Biología';
      case 'CF': return 'Ciencias - Física';
      case 'CQ': return 'Ciencias - Química';
      case 'H': return 'Historia';
      default: return subjectCode;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Cargando preguntas...</div>
      </div>
    );
  }

  if (isFinished) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    if (answeredQuestions.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Sin preguntas
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8">
            <div className="flex justify-center mb-6">
              <Brain className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-xl text-gray-800 dark:text-gray-100">
              No hay preguntas disponibles para esta materia.
            </p>
          </div>
          <button
            onClick={onExit}
            className={`${colors.primary} text-white px-6 py-3 rounded-lg ${colors.primaryHover} transition-colors`}
          >
            Volver al inicio
          </button>
        </div>
      );
    }
    
    return (
      <ResultsView
        questions={answeredQuestions}
        answers={answersRecord}
        timeSpent={timeSpent}
        onExit={onExit}
      />
    );
  }

  if (!currentQuestion) {
    return <div className="text-gray-600 dark:text-gray-300">Cargando pregunta...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExitWithSave}
            className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </button>
          <div className={`flex items-center ${colors.primaryText}`}>
            <BookOpen className="h-5 w-5 mr-2" />
            <span>Modo Repaso</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {correctAnswers}/{questionsAnswered} correctas
            <span className={`ml-2 ${colors.primaryText}`}>
              ({currentQuestionIndex + 1}/{effectiveLimit})
            </span>
          </span>
          <button
            onClick={handleStop}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Terminar
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progreso</span>
          <span>Pregunta {currentQuestionIndex + 1} de {effectiveLimit}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`${colors.primary} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${((currentQuestionIndex + 1) / effectiveLimit) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
        Materia: {getSubjectName(subject)}
        {currentReadingText && (
          <span className={`ml-2 ${colors.primaryText}`}>• {currentReadingText.title}</span>
        )}
      </div>

      {isLanguageQuestion && currentReadingText && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'text'
                ? `${colors.tabActive} border-b-2 ${colors.tabActiveBg}`
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Texto
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'questions'
                ? `${colors.tabActive} border-b-2 ${colors.tabActiveBg}`
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Pregunta
          </button>
        </div>
      )}

      {isLanguageQuestion && currentReadingText && activeTab === 'text' ? (
        <PdfViewer
          pdfUrl={currentReadingText.pdf_url}
          pageStart={currentReadingText.page_start}
          pageEnd={currentReadingText.page_end}
          title={currentReadingText.title}
        />
      ) : (
        <>
          <QuestionView
            question={currentQuestion}
            currentAnswer={currentAnswer}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />

          {showExplanation && (
            <div className="mt-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {currentAnswer === currentQuestion.correctAnswer ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-semibold">¡Respuesta Correcta!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Respuesta Incorrecta - La correcta es: {currentQuestion.correctAnswer.toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              {currentQuestion.explanation && (
                <div className={`mb-4 p-4 ${colors.primaryLight} rounded-lg border ${colors.primaryBorder.replace('border-', 'border-').replace('500', '200')} dark:border-opacity-50`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className={`h-5 w-5 ${colors.primaryText}`} />
                    <h4 className={`font-semibold ${colors.primaryText}`}>Explicación</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{currentQuestion.explanation}</p>
                </div>
              )}

              <button
                onClick={handleNext}
                className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}
              >
                {currentQuestionIndex + 1 >= effectiveLimit
                  ? 'Ver Resultados' 
                  : 'Siguiente Pregunta'
                }
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}