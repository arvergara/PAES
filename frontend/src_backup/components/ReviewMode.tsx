import React, { useState, useEffect } from 'react';
import { Home, BookOpen, CheckCircle2, AlertCircle, Brain } from 'lucide-react';
import type { Question, Subject } from '../types';
import { QuestionView } from './QuestionView';
import { getQuestionsBySubject } from '../questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface ReviewModeProps {
  subject: Subject;
  onExit: () => void;
}

interface TopicStats {
  topic: string;
  correctCount: number;
  totalAttempts: number;
  consecutiveCorrect: number;
  currentDifficulty: number;
}

export function ReviewMode({ subject, onExit }: ReviewModeProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [topicStats, setTopicStats] = useState<Record<string, TopicStats>>({});
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wantsToStop, setWantsToStop] = useState(false);

  // Fetch previous session data and identify problem areas
  useEffect(() => {
    const fetchPreviousSessions = async () => {
      if (!user) return;

      try {
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('subject', subject)
          .in('mode', ['PAES', 'TEST'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Initialize topic stats from previous sessions
        const stats: Record<string, TopicStats> = {};
        const questions = getQuestionsBySubject(subject);

        questions.forEach(q => {
          const topic = q.topic || 'general';
          if (!stats[topic]) {
            stats[topic] = {
              topic,
              correctCount: 0,
              totalAttempts: 0,
              consecutiveCorrect: 0,
              currentDifficulty: 1
            };
          }
        });

        // Update stats based on session data
        sessions?.forEach(session => {
          const accuracy = session.questions_correct / session.questions_total;
          if (accuracy < 0.7) { // Focus on topics with less than 70% accuracy
            // In a real app, we would have detailed question-level data
            // For now, we'll use the overall session performance
            Object.keys(stats).forEach(topic => {
              stats[topic].totalAttempts++;
            });
          }
        });

        setTopicStats(stats);
        generateNextQuestion(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Error al cargar el historial de sesiones');
        setLoading(false);
      }
    };

    fetchPreviousSessions();
  }, [user, subject]);

  const generateNextQuestion = (currentStats: Record<string, TopicStats>) => {
    // Find topics that need work (less than 3 consecutive correct answers)
    const eligibleTopics = Object.values(currentStats).filter(
      stat => stat.consecutiveCorrect < 3
    );

    if (eligibleTopics.length === 0) {
      setIsFinished(true);
      return;
    }

    // Sort topics by success rate to prioritize struggling areas
    eligibleTopics.sort((a, b) => 
      (a.correctCount / (a.totalAttempts || 1)) - (b.correctCount / (b.totalAttempts || 1))
    );

    const targetTopic = eligibleTopics[0].topic;
    const questions = getQuestionsBySubject(subject).filter(q => 
      (q.topic || 'general') === targetTopic
    );

    // Filter questions by current difficulty level
    const difficultyLevel = currentStats[targetTopic].currentDifficulty;
    const eligibleQuestions = questions.filter(q => 
      (q.difficulty || 1) === difficultyLevel
    );

    if (eligibleQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleQuestions.length);
      setCurrentQuestion(eligibleQuestions[randomIndex]);
      setCurrentTopic(targetTopic);
    } else {
      // If no questions at current difficulty, try any question for the topic
      const randomIndex = Math.floor(Math.random() * questions.length);
      setCurrentQuestion(questions[randomIndex]);
      setCurrentTopic(targetTopic);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!currentTopic || !currentQuestion) return;

    setCurrentAnswer(answer);
    setShowExplanation(true);
    setQuestionsAnswered(prev => prev + 1);

    const isCorrect = answer === currentQuestion.correctAnswer;
    const updatedStats = { ...topicStats };
    const topicStat = updatedStats[currentTopic];

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      topicStat.correctCount++;
      topicStat.consecutiveCorrect++;

      if (topicStat.consecutiveCorrect === 3) {
        toast.success(`¡Excelente! Ya dominas el tema: ${currentTopic}`);
      }
    } else {
      topicStat.consecutiveCorrect = 0;
    }

    topicStat.totalAttempts++;
    setTopicStats(updatedStats);
  };

  const handleNext = async () => {
    setCurrentAnswer(null);
    setShowExplanation(false);
    generateNextQuestion(topicStats);
  };

  const handleStop = async () => {
    setWantsToStop(true);
    await saveSession();
    setIsFinished(true);
  };

  const saveSession = async () => {
    if (!user) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const { error } = await supabase.from('user_sessions').insert({
        user_id: user.id,
        subject,
        mode: 'REVIEW',
        questions_total: questionsAnswered,
        questions_correct: correctAnswers,
        time_spent: timeSpent
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error al guardar la sesión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Analizando tu historial de práctica...</div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {wantsToStop ? '¡Práctica Finalizada!' : '¡Felicitaciones!'}
        </h2>
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          {wantsToStop ? (
            <>
              <div className="text-xl text-gray-600 mb-6">
                Has respondido {correctAnswers} de {questionsAnswered} preguntas correctamente
              </div>
              <p className="text-gray-600">
                ¡Continúa practicando para mejorar tu rendimiento!
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <Brain className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-xl text-gray-800">
                ¡Has dominado todos los temas de esta materia!
              </p>
            </>
          )}
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

  if (!currentQuestion) {
    return <div>Generando siguiente pregunta...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Inicio</span>
          </button>
          <div className="flex items-center text-indigo-600">
            <BookOpen className="h-5 w-5 mr-2" />
            <span>Modo Repaso</span>
          </div>
        </div>
        <button
          onClick={handleStop}
          className="text-gray-600 hover:text-red-600 transition-colors"
        >
          STOP
        </button>
      </div>

      <div className="mb-4 text-sm font-medium text-gray-600">
        Materia: {
          currentQuestion.subject === 'M1' ? 'Matemática 1' :
          currentQuestion.subject === 'M2' ? 'Matemática 2' :
          currentQuestion.subject === 'L' ? 'Lenguaje' :
          'Ciencias'
        }
      </div>

      <QuestionView
        question={currentQuestion}
        currentAnswer={currentAnswer}
        onAnswer={handleAnswer}
        showExplanation={showExplanation}
      />

      {showExplanation && (
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2 mb-6">
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
            Siguiente Pregunta
          </button>
        </div>
      )}
    </div>
  );
}