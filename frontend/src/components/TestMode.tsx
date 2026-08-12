import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { ErrorTagPrompt, type ErrorTag } from './ErrorTagPrompt';
import { PdfViewer } from './PdfViewer';
import { ResultsView } from './ResultsView';
import { AlertCircle, CheckCircle2, Home, FileText, HelpCircle, Send, Loader2, BookOpen, SkipForward, ArrowLeft } from 'lucide-react';
import type { Question, Subject } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';
import { useImagePreloader } from '../hooks/useImagePreloader';
import type { PausedSession } from '../hooks/useTestSession';

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
  // Props para restaurar sesión
  resumeSession?: PausedSession | null;
  onSessionChange?: (session: Omit<PausedSession, 'pausedAt' | 'subjectLabel'> | null) => void;
  // Re-test: preguntas específicas a practicar (errores evitables)
  presetQuestionIds?: string[];
}

export function TestMode({
  subject,
  onExit,
  timePerQuestion = 2.5,
  resumeSession,
  onSessionChange,
  presetQuestionIds,
}: TestModeProps) {
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
  
  // Estado para preguntas saltadas
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [savedTimes, setSavedTimes] = useState<Record<number, number>>({});
  const [timerKey, setTimerKey] = useState(0);
  
  // Estado para mostrar mensaje de tiempo agotado
  const [showTimeUpMessage, setShowTimeUpMessage] = useState(false);
  
  // Estado para el tiempo actual (para pausar)
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState<number>(timePerQuestion * 60);
  
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
    error_tag: string | null;
  }>>([]);
  
  // Estados para textos de lectura
  const [activeTab, setActiveTab] = useState<'text' | 'questions'>('text');
  const [readingTexts, setReadingTexts] = useState<Record<number, ReadingText>>({});
  const [previousReadingTextId, setPreviousReadingTextId] = useState<number | null>(null);
  
  // Estados para explicaciones
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // Flag para saber si estamos restaurando una sesión
  const [isRestoring, setIsRestoring] = useState(!!resumeSession);

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

  // Callback para actualizar tiempo desde el Timer
  const handleTimerTick = useCallback((timeLeft: number) => {
    setCurrentTimeRemaining(timeLeft);
  }, []);

  // Guardar sesión pausada cuando el usuario sale
  const saveSessionState = useCallback(() => {
    if (onSessionChange && questions.length > 0 && !isFinished) {
      onSessionChange({
        subject,
        mode: 'TEST',
        currentQuestionIndex,
        timeRemaining: currentTimeRemaining,
        answers: Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, v])
        ),
        questionIds: questions.map(q => q.id),
        startTime,
        totalQuestions: questions.length,
        currentTopic: currentQuestion?.tema,
      });
    }
  }, [onSessionChange, questions, isFinished, subject, currentQuestionIndex, currentTimeRemaining, answers, startTime, currentQuestion]);

  // Limpiar sesión guardada cuando se completa el test
  const clearSessionState = useCallback(() => {
    if (onSessionChange) {
      onSessionChange(null);
    }
  }, [onSessionChange]);

  // Modificar handleExit para guardar sesión
  const handleExitWithSave = useCallback(() => {
    saveSessionState();
    onExit();
  }, [saveSessionState, onExit]);

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

  // Cargar preguntas por IDs (para restaurar sesión)
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

      // Ordenar en el mismo orden que los IDs
      const orderedQuestions = questionIds
        .map(id => data.find(q => q.id === id))
        .filter((q): q is Question => q !== undefined);

      return orderedQuestions;
    } catch (error) {
      console.error('Error loading questions by IDs:', error);
      throw error;
    }
  }, []);

  // Initialize test session
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        let selectedQuestions: Question[];

        // Si hay sesión para restaurar, cargar esas preguntas específicas
        if (resumeSession && resumeSession.questionIds.length > 0) {
          selectedQuestions = await loadQuestionsByIds(resumeSession.questionIds);
          
          // Restaurar estado
          setCurrentQuestionIndex(resumeSession.currentQuestionIndex);
          setSavedTimes({ [resumeSession.currentQuestionIndex]: resumeSession.timeRemaining });
          setCurrentTimeRemaining(resumeSession.timeRemaining);
          setTimerKey(prev => prev + 1);
          
          // Restaurar respuestas
          const restoredAnswers: Record<number, string> = {};
          Object.entries(resumeSession.answers).forEach(([key, value]) => {
            restoredAnswers[parseInt(key)] = value;
          });
          setAnswers(restoredAnswers);
          
          // La respuesta actual
          if (restoredAnswers[resumeSession.currentQuestionIndex]) {
            setCurrentAnswer(restoredAnswers[resumeSession.currentQuestionIndex]);
          }
          
          toast.success('Sesión restaurada', { duration: 2000 });
        } else if (presetQuestionIds && presetQuestionIds.length > 0) {
          selectedQuestions = await loadQuestionsByIds(presetQuestionIds);
        } else {
          selectedQuestions = await loadQuestions();
        }

        if (!mounted) return;

        setQuestions(selectedQuestions);
        setQuestionStartTime(Date.now());

        const lQuestions = selectedQuestions.filter(q => q.subject === 'L');
        if (lQuestions.length > 0) {
          await loadReadingTexts(lQuestions);
        }
        
        setIsRestoring(false);
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
  }, [subject, loadQuestions, loadQuestionsByIds, resumeSession, presetQuestionIds]);

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
      time_spent: timeSpent,
      error_tag: null,
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
          time_spent: attempt.time_spent,
          error_tag: attempt.error_tag ?? null,
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
      
      // Limpiar sesión pausada al completar
      clearSessionState();
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


  const handlePrevious = () => {
    if (currentQuestionIndex <= 0) return;
    navigateToQuestion(currentQuestionIndex - 1);
  };

  const handleSkip = () => {
    if (isCurrentAnswerSubmitted) return;
    
    // Save remaining time for this question
    setSavedTimes(prev => ({ ...prev, [currentQuestionIndex]: currentTimeRemaining }));
    
    setSkippedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    
    // Find next unanswered question
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      if (!submittedAnswers[i]) {
        nextIndex = i;
        break;
      }
    }
    
    if (nextIndex === -1) {
      // No more unanswered ahead, find first skipped/unanswered from beginning
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
      setShowTimeUpMessage(false);
      
      setTimerKey(prev => prev + 1);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index === currentQuestionIndex) return;
    
    // Save current question time before leaving
    if (!submittedAnswers[currentQuestionIndex]) {
      setSavedTimes(prev => ({ ...prev, [currentQuestionIndex]: currentTimeRemaining }));
    }
    
    setCurrentQuestionIndex(index);
    setCurrentAnswer(answers[index] || null);
    setShowExplanation(submittedAnswers[index] || false);
    setCurrentExplanation(null);
    setQuestionStartTime(Date.now());
    setShowTimeUpMessage(false);
    
    setTimerKey(prev => prev + 1);
    
    if (submittedAnswers[index]) {
      fetchExplanation(questions[index]);
    }
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
    
    // Remove from skipped if was skipped
    setSkippedQuestions(prev => {
      const next = new Set(prev);
      next.delete(currentQuestionIndex);
      return next;
    });
    
    // Guardar attempt en memoria
    saveQuestionAttempt(currentAnswer, isCorrect);
  };

  const handleNext = async () => {
    setShowTimeUpMessage(false);
    setTimerKey(prev => prev + 1);
    
    // Check if all questions are now answered → finish immediately
    const allAnswered = questions.every((_, i) => submittedAnswers[i]);
    if (allAnswered) {
      setEndTime(Date.now());
      await saveSession();
      setIsFinished(true);
      return;
    }
    
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
      // At the end, loop back to first unanswered
      const firstSkipped = Array.from({ length: questions.length }, (_, i) => i)
        .find(i => !submittedAnswers[i] && i !== currentQuestionIndex);
      
      if (firstSkipped !== undefined) {
        navigateToQuestion(firstSkipped);
        return;
      }
      
      // Fallback: finish
      setEndTime(Date.now());
      await saveSession();
      setIsFinished(true);
    }
  };

  const handleTimeUp = async () => {
    // Si ya se envió la respuesta, no hacer nada
    if (isCurrentAnswerSubmitted) return;
    
    const question = questions[currentQuestionIndex];
    
    if (currentAnswer) {
      // Hay respuesta seleccionada: enviarla y mostrar resultado brevemente
      const isCorrect = currentAnswer === question.correctAnswer;
      
      setSubmittedAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: true
      }));

      if (isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
      }

      setShowExplanation(true);
      saveQuestionAttempt(currentAnswer, isCorrect);
      
      // Mostrar resultado por 2 segundos y luego avanzar
      setTimeout(async () => {
        await handleNext();
      }, 2000);
    } else {
      // No hay respuesta: marcar como omitida y pasar directamente
      setSubmittedAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: true
      }));
      
      // Guardar como respuesta omitida (vacía, incorrecta)
      saveQuestionAttempt('', false);
      
      // Mostrar mensaje breve y avanzar
      setShowTimeUpMessage(true);
      toast.error('¡Tiempo agotado! Pregunta omitida', { duration: 1500 });
      
      setTimeout(async () => {
        await handleNext();
      }, 1500);
    }
  };

  const handleRetry = () => {
    // Reset attempts
    questionAttemptsRef.current = [];
    
    // Limpiar sesión pausada
    clearSessionState();
    
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
    setLoading(true);
    setShowTimeUpMessage(false);
        
    loadQuestions().then((selectedQuestions) => {
      setQuestions(selectedQuestions);
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">
          {isRestoring ? 'Restaurando sesión...' : 'Cargando preguntas...'}
        </div>
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
            onClick={handleExitWithSave}
            className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${colors.primaryText.replace('text-', 'hover:text-')} transition-colors`}
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </button>
          <Timer
            key={timerKey}
            totalMinutes={timePerQuestion}
            onTimeUp={handleTimeUp}
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
        {showTimeUpMessage ? (
          <div className="flex items-center justify-center space-x-2 py-3">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            <span className="text-orange-600 font-semibold">¡Tiempo agotado! Pasando a la siguiente...</span>
          </div>
        ) : !isCurrentAnswerSubmitted ? (
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-5 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 ${currentQuestionIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer}
              className={`flex-1 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                currentAnswer
                  ? `${colors.primary} text-white ${colors.primaryHover}`
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
              Contestar
            </button>
            <button
              onClick={handleSkip}
              className="px-5 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
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
                    Respuesta Incorrecta - La correcta es: {currentQuestion.correctAnswer?.toUpperCase() ?? '—'}
                  </span>
                </>
              )}
            </div>

            {currentAnswer !== currentQuestion.correctAnswer && currentQuestion.distractor_diagnosis?.[currentAnswer?.toLowerCase() ?? ''] && (
              <div className="mb-3 flex justify-center">
                <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-4 py-2 max-w-xl text-center">
                  <span className="font-semibold">Tu error probable:</span>{' '}
                  {currentQuestion.distractor_diagnosis[currentAnswer!.toLowerCase()]}
                </p>
              </div>
            )}

            {currentAnswer !== currentQuestion.correctAnswer && (
              <div className="mb-4 flex justify-center">
                <ErrorTagPrompt key={currentQuestionIndex} onTag={handleErrorTag} />
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
                <p className="text-gray-500 italic">
                  No hay explicación disponible para esta pregunta.
                </p>
              )}
            </div>

            <button
              onClick={handleNext}
              className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}
            >
              {(() => {
                const unansweredCount = Array.from({ length: questions.length }, (_, i) => i)
                  .filter(i => !submittedAnswers[i] && i !== currentQuestionIndex).length;
                if (currentQuestionIndex === totalQuestions - 1 || !Array.from({ length: questions.length }, (_, i) => i).slice(currentQuestionIndex + 1).some(i => !submittedAnswers[i])) {
                  return unansweredCount > 0 
                    ? `Ir a pregunta saltada (${unansweredCount} restante${unansweredCount > 1 ? 's' : ''})` 
                    : 'Ver Resultados';
                }
                return 'Siguiente Pregunta';
              })()}
            </button>
          </>
        )}
      </div>
    </div>
  );
}