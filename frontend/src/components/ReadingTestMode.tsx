import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { PdfViewer } from './PdfViewer';
import { AlertCircle, CheckCircle2, Home, FileText, HelpCircle, BookOpen, Clock } from 'lucide-react';
import type { Question, Subject, ReadingText } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { PausedSession } from '../hooks/useTestSession';
import toast from 'react-hot-toast';

interface ReadingTestModeProps {
  subject: Subject;
  onExit: () => void;
  timePerQuestion?: number;
  readingTime?: number;
  resumeSession?: PausedSession | null;
  onSessionChange?: (session: Omit<PausedSession, 'pausedAt' | 'subjectLabel'> | null) => void;
}

type Phase = 'reading' | 'questions';
type TabType = 'texto' | 'preguntas';

export function ReadingTestMode({ 
  subject, 
  onExit, 
  timePerQuestion = 2.5,
  readingTime = 5,
  resumeSession,
  onSessionChange
}: ReadingTestModeProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  
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
  
  const [currentReading, setCurrentReading] = useState<ReadingText | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('texto');
  
  const [phase, setPhase] = useState<Phase>('reading');
  const [questionTimerKey, setQuestionTimerKey] = useState(0);
  
  const [currentTimeLeft, setCurrentTimeLeft] = useState(readingTime * 60);
  const [initialTime, setInitialTime] = useState<number | undefined>(undefined);

  const loadReadingForQuestion = useCallback(async (question: Question) => {
    if (!question.reading_text_id) {
      setCurrentReading(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('reading_texts')
        .select('*')
        .eq('id', question.reading_text_id)
        .single();
      if (error) throw error;
      setCurrentReading(data);
    } catch (err) {
      console.error('Error loading reading:', err);
      setCurrentReading(null);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const subjectQuestions = await getQuestionsBySubject(subject);
      if (!subjectQuestions.length) {
        throw new Error(`No hay preguntas disponibles para ${subject}`);
      }
      const questionsWithReading = subjectQuestions.filter(q => q.reading_text_id);
      if (questionsWithReading.length === 0) {
        return subjectQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
      }
      const readingGroups = questionsWithReading.reduce((acc, q) => {
        const rid = q.reading_text_id!;
        if (!acc[rid]) acc[rid] = [];
        acc[rid].push(q);
        return acc;
      }, {} as Record<number, Question[]>);
      const readingIds = Object.keys(readingGroups);
      const randomReadingId = readingIds[Math.floor(Math.random() * readingIds.length)];
      return readingGroups[Number(randomReadingId)]
        .sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
    } catch (error) {
      throw error;
    }
  }, [subject]);

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
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
        if (selectedQuestions.length > 0) {
          await loadReadingForQuestion(selectedQuestions[0]);
        }
        
        // Restaurar sesión si existe
        if (resumeSession && resumeSession.subject === subject) {
          console.log('[ReadingTestMode] Restaurando sesión:', resumeSession);
          setCurrentQuestionIndex(resumeSession.currentQuestionIndex);
          setCurrentTimeLeft(resumeSession.timeRemaining);
          setInitialTime(resumeSession.timeRemaining);
          setAnswers(resumeSession.answers as Record<number, string>);
          setPhase('questions');
          setActiveTab('preguntas');
          toast.success('Sesión restaurada');
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing test:', error);
        setError(error instanceof Error ? error.message : 'Error al inicializar el test');
        toast.error('Error al inicializar el test');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [subject, loadQuestions, loadReadingForQuestion, resumeSession]);

  // Guardar sesión al salir
  const handleExitWithSave = useCallback(() => {
    if (onSessionChange && !isFinished && questions.length > 0) {
      console.log('[ReadingTestMode] Guardando sesión antes de salir');
      onSessionChange({
        subject,
        mode: 'TEST',
        currentQuestionIndex,
        timeRemaining: currentTimeLeft,
        answers: answers as Record<string, string>,
        questionIds: questions.map(q => q.id),
        startTime,
        totalQuestions: questions.length,
        currentTopic: currentReading?.title
      });
    }
    onExit();
  }, [onSessionChange, isFinished, questions, subject, currentQuestionIndex, currentTimeLeft, answers, startTime, currentReading, onExit]);

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

  const saveSession = async () => {
    // Limpiar sesión pausada al completar
    if (onSessionChange) {
      onSessionChange(null);
    }
    
    if (!user) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const correctCount = questionAttemptsRef.current.filter(a => a.is_correct).length;

    console.log('Saving ReadingTestMode session:', {
      sessionId,
      correctCount,
      timeSpent,
      totalQuestions: questions.length,
      attempts: questionAttemptsRef.current.length
    });

    try {
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

  const handleAnswer = async (answer: string) => {
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    if (isCorrect && !answers[currentQuestionIndex]) {
      setCorrectAnswers((prev) => prev + 1);
    }
    setCurrentAnswer(answer);
    setShowExplanation(true);
    
    saveQuestionAttempt(answer, isCorrect);
  };

  const handleNext = async () => {
    // Limpiar initialTime después de la primera pregunta restaurada
    if (initialTime !== undefined) {
      setInitialTime(undefined);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || null);
      setShowExplanation(!!answers[nextIndex]);
      setQuestionStartTime(Date.now());
      setQuestionTimerKey(prev => prev + 1);
      const nextQuestion = questions[nextIndex];
      if (nextQuestion.reading_text_id !== questions[currentQuestionIndex].reading_text_id) {
        await loadReadingForQuestion(nextQuestion);
        setPhase('reading');
        setActiveTab('texto');
        setCurrentTimeLeft(readingTime * 60);
      }
    } else {
      await saveSession();
      setIsFinished(true);
    }
  };

  const handleReadingTimeUp = () => {
    toast('¡Tiempo de lectura terminado! Pasando a las preguntas...', { icon: '📝' });
    startQuestionsPhase();
  };

  const handleQuestionTimeUp = async () => {
    if (!showExplanation) {
      toast.error('¡Se acabó el tiempo!');
      setActiveTab('preguntas');
      setShowExplanation(true);
      
      if (currentAnswer) {
        const isCorrect = currentAnswer === questions[currentQuestionIndex].correctAnswer;
        if (isCorrect && !answers[currentQuestionIndex]) {
          setCorrectAnswers((prev) => prev + 1);
        }
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }));
        saveQuestionAttempt(currentAnswer, isCorrect);
      }
    }
  };

  const startQuestionsPhase = () => {
    setPhase('questions');
    setActiveTab('preguntas');
    setQuestionStartTime(Date.now());
    setQuestionTimerKey(prev => prev + 1);
    setCurrentTimeLeft(timePerQuestion * 60);
    setInitialTime(undefined); // Reset initialTime cuando empieza fase normal
  };

  const handleTimerTick = useCallback((timeLeft: number) => {
    setCurrentTimeLeft(timeLeft);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Cargando preguntas de lectura...</div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">{error || 'No hay preguntas disponibles.'}</p>
        <button onClick={onExit} className={`${colors.primary} text-white px-6 py-2 rounded-lg ${colors.primaryHover} transition-colors`}>
          Volver al inicio
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">¡Lectura Completada!</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8">
          <div className={`text-6xl font-bold ${colors.primaryText} mb-4`}>{percentage}%</div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Respondiste correctamente {correctAnswers} de {questions.length} preguntas
          </p>
          {currentReading && (
            <p className="text-gray-500 dark:text-gray-400 mb-4">Lectura: {currentReading.title}</p>
          )}
        </div>
        <button onClick={onExit} className={`${colors.primary} text-white px-6 py-3 rounded-lg ${colors.primaryHover} transition-colors`}>
          Volver al inicio
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // ============ FASE DE LECTURA ============
  if (phase === 'reading') {
    return (
      <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={handleExitWithSave} className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}>
              <Home className="h-5 w-5" />
              <span>Inicio</span>
            </button>
            <Timer
              totalMinutes={readingTime}
              onTimeUp={handleReadingTimeUp}
              resetKey={`reading-${currentReading?.id || 0}`}
              onTick={handleTimerTick}
            />
          </div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-4 py-2 rounded-lg">
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">Fase de Lectura</span>
          </div>
        </div>

        <div className={`mb-4 px-4 py-3 ${colors.primaryLight} rounded-lg`}>
          <div className={`flex items-center gap-2 ${colors.primaryText}`}>
            <Clock className="w-5 h-5" />
            <span>
              Tienes <span className="font-bold">{readingTime} minutos</span> para leer el texto. 
              Luego tendrás <span className="font-bold">{timePerQuestion} min</span> por cada una de las {totalQuestions} preguntas.
            </span>
          </div>
        </div>

        {currentReading && (
          <div className={`mb-4 px-4 py-2 ${colors.primaryLight} rounded-lg`}>
            <span className={`font-medium ${colors.primaryText}`}>📖 {currentReading.title}</span>
            {currentReading.source && (
              <span className={`${colors.primaryText} text-sm ml-2 opacity-75`}>({currentReading.source})</span>
            )}
          </div>
        )}

        <div className="flex-grow">
          {currentReading?.pdf_url ? (
            <PdfViewer 
              pdfUrl={currentReading.pdf_url} 
              pageStart={currentReading.page_start} 
              pageEnd={currentReading.page_end} 
              title={currentReading.title}
              timeLeft={currentTimeLeft}
              isReadingPhase={true}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">No hay texto disponible para esta pregunta</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
          <button onClick={startQuestionsPhase} className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors flex items-center justify-center gap-2 shadow-md`}>
            <HelpCircle className="w-5 h-5" />
            Estoy listo, ir a las preguntas
          </button>
        </div>
      </div>
    );
  }

  // ============ FASE DE PREGUNTAS ============
  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={handleExitWithSave} className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}>
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </button>
          <Timer
            totalMinutes={timePerQuestion}
            onTimeUp={handleQuestionTimeUp}
            resetKey={initialTime ? undefined : `question-${questionTimerKey}`}
            onTick={handleTimerTick}
            initialTimeSeconds={initialTime}
          />
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions}
        </div>
      </div>

      {currentReading && (
        <div className={`mb-4 px-4 py-2 ${colors.primaryLight} rounded-lg`}>
          <span className={`font-medium ${colors.primaryText}`}>📖 {currentReading.title}</span>
          {currentReading.source && (
            <span className={`${colors.primaryText} text-sm ml-2 opacity-75`}>({currentReading.source})</span>
          )}
        </div>
      )}

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

      <div className="flex-grow">
        {activeTab === 'texto' && currentReading?.pdf_url && (
          <PdfViewer 
            pdfUrl={currentReading.pdf_url} 
            pageStart={currentReading.page_start} 
            pageEnd={currentReading.page_end} 
            title={currentReading.title}
            timeLeft={currentTimeLeft}
            isReadingPhase={false}
          />
        )}
        {activeTab === 'texto' && !currentReading?.pdf_url && (
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">No hay texto disponible para esta pregunta</p>
          </div>
        )}
        {activeTab === 'preguntas' && (
          <QuestionView question={currentQuestion} currentAnswer={currentAnswer} onAnswer={handleAnswer} showExplanation={showExplanation} />
        )}
      </div>

      {activeTab === 'preguntas' && showExplanation && (
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {currentAnswer === currentQuestion.correctAnswer ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-semibold">¡Respuesta Correcta!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-semibold">Respuesta Incorrecta</span>
              </>
            )}
          </div>
          <button onClick={handleNext} className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Ver Resultados' : 'Siguiente Pregunta'}
          </button>
        </div>
      )}

      {activeTab === 'texto' && (
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
          <button onClick={() => setActiveTab('preguntas')} className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors shadow-md`}>
            Ir a las Preguntas
          </button>
        </div>
      )}
    </div>
  );
}