import React, { useState, useEffect } from 'react';
import { Home, BookOpen, CheckCircle2, AlertCircle, Brain, FileText, HelpCircle } from 'lucide-react';
import type { Question, Subject } from '../types';
import { QuestionView } from './QuestionView';
import { PdfViewer } from './PdfViewer';
import { getQuestionsBySubject } from '../lib/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';

interface ReviewModeProps {
  subject: Subject;
  onExit: () => void;
  questionCount?: number;
}

interface ReadingText {
  id: number;
  title: string;
  pdf_url: string;
  page_start: number;
  page_end: number;
}

interface TopicStats {
  topic: string;
  correctCount: number;
  totalAttempts: number;
  consecutiveCorrect: number;
  currentDifficulty: number;
}

export function ReviewMode({ subject, onExit, questionCount = 0 }: ReviewModeProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
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
  
  const [sessionId] = useState<string>(() => crypto.randomUUID());

  const [activeTab, setActiveTab] = useState<'text' | 'questions'>('text');
  const [readingTexts, setReadingTexts] = useState<Record<number, ReadingText>>({});
  const [previousReadingTextId, setPreviousReadingTextId] = useState<number | null>(null);

  const isLanguageQuestion = currentQuestion?.subject === 'L';
  const currentReadingText = currentQuestion?.reading_text_id 
    ? readingTexts[currentQuestion.reading_text_id] 
    : null;

  const hasQuestionLimit = questionCount > 0;
  const reachedLimit = hasQuestionLimit && questionsAnswered >= questionCount;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const questions = await getQuestionsBySubject(subject);
        setAllQuestions(questions);

        if (subject === 'L') {
          await loadReadingTexts(questions);
        }

        const stats: Record<string, TopicStats> = {};
        questions.forEach(q => {
          const topic = q.tema || q.areaTematica || 'general';
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

        if (user) {
          const { data: attempts } = await supabase
            .from('question_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('subject', subject);

          attempts?.forEach(attempt => {
            const topic = attempt.tema || attempt.area_tematica || 'general';
            if (stats[topic]) {
              stats[topic].totalAttempts++;
              if (attempt.is_correct) {
                stats[topic].correctCount++;
              }
            }
          });
        }

        setTopicStats(stats);
        generateNextQuestion(questions, stats);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar las preguntas');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, subject]);

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

  useEffect(() => {
    if (currentQuestion?.reading_text_id && currentQuestion.reading_text_id !== previousReadingTextId) {
      setActiveTab('text');
      setPreviousReadingTextId(currentQuestion.reading_text_id);
    }
  }, [currentQuestion?.reading_text_id]);

  const generateNextQuestion = (questions: Question[], currentStats: Record<string, TopicStats>) => {
    if (questions.length === 0) {
      setIsFinished(true);
      return;
    }

    const eligibleTopics = Object.values(currentStats).filter(
      stat => stat.consecutiveCorrect < 3
    );

    if (eligibleTopics.length === 0) {
      setIsFinished(true);
      return;
    }

    eligibleTopics.sort((a, b) => 
      (a.correctCount / (a.totalAttempts || 1)) - (b.correctCount / (b.totalAttempts || 1))
    );

    const targetTopic = eligibleTopics[0].topic;
    const topicQuestions = questions.filter(q => 
      (q.tema || q.areaTematica || 'general') === targetTopic
    );

    if (topicQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * topicQuestions.length);
      setCurrentQuestion(topicQuestions[randomIndex]);
      setCurrentTopic(targetTopic);
    } else {
      const randomIndex = Math.floor(Math.random() * questions.length);
      setCurrentQuestion(questions[randomIndex]);
      setCurrentTopic('general');
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

    if (topicStat) {
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
    }

    saveAttempt(answer, isCorrect);
  };

  const saveAttempt = async (answer: string, isCorrect: boolean) => {
    if (!user || !currentQuestion) return;

    try {
      await supabase.from('question_attempts').insert({
        user_id: user.id,
        session_id: sessionId,
        question_id: currentQuestion.id,
        subject: currentQuestion.subject,
        mode: 'REVIEW',
        area_tematica: currentQuestion.areaTematica || currentQuestion.area_tematica,
        tema: currentQuestion.tema,
        subtema: currentQuestion.subtema,
        answer,
        is_correct: isCorrect,
        time_spent: 0
      });
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  const handleNext = () => {
    if (hasQuestionLimit && questionsAnswered >= questionCount) {
      handleStop();
      return;
    }
    
    setCurrentAnswer(null);
    setShowExplanation(false);
    generateNextQuestion(allQuestions, topicStats);
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
      await supabase.from('user_sessions').insert({
        id: sessionId,
        user_id: user.id,
        subject,
        mode: 'REVIEW',
        questions_total: questionsAnswered,
        questions_correct: correctAnswers,
        time_spent: timeSpent
      });
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
        <div className="text-gray-600 dark:text-gray-300">Analizando tu historial de práctica...</div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          {wantsToStop || reachedLimit ? '¡Práctica Finalizada!' : '¡Felicitaciones!'}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8">
          {wantsToStop || reachedLimit ? (
            <>
              <div className={`text-6xl font-bold ${colors.primaryText} mb-4`}>{percentage}%</div>
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                Has respondido {correctAnswers} de {questionsAnswered} preguntas correctamente
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                ¡Continúa practicando para mejorar tu rendimiento!
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <Brain className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-xl text-gray-800 dark:text-gray-100">
                ¡Has dominado todos los temas de esta materia!
              </p>
            </>
          )}
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

  if (!currentQuestion) {
    return <div className="text-gray-600 dark:text-gray-300">Generando siguiente pregunta...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
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
            {hasQuestionLimit && (
              <span className={`ml-2 ${colors.primaryText}`}>
                ({questionsAnswered}/{questionCount})
              </span>
            )}
          </span>
          <button
            onClick={handleStop}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Terminar
          </button>
        </div>
      </div>

      {hasQuestionLimit && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progreso</span>
            <span>{questionsAnswered} de {questionCount} preguntas</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`${colors.primary} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(questionsAnswered / questionCount) * 100}%` }}
            />
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-center space-x-2 mb-6">
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
              <button
                onClick={handleNext}
                className={`w-full px-6 py-3 ${colors.primary} text-white rounded-lg ${colors.primaryHover} transition-colors`}
              >
                {hasQuestionLimit && questionsAnswered >= questionCount 
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
