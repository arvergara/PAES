import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { PdfViewer } from './PdfViewer';
import { ResultsView } from './ResultsView';
import { AlertCircle, CheckCircle2, Home, FileText, HelpCircle, BookOpen, Clock, Loader2, SkipForward, ArrowLeft, Send } from 'lucide-react';
import type { Question, Subject, ReadingText } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { PausedSession } from '../hooks/useTestSession';
import { ErrorTagPrompt, type ErrorTag } from './ErrorTagPrompt';
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
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [savedTimes, setSavedTimes] = useState<Record<number, number>>({});
  const [timerKey, setTimerKey] = useState(0);
  
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
    error_tag: string | null;
  }>>([]);
  
  const [currentReading, setCurrentReading] = useState<ReadingText | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('texto');
  
  const [phase, setPhase] = useState<Phase>('reading');
  
  const [currentTimeLeft, setCurrentTimeLeft] = useState(readingTime * 60);

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

  const fetchExplanation = async (question: Question) => {
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
        setCurrentExplanation(data?.explanation || null);
      }
    } catch {
      setCurrentExplanation(null);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

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
          setSavedTimes({ [resumeSession.currentQuestionIndex]: resumeSession.timeRemaining });
          setTimerKey(prev => prev + 1);
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
      time_spent: timeSpent,
      error_tag: null
    });
  };

  // Registrar el tipo de error auto-reportado para la última pregunta respondida
  const handleErrorTag = (tag: ErrorTag) => {
    const qid = questions[currentQuestionIndex]?.id;
    for (let i = questionAttemptsRef.current.length - 1; i >= 0; i--) {
      if (questionAttemptsRef.current[i].question_id === qid) {
        questionAttemptsRef.current[i].error_tag = tag;
        break;
      }
    }
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
          time_spent: attempt.time_spent,
          error_tag: attempt.error_tag ?? null
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


  const handlePrevious = () => {
    if (currentQuestionIndex <= 0) return;
    navigateToQuestion(currentQuestionIndex - 1);
  };

  const handleSkip = () => {
    if (showExplanation) return;
    
    // Save remaining time for this question
    setSavedTimes(prev => ({ ...prev, [currentQuestionIndex]: currentTimeLeft }));
    
    setSkippedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      if (!submittedAnswers[i]) {
        nextIndex = i;
        break;
      }
    }
    
    if (nextIndex === -1) {
      for (let i = 0; i < currentQuestionIndex; i++) {
        if (!submittedAnswers[i]) {
          nextIndex = i;
          break;
        }
      }
    }
    
    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || null);
      setShowExplanation(submittedAnswers[nextIndex] || false);
      setCurrentExplanation(null);
      setQuestionStartTime(Date.now());
      setTimerKey(prev => prev + 1);
      if (submittedAnswers[nextIndex]) {
        fetchExplanation(questions[nextIndex]);
      }
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index === currentQuestionIndex) return;
    
    // Save current question's time before leaving (if not answered)
    if (!submittedAnswers[currentQuestionIndex]) {
      setSavedTimes(prev => ({ ...prev, [currentQuestionIndex]: currentTimeLeft }));
    }
    
    setCurrentQuestionIndex(index);
    setCurrentAnswer(answers[index] || null);
    setShowExplanation(submittedAnswers[index] || false);
    setCurrentExplanation(null);
    setQuestionStartTime(Date.now());
    
    setTimerKey(prev => prev + 1);
    if (submittedAnswers[index]) {
      fetchExplanation(questions[index]);
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
    fetchExplanation(questions[currentQuestionIndex]);
    
    setSubmittedAnswers(prev => ({ ...prev, [currentQuestionIndex]: true }));
    setSkippedQuestions(prev => {
      const next = new Set(prev);
      next.delete(currentQuestionIndex);
      return next;
    });
    
    saveQuestionAttempt(answer, isCorrect);
  };

  const handleNext = async () => {
    setTimerKey(prev => prev + 1);
    
    // Check if all questions are now answered → finish immediately
    const allAnswered = questions.every((_, i) => submittedAnswers[i]);
    if (allAnswered) {
      await saveSession();
      setEndTime(Date.now());
      setIsFinished(true);
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || null);
      setShowExplanation(!!answers[nextIndex]);
      setCurrentExplanation(null);
      setQuestionStartTime(Date.now());
      if (answers[nextIndex]) {
        fetchExplanation(questions[nextIndex]);
      }
      setTimerKey(prev => prev + 1);
      const nextQuestion = questions[nextIndex];
      if (nextQuestion.reading_text_id !== questions[currentQuestionIndex].reading_text_id) {
        await loadReadingForQuestion(nextQuestion);
        setPhase('reading');
        setActiveTab('texto');
        setCurrentTimeLeft(readingTime * 60);
      }
    } else {
      // At the end, loop back to first unanswered
      const firstSkipped = Array.from({ length: questions.length }, (_, i) => i)
        .find(i => !submittedAnswers[i] && i !== currentQuestionIndex);
      
      if (firstSkipped !== undefined) {
        navigateToQuestion(firstSkipped);
        return;
      }
      
      // Fallback: finish
      await saveSession();
      setEndTime(Date.now());
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
    setTimerKey(prev => prev + 1);
    setCurrentTimeLeft(timePerQuestion * 60);
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

  const handleRetry = () => {
    questionAttemptsRef.current = [];
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubmittedAnswers({});
    setSkippedQuestions(new Set());
    setSavedTimes({});
    setTimerKey(prev => prev + 1);
    setCorrectAnswers(0);
    setIsFinished(false);
    setEndTime(null);
    setCurrentAnswer(null);
    setShowExplanation(false);
    setCurrentExplanation(null);
    setPhase('reading');
    setCurrentReading(null);
    setActiveTab('texto');
    setCurrentTimeLeft(readingTime * 60);
    setLoading(true);

    loadQuestions().then(async (selectedQuestions) => {
      setQuestions(selectedQuestions);
      if (selectedQuestions && selectedQuestions.length > 0) {
        await loadReadingForQuestion(selectedQuestions[0]);
      }
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

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
            key={`q-${timerKey}`}
            totalMinutes={timePerQuestion}
            onTimeUp={handleQuestionTimeUp}
            onTick={handleTimerTick}
            initialTimeSeconds={savedTimes[currentQuestionIndex]}
          />
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions}
        </div>
      </div>

      {/* Floating question navigation bar */}
      <div className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center pointer-events-none h-[60px]">
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-700/50 pointer-events-auto">
          {questions.map((_, idx) => {
            const isActive = idx === currentQuestionIndex;
            const isAnswered = submittedAnswers[idx];
            const isSkipped = skippedQuestions.has(idx) && !isAnswered;
            
            let dotClass = 'w-3 h-3 rounded-full transition-all duration-200 cursor-pointer border-2 ';
            if (isActive) {
              dotClass += `${colors.primary} border-transparent ring-2 ${colors.selectedRing} scale-125`;
            } else if (isAnswered) {
              dotClass += answers[idx] === questions[idx].correctAnswer
                ? 'bg-green-500 border-green-500'
                : 'bg-red-400 border-red-400';
            } else if (isSkipped) {
              dotClass += 'bg-amber-400 border-amber-400';
            } else {
              dotClass += 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400';
            }
            
            return (
              <button
                key={idx}
                onClick={() => navigateToQuestion(idx)}
                className={dotClass}
                title={`Pregunta ${idx + 1}${isAnswered ? ' (respondida)' : isSkipped ? ' (saltada)' : ''}`}
              />
            );
          })}
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

      {activeTab === 'preguntas' && !showExplanation && (
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 mt-4 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-5 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 ${currentQuestionIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
              Selecciona una respuesta arriba
            </div>
            <button
              onClick={handleSkip}
              className="px-5 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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

          {currentAnswer !== currentQuestion.correctAnswer && (
            <div className="mb-4 flex justify-center">
              <ErrorTagPrompt key={currentQuestionIndex} onTag={handleErrorTag} hiddenTags={['calculo']} />
            </div>
          )}
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
              <p className="text-gray-500 italic">No hay explicación disponible para esta pregunta.</p>
            )}
          </div>

          <button onClick={handleNext} className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}>
            {(() => {
              const unansweredCount = Array.from({ length: questions.length }, (_, i) => i)
                .filter(i => !submittedAnswers[i] && i !== currentQuestionIndex).length;
              const hasUnansweredAhead = Array.from({ length: questions.length }, (_, i) => i)
                .slice(currentQuestionIndex + 1).some(i => !submittedAnswers[i]);
              if (currentQuestionIndex === totalQuestions - 1 || !hasUnansweredAhead) {
                return unansweredCount > 0 
                  ? `Ir a pregunta saltada (${unansweredCount} restante${unansweredCount > 1 ? 's' : ''})` 
                  : 'Ver Resultados';
              }
              return 'Siguiente Pregunta';
            })()}
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