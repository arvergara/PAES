import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { PdfViewer } from './PdfViewer';
import { ResultsView } from './ResultsView';
import { AlertCircle, CheckCircle2, Home, FileText, HelpCircle, Send, Loader2, BookOpen } from 'lucide-react';
import type { Question, Subject } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';
import { useImagePreloader } from '../hooks/useImagePreloader';

interface ReadingText {
  id: number;
  title: string;
  pdf_url: string;
  page_start: number;
  page_end: number;
}

interface TestModeProps {
  timePerQuestion?: number;
  subject: Subject;
  onExit: () => void;
}

export function TestMode({ subject, onExit, timePerQuestion = 2.5 }: TestModeProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  
  // Generar sessionId al inicio (como PAESMode)
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  
  // Guardar attempts en memoria para insertarlos al final
  const questionAttemptsRef = useRef<Array<{
    question_id: string;
    subject: string;
    area_tematica: string;
    tema: string;
    subtema: string;
    answer: string;
    is_correct: boolean;
    time_spent: number;
  }>>([]);
  
  // Estados para textos de lectura
  const [activeTab, setActiveTab] = useState<'text' | 'questions'>('text');
  const [readingTexts, setReadingTexts] = useState<Record<number, ReadingText>>({});
  const [previousReadingTextId, setPreviousReadingTextId] = useState<number | null>(null);
  
  // Estados para explicaciones
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLanguageQuestion = currentQuestion?.subject === 'L';
  const currentReadingText = currentQuestion?.reading_text_id 
    ? readingTexts[currentQuestion.reading_text_id] 
    : null;
  const isCurrentAnswerSubmitted = submittedAnswers[currentQuestionIndex] || false;

  // Precargar imágenes
  const nextImageUrls = questions
    .slice(currentQuestionIndex, currentQuestionIndex + 4)
    .map(q => q.image_url);
  useImagePreloader(nextImageUrls);

  const fetchExplanation = async (question: Question) => {
    console.log("fetchExplanation called for:", question.id, question.subject);
    console.log("question.explanation in memory:", question.explanation);
    if (question.explanation) {
      setCurrentExplanation(question.explanation);
      return;
    }

    if (!question.id) {
      setCurrentExplanation(null);
      return;
    }

    setIsLoadingExplanation(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('explanation')
        .eq('id', question.id)
        .maybeSingle();
      
      if (error) {
        setCurrentExplanation(null);
      } else {
        console.log("Explanation from DB:", data?.explanation);
        setCurrentExplanation(data?.explanation || null);
      }
    } catch (err) {
      setCurrentExplanation(null);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const loadReadingTexts = async (languageQuestions: Question[]) => {
    try {
      const textIds = [...new Set(
        languageQuestions
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

  const loadQuestions = useCallback(async () => {
    try {
      let selectedQuestions: Question[] = [];

      if (subject === 'ALL') {
        const [m1Questions, m2Questions, lQuestions, cQuestions, hQuestions] = await Promise.all([
          getQuestionsBySubject('M1'),
          getQuestionsBySubject('M2'),
          getQuestionsBySubject('L'),
          getQuestionsBySubject('C'),
          getQuestionsBySubject('H')
        ]);

        selectedQuestions = [
          ...m1Questions.slice(0, 2),
          ...m2Questions.slice(0, 2),
          ...lQuestions.slice(0, 2),
          ...cQuestions.slice(0, 2),
          ...hQuestions.slice(0, 2)
        ].sort(() => Math.random() - 0.5);
      } else {
        const subjectQuestions = await getQuestionsBySubject(subject);
        
        if (!subjectQuestions.length) {
          throw new Error(`No hay preguntas disponibles para ${subject}`);
        }

        selectedQuestions = subjectQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
      }

      return selectedQuestions;
    } catch (error) {
      throw error;
    }
  }, [subject]);

  // Initialize test session
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        const selectedQuestions = await loadQuestions();
        if (!mounted) return;

        setQuestions(selectedQuestions);
        setQuestionStartTime(Date.now());

        const lQuestions = selectedQuestions.filter(q => q.subject === 'L');
        if (lQuestions.length > 0) {
          await loadReadingTexts(lQuestions);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing test:', error);
        setError(error instanceof Error ? error.message : 'Error al inicializar el test');
        toast.error('Error al inicializar el test');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [subject, loadQuestions]);

  // Cambiar a tab de texto cuando cambia el texto de lectura
  useEffect(() => {
    if (currentQuestion?.reading_text_id && currentQuestion.reading_text_id !== previousReadingTextId) {
      setActiveTab('text');
      setPreviousReadingTextId(currentQuestion.reading_text_id);
    }
  }, [currentQuestion?.reading_text_id, previousReadingTextId]);

  // Guardar attempt en memoria (no en DB todavía)
  const saveQuestionAttempt = (answer: string, isCorrect: boolean) => {
    const question = questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    questionAttemptsRef.current.push({
      question_id: question.id,
      subject: question.subject,
      area_tematica: question.area_tematica || question.areaTematica || '',
      tema: question.tema || '',
      subtema: question.subtema || '',
      answer,
      is_correct: isCorrect,
      time_spent: timeSpent
    });
  };

  // Guardar sesión completa al final (como PAESMode)
  const saveSession = async () => {
    if (!user) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Calcular respuestas correctas desde los attempts guardados
    const correctCount = questionAttemptsRef.current.filter(a => a.is_correct).length;

    console.log('Saving session:', {
      sessionId,
      correctCount,
      timeSpent,
      totalQuestions: questions.length,
      attempts: questionAttemptsRef.current.length
    });

    try {
      // Insertar sesión (como PAESMode)
      const { error: sessionError } = await supabase.from('user_sessions').insert({
        id: sessionId,
        user_id: user.id,
        subject,
        mode: 'TEST',
        questions_total: questions.length,
        questions_correct: correctCount,
        time_spent: timeSpent
      });

      if (sessionError) {
        console.error('Session insert error:', sessionError);
        throw sessionError;
      }

      console.log('Session saved successfully');

      // Insertar todos los attempts
      if (questionAttemptsRef.current.length > 0) {
        const attempts = questionAttemptsRef.current.map(attempt => ({
          user_id: user.id,
          session_id: sessionId,
          question_id: attempt.question_id,
          subject: attempt.subject,
          mode: 'TEST',
          area_tematica: attempt.area_tematica,
          tema: attempt.tema,
          subtema: attempt.subtema,
          answer: attempt.answer,
          is_correct: attempt.is_correct,
          time_spent: attempt.time_spent
        }));

        const { error: attemptsError } = await supabase
          .from('question_attempts')
          .insert(attempts);

        if (attemptsError) {
          console.error('Attempts insert error:', attemptsError);
          throw attemptsError;
        }

        console.log('Attempts saved successfully');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error al guardar la sesión');
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (isCurrentAnswerSubmitted) return;
    
    setCurrentAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer) return;
    
    const question = questions[currentQuestionIndex];
    const isCorrect = currentAnswer === question.correctAnswer;

    setSubmittedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: true
    }));

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setShowExplanation(true);
    fetchExplanation(question);
    
    // Guardar attempt en memoria
    saveQuestionAttempt(currentAnswer, isCorrect);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || null);
      setShowExplanation(submittedAnswers[nextIndex] || false);
      setQuestionStartTime(Date.now());
      setCurrentExplanation(null);
      
      if (submittedAnswers[nextIndex]) {
        fetchExplanation(questions[nextIndex]);
      }
    } else {
      // Terminar examen - guardar sesión completa
      setEndTime(Date.now());
      await saveSession();
      setIsFinished(true);
    }
  };

  const handleTimeUp = async () => {
    if (!isCurrentAnswerSubmitted && currentAnswer) {
      await handleSubmitAnswer();
    }
  };

  const handleRetry = () => {
    // Reset attempts
    questionAttemptsRef.current = [];
    
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubmittedAnswers({});
    setCorrectAnswers(0);
    setIsFinished(false);
    setEndTime(null);
    setLoading(true);
    
    loadQuestions().then((selectedQuestions) => {
      setQuestions(selectedQuestions);
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Cargando preguntas...</div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">{error || 'No hay preguntas disponibles en este momento.'}</p>
        <button
          onClick={onExit}
          className={`${colors.primary} text-white px-6 py-2 rounded-lg ${colors.primaryHover} transition-colors`}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (isFinished) {
    const answersForResults: Record<string, string> = {};
    Object.entries(answers).forEach(([key, value]) => {
      answersForResults[key] = value;
    });
    
    const timeSpent = endTime ? Math.round((endTime - startTime) / 1000) : 0;
    
    return (
      <ResultsView 
        questions={questions} 
        answers={answersForResults} 
        timeSpent={timeSpent} 
        onExit={onExit}
        onRetry={handleRetry}
      />
    );
  }

  const totalQuestions = questions.length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </button>
          <Timer
            totalMinutes={timePerQuestion}
            onTimeUp={handleTimeUp}
            resetKey={currentQuestion.id}
          />
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions}
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
        Materia: {
          subject === 'M1' ? 'Matemática 1' :
          subject === 'M2' ? 'Matemática 2' :
          subject === 'L' ? 'Lenguaje' :
          subject === 'C' ? 'Ciencias' :
          subject === 'CB' ? 'Ciencias - Biología' :
          subject === 'CF' ? 'Ciencias - Física' :
          subject === 'CQ' ? 'Ciencias - Química' :
          subject === 'H' ? 'Historia' :
          'Materia desconocida'
        }
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
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Pregunta
          </button>
        </div>
      )}

      <div className="flex-grow">
        {isLanguageQuestion && currentReadingText && activeTab === 'text' ? (
          <PdfViewer
            pdfUrl={currentReadingText.pdf_url}
            pageStart={currentReadingText.page_start}
            pageEnd={currentReadingText.page_end}
            title={currentReadingText.title}
          />
        ) : (
          <QuestionView
            question={currentQuestion}
            currentAnswer={currentAnswer}
            onAnswer={handleSelectAnswer}
            showExplanation={showExplanation}
          />
        )}
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        {!isCurrentAnswerSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer}
            className={`w-full px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              currentAnswer
                ? `${colors.primary} text-white ${colors.primaryHover}`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            Contestar
          </button>
        ) : (
          <>
            <div className="flex items-center justify-center space-x-2 mb-4">
              {currentAnswer === currentQuestion.correctAnswer ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-green-600 font-semibold">¡Respuesta Correcta!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-600 font-semibold">
                    Respuesta Incorrecta - La correcta es: {currentQuestion.correctAnswer.toUpperCase()}
                  </span>
                </>
              )}
            </div>

            <div className={`mb-4 p-4 ${colors.primaryLight} rounded-lg border ${colors.primaryBorder.replace('border-', 'border-').replace('500', '200')} dark:border-opacity-50`}>
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className={`h-5 w-5 ${colors.primaryText}`} />
                <h4 className={`font-semibold ${colors.primaryText}`}>Explicación</h4>
              </div>
              
              {isLoadingExplanation ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando explicación...</span>
                </div>
              ) : currentExplanation ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{currentExplanation}</p>
              ) : (
                <p className="text-gray-500 italic">
                  No hay explicación disponible para esta pregunta.
                </p>
              )}
            </div>

            <button
              onClick={handleNext}
              className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}
            >
              {currentQuestionIndex === totalQuestions - 1 ? 'Ver Resultados' : 'Siguiente Pregunta'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
