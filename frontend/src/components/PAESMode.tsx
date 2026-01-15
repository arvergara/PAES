import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { ResultsView } from './ResultsView';
import { PdfViewer } from './PdfViewer';
import { Home, FileText, HelpCircle, BookOpen } from 'lucide-react';
import type { Question, Subject, ReadingText } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';
import type { PausedSession } from '../hooks/useTestSession';

interface PAESModeProps {
  subject: Subject;
  onExit: () => void;
  timePerQuestion?: number;
  questionCount?: number;
  resumeSession?: PausedSession | null;
  onSessionChange?: (session: Omit<PausedSession, 'pausedAt' | 'subjectLabel'> | null) => void;
}

type TabType = 'texto' | 'preguntas';

export function PAESMode({ 
  subject, 
  onExit, 
  timePerQuestion = 2.16, 
  questionCount = 15,
  resumeSession,
  onSessionChange
}: PAESModeProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number | undefined>(undefined);
  const [isRestoring, setIsRestoring] = useState(!!resumeSession);

  // Estado para textos de lectura (Lenguaje)
  const [readingTexts, setReadingTexts] = useState<Record<number, ReadingText>>({});
  const [activeTab, setActiveTab] = useState<TabType>('preguntas');
  const [showTextFirst, setShowTextFirst] = useState(false);
  const lastReadingTextId = useRef<number | null>(null);

  const isLanguageSubject = subject === 'L';

  const handleTimerTick = useCallback((timeLeft: number) => {
    setCurrentTimeRemaining(timeLeft);
  }, []);

  const saveSessionState = useCallback(() => {
    if (onSessionChange && questions.length > 0 && !isFinished) {
      onSessionChange({
        subject,
        mode: 'PAES',
        currentQuestionIndex,
        timeRemaining: currentTimeRemaining,
        answers,
        questionIds: questions.map(q => q.id),
        startTime,
        totalQuestions: questions.length,
        currentTopic: questions[currentQuestionIndex]?.tema,
      });
    }
  }, [onSessionChange, questions, isFinished, subject, currentQuestionIndex, currentTimeRemaining, answers, startTime]);

  const clearSessionState = useCallback(() => {
    if (onSessionChange) {
      onSessionChange(null);
    }
  }, [onSessionChange]);

  const handleExitWithSave = useCallback(() => {
    saveSessionState();
    onExit();
  }, [saveSessionState, onExit]);

  const loadQuestionsByIds = useCallback(async (questionIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No se pudieron cargar las preguntas de la sesión');
      }

      const orderedQuestions = questionIds
        .map(id => data.find(q => q.id === id))
        .filter((q): q is Question => q !== undefined);

      return orderedQuestions;
    } catch (error) {
      console.error('Error loading questions by IDs:', error);
      throw error;
    }
  }, []);

  // Cargar textos de lectura para preguntas de Lenguaje
  const loadReadingTexts = useCallback(async (questions: Question[]) => {
    if (!isLanguageSubject) return;

    const readingTextIds = [...new Set(
      questions
        .filter(q => q.reading_text_id)
        .map(q => q.reading_text_id!)
    )];

    if (readingTextIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('reading_texts')
        .select('*')
        .in('id', readingTextIds);

      if (error) throw error;

      const textsMap: Record<number, ReadingText> = {};
      data?.forEach(text => {
        textsMap[text.id] = text;
      });
      setReadingTexts(textsMap);
    } catch (err) {
      console.error('Error loading reading texts:', err);
    }
  }, [isLanguageSubject]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      if (resumeSession && resumeSession.questionIds.length > 0) {
        const restoredQuestions = await loadQuestionsByIds(resumeSession.questionIds);
        setQuestions(restoredQuestions);
        await loadReadingTexts(restoredQuestions);
        
        setCurrentQuestionIndex(resumeSession.currentQuestionIndex);
        setAnswers(resumeSession.answers);
        setInitialTime(resumeSession.timeRemaining);
        setCurrentTimeRemaining(resumeSession.timeRemaining);
        
        toast.success('Sesión restaurada', { duration: 2000 });
        setIsRestoring(false);
        return;
      }

      if (subject === 'ALL') {
        const [m1Questions, m2Questions, lQuestions, cQuestions] = await Promise.all([
          getQuestionsBySubject('M1'),
          getQuestionsBySubject('M2'),
          getQuestionsBySubject('L'),
          getQuestionsBySubject('C')
        ]);
        if (!m1Questions.length || !m2Questions.length || !lQuestions.length || !cQuestions.length) {
          throw new Error('No hay suficientes preguntas disponibles para todas las materias');
        }
        const questionsPerSubject = Math.ceil(questionCount / 4);
        const selectedQuestions = [
          ...m1Questions.slice(0, questionsPerSubject),
          ...m2Questions.slice(0, questionsPerSubject),
          ...lQuestions.slice(0, questionsPerSubject),
          ...cQuestions.slice(0, questionsPerSubject)
        ].slice(0, questionCount).sort(() => Math.random() - 0.5);
        setQuestions(selectedQuestions);
        await loadReadingTexts(selectedQuestions);
      } else if (isLanguageSubject) {
        // Para Lenguaje: agrupar por reading_text_id y seleccionar un grupo completo
        const subjectQuestions = await getQuestionsBySubject(subject);
        if (!subjectQuestions.length) throw new Error(`No hay preguntas disponibles para ${subject}`);

        // Agrupar por reading_text_id
        const byText: Record<number, Question[]> = {};
        const noText: Question[] = [];
        
        subjectQuestions.forEach(q => {
          if (q.reading_text_id) {
            if (!byText[q.reading_text_id]) {
              byText[q.reading_text_id] = [];
            }
            byText[q.reading_text_id].push(q);
          } else {
            noText.push(q);
          }
        });

        // Seleccionar grupos de textos hasta completar questionCount
        const textIds = Object.keys(byText).map(Number);
        const shuffledTextIds = textIds.sort(() => Math.random() - 0.5);
        
        let selectedQuestions: Question[] = [];
        for (const textId of shuffledTextIds) {
          if (selectedQuestions.length >= questionCount) break;
          const textQuestions = byText[textId].sort((a, b) => 
            (a.question_number || 0) - (b.question_number || 0)
          );
          selectedQuestions = [...selectedQuestions, ...textQuestions];
        }

        // Si no hay suficientes, agregar preguntas sin texto
        if (selectedQuestions.length < questionCount && noText.length > 0) {
          const remaining = questionCount - selectedQuestions.length;
          selectedQuestions = [
            ...selectedQuestions,
            ...noText.sort(() => Math.random() - 0.5).slice(0, remaining)
          ];
        }

        selectedQuestions = selectedQuestions.slice(0, questionCount);
        setQuestions(selectedQuestions);
        await loadReadingTexts(selectedQuestions);

        // Si la primera pregunta tiene texto, mostrar el texto primero
        if (selectedQuestions[0]?.reading_text_id) {
          setShowTextFirst(true);
          setActiveTab('texto');
        }
      } else {
        const subjectQuestions = await getQuestionsBySubject(subject);
        if (!subjectQuestions.length) throw new Error(`No hay preguntas disponibles para ${subject}`);
        const selectedQuestions = subjectQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);
        setQuestions(selectedQuestions);
      }
      
      setIsRestoring(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar las preguntas');
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); }, [subject, questionCount]);

  // Detectar cambio de texto de lectura
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (isLanguageSubject && currentQuestion?.reading_text_id) {
      if (currentQuestion.reading_text_id !== lastReadingTextId.current) {
        lastReadingTextId.current = currentQuestion.reading_text_id;
        // Mostrar texto cuando cambia a un nuevo texto de lectura
        if (!isRestoring) {
          setShowTextFirst(true);
          setActiveTab('texto');
        }
      }
    }
  }, [currentQuestionIndex, questions, isLanguageSubject, isRestoring]);

  const saveSession = async () => {
    if (!user) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const correctAnswers = Object.entries(answers).reduce((count, [index, answer]) => {
      const question = questions[parseInt(index)];
      return count + (answer === question.correctAnswer ? 1 : 0);
    }, 0);
    try {
      const { error: sessionError } = await supabase.from('user_sessions').insert({
        id: sessionId, user_id: user.id, subject, mode: 'PAES',
        questions_total: questions.length, questions_correct: correctAnswers, time_spent: timeSpent
      });
      if (sessionError) throw sessionError;
      const attempts = Object.entries(answers).map(([index, answer]) => {
        const question = questions[parseInt(index)];
        return {
          user_id: user.id, session_id: sessionId, question_id: question.id, subject: question.subject,
          mode: 'PAES', area_tematica: question.areaTematica || question.area_tematica,
          tema: question.tema, subtema: question.subtema, answer,
          is_correct: answer === question.correctAnswer, time_spent: Math.round(timeSpent / questions.length)
        };
      });
      const { error: attemptsError } = await supabase.from('question_attempts').insert(attempts);
      if (attemptsError) throw attemptsError;
      
      clearSessionState();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error al guardar la sesión');
    }
  };

  const handleAnswer = (answer: string) => setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  
  const handleNext = () => { 
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };
  
  const handlePrevious = () => { 
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  
  const handleFinish = async () => { 
    setEndTime(Date.now()); 
    await saveSession(); 
    setIsFinished(true); 
  };
  
  const handleTimeUp = async () => { 
    setEndTime(Date.now()); 
    await saveSession(); 
    setIsFinished(true); 
  };
  
  const handleRetry = () => {
    setQuestions([]); 
    setCurrentQuestionIndex(0); 
    setAnswers({}); 
    setIsFinished(false);
    setEndTime(null); 
    setSessionId(crypto.randomUUID()); 
    setInitialTime(undefined);
    setReadingTexts({});
    setActiveTab('preguntas');
    setShowTextFirst(false);
    lastReadingTextId.current = null;
    clearSessionState();
    loadQuestions();
  };

  const handleStartQuestions = () => {
    setShowTextFirst(false);
    setActiveTab('preguntas');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600 dark:text-gray-300">
        {isRestoring ? 'Restaurando sesión...' : 'Cargando preguntas...'}
      </div>
    </div>
  );

  if (error || !questions.length) return (
    <div className="text-center">
      <p className="text-red-600 mb-4">{error || 'No hay preguntas disponibles en este momento.'}</p>
      <button onClick={onExit} className={`${colors.primary} text-white px-6 py-2 rounded-lg ${colors.primaryHover} transition-colors`}>Volver al inicio</button>
    </div>
  );

  if (isFinished) {
    const timeSpent = endTime ? Math.round((endTime - startTime) / 1000) : 0;
    return <ResultsView questions={questions} answers={answers} timeSpent={timeSpent} onExit={onExit} onRetry={handleRetry} />;
  }

  const totalMinutes = Math.round(questions.length * timePerQuestion);
  const currentQuestion = questions[currentQuestionIndex];
  const currentReadingText = currentQuestion?.reading_text_id 
    ? readingTexts[currentQuestion.reading_text_id] 
    : null;
  const hasReadingText = isLanguageSubject && currentReadingText?.pdf_url;

  // Vista con texto de lectura para Lenguaje
  if (hasReadingText) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleExitWithSave} 
              className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}
            >
              <Home className="h-5 w-5" /><span>Inicio</span>
            </button>
            <Timer 
              totalMinutes={totalMinutes} 
              onTimeUp={handleTimeUp} 
              onTick={handleTimerTick}
              initialTimeSeconds={initialTime}
            />
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
        </div>

        {/* Info del texto */}
        {currentReadingText && (
          <div className={`mb-4 px-4 py-2 ${colors.primaryLight} rounded-lg flex items-center gap-2`}>
            <BookOpen className="w-5 h-5" style={{ color: colors.primaryText.includes('text-') ? undefined : colors.primaryText }} />
            <span className={`font-medium ${colors.primaryText}`}>📖 {currentReadingText.title}</span>
            {currentReadingText.source && (
              <span className={`${colors.primaryText} text-sm ml-2 opacity-75`}>({currentReadingText.source})</span>
            )}
          </div>
        )}

        {/* Mostrar texto primero si es nuevo */}
        {showTextFirst ? (
          <>
            <div className={`mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg`}>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <BookOpen className="w-5 h-5" />
                <span>Lee el texto con atención antes de responder las preguntas.</span>
              </div>
            </div>

            <div className="flex-grow">
              <PdfViewer 
                pdfUrl={currentReadingText!.pdf_url!} 
                pageStart={currentReadingText!.page_start} 
                pageEnd={currentReadingText!.page_end} 
                title={currentReadingText!.title}
                timeLeft={currentTimeRemaining}
                isReadingPhase={true}
              />
            </div>

            <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
              <button 
                onClick={handleStartQuestions} 
                className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors flex items-center justify-center gap-2 shadow-md`}
              >
                <HelpCircle className="w-5 h-5" />
                Estoy listo, ir a las preguntas
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('texto')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'texto'
                    ? `${colors.tabActive} border-b-2 ${colors.tabActiveBg}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <FileText className="w-5 h-5" />
                Texto
              </button>
              <button
                onClick={() => setActiveTab('preguntas')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'preguntas'
                    ? `${colors.tabActive} border-b-2 ${colors.tabActiveBg}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                Preguntas
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-grow">
              {activeTab === 'texto' ? (
                <PdfViewer 
                  pdfUrl={currentReadingText!.pdf_url!} 
                  pageStart={currentReadingText!.page_start} 
                  pageEnd={currentReadingText!.page_end} 
                  title={currentReadingText!.title}
                  timeLeft={currentTimeRemaining}
                  isReadingPhase={false}
                />
              ) : (
                <>
                  <div className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Materia: Lenguaje
                  </div>
                  <QuestionView 
                    question={currentQuestion} 
                    currentAnswer={answers[currentQuestionIndex] || null} 
                    onAnswer={handleAnswer} 
                  />
                </>
              )}
            </div>

            {/* Footer con navegación */}
            <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
              {activeTab === 'texto' ? (
                <button 
                  onClick={() => setActiveTab('preguntas')} 
                  className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors shadow-md`}
                >
                  Ir a las Preguntas
                </button>
              ) : (
                <div className="flex justify-between">
                  <button 
                    onClick={handlePrevious} 
                    disabled={currentQuestionIndex === 0} 
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {currentQuestionIndex === questions.length - 1 ? (
                    <button 
                      onClick={handleFinish} 
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Finalizar
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext} 
                      className={`px-6 py-2 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}
                    >
                      Siguiente
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Vista normal (sin texto de lectura)
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExitWithSave} 
            className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}
          >
            <Home className="h-5 w-5" /><span>Inicio</span>
          </button>
          <Timer 
            totalMinutes={totalMinutes} 
            onTimeUp={handleTimeUp} 
            onTick={handleTimerTick}
            initialTimeSeconds={initialTime}
          />
        </div>
        <div className="text-gray-600 dark:text-gray-300">Pregunta {currentQuestionIndex + 1} de {questions.length}</div>
      </div>
      <div className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
        Materia: {currentQuestion.subject === 'M1' ? 'Matemática 1' : currentQuestion.subject === 'M2' ? 'Matemática 2' : currentQuestion.subject === 'L' ? 'Lenguaje' : 'Ciencias'}
      </div>
      <QuestionView question={currentQuestion} currentAnswer={answers[currentQuestionIndex] || null} onAnswer={handleAnswer} />
      <div className="flex justify-between mt-8">
        <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button onClick={handleFinish} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Finalizar</button>
        ) : (
          <button onClick={handleNext} className={`px-6 py-2 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}>Siguiente</button>
        )}
      </div>
    </div>
  );
}