import React, { useState, useEffect, useCallback } from 'react';
import { Timer } from './Timer';
import { QuestionView } from './QuestionView';
import { AlertCircle, CheckCircle2, Home } from 'lucide-react';
import type { Question, Subject } from '../types';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface TestModeProps {
  subject: Subject;
  onExit: () => void;
}

export function TestMode({ subject, onExit }: TestModeProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

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

        if (!m1Questions.length || !m2Questions.length || !lQuestions.length || !cQuestions.length || !hQuestions.length) {
          throw new Error('No hay suficientes preguntas disponibles para todas las materias');
        }

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

  const createSession = useCallback(async (questionCount: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          subject,
          mode: 'TEST',
          questions_total: questionCount,
          questions_correct: 0,
          time_spent: 0
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      throw error;
    }
  }, [user, subject]);

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

        const newSessionId = await createSession(selectedQuestions.length);
        if (!mounted) return;

        setQuestions(selectedQuestions);
        setSessionId(newSessionId);
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
  }, [loadQuestions, createSession]);

  const saveQuestionAttempt = async (answer: string, isCorrect: boolean) => {
    if (!user || !sessionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const { error } = await supabase.from('question_attempts').insert({
        user_id: user.id,
        session_id: sessionId,
        question_id: currentQuestion.id,
        subject: currentQuestion.subject,
        mode: 'TEST',
        area_tematica: currentQuestion.areaTematica,
        tema: currentQuestion.tema,
        subtema: currentQuestion.subtema,
        answer,
        is_correct: isCorrect,
        time_spent: timeSpent
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving question attempt:', error);
      toast.error('Error al guardar la respuesta');
    }
  };

  const updateSession = async () => {
    if (!user || !sessionId) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          questions_correct: correctAnswers,
          time_spent: timeSpent
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Error al actualizar la sesión');
    }
  };

  const handleAnswer = async (answer: string) => {
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }
    
    setCurrentAnswer(answer);
    setShowExplanation(true);
    await saveQuestionAttempt(answer, isCorrect);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      await updateSession();
      setIsFinished(true);
    }
  };

  const handleTimeUp = async () => {
    if (!showExplanation) {
      setShowExplanation(true);
      if (currentAnswer) {
        await saveQuestionAttempt(
          currentAnswer,
          currentAnswer === questions[currentQuestionIndex].correctAnswer
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Cargando preguntas...</div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">{error || 'No hay preguntas disponibles en este momento.'}</p>
        <button
          onClick={onExit}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">¡Práctica Completada!</h2>
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="text-6xl font-bold text-indigo-600 mb-4">{percentage}%</div>
          <p className="text-xl text-gray-600 mb-6">
            Respondiste correctamente {correctAnswers} de {questions.length} preguntas
          </p>
          <div className="space-y-4">
            {percentage >= 75 && (
              <p className="text-green-600">¡Excelente trabajo! Dominas bien este contenido.</p>
            )}
            {percentage >= 50 && percentage < 75 && (
              <p className="text-yellow-600">Buen trabajo, pero hay espacio para mejorar.</p>
            )}
            {percentage < 50 && (
              <p className="text-red-600">Te recomendamos repasar más este contenido.</p>
            )}
          </div>
        </div>
        <button
          onClick={onExit}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const timePerQuestion = Math.round(2.16); // 2.16 minutes per question

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
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
        <div className="text-gray-600">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions}
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-gray-600">
        Materia: {
          currentQuestion.subject === 'M1' ? 'Matemática 1' :
          currentQuestion.subject === 'M2' ? 'Matemática 2' :
          currentQuestion.subject === 'L' ? 'Lenguaje' :
          currentQuestion.subject === 'C' ? 'Ciencias' :
          'Historia'
        }
      </div>

      <div className="flex-grow">
        <QuestionView
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
          showExplanation={showExplanation}
        />
      </div>

      {showExplanation && (
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {currentAnswer === currentQuestion.correctAnswer ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="text-green-600 font-semibold">¡Respuesta Correcta!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-red-500" />
                <span className="text-red-600 font-semibold">Respuesta Incorrecta</span>
              </>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Ver Resultados' : 'Siguiente Pregunta'}
          </button>
        </div>
      )}
    </div>
  );
}
