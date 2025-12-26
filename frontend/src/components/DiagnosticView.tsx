import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Clock, Zap, Brain, 
  AlertTriangle, CheckCircle, BookOpen, Calendar, Award,
  ChevronRight, Flame, Star, Trophy, ArrowRight, Play, BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, subWeeks, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { StrengthsWeaknessesModal } from './StrengthsWeaknessesModal';

interface DiagnosticViewProps {
  onStartPractice?: (subject: string, tema?: string) => void;
}

interface TopicStats {
  name: string;
  subject: string;
  total: number;
  correct: number;
  percentage: number;
  trend?: number; // cambio vs semana pasada
}

interface SubjectDiagnostic {
  subject: string;
  total: number;
  correct: number;
  percentage: number;
  trend: number;
  estimatedScore: { min: number; max: number };
  areas: {
    name: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

interface DiagnosticData {
  strengths: TopicStats[];
  weaknesses: TopicStats[];
  criticalTopics: TopicStats[];
  subjectDiagnostics: SubjectDiagnostic[];
  studyTime: {
    total: number; // minutos
    thisWeek: number;
    avgPerDay: number;
    streak: number;
    bestStreak: number;
  };
  todayRecommendation: {
    subject: string;
    subjectName: string;
    topic: string;
    reason: string;
    questionCount: number;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
    maxProgress?: number;
    unlockedAt?: string;
  }[];
  overallTrend: number;
}

const subjectNames: Record<string, string> = {
  M1: 'Matemática 1',
  M2: 'Matemática 2',
  L: 'Lenguaje',
  C: 'Ciencias',
  CB: 'Biología',
  CF: 'Física',
  CQ: 'Química',
  H: 'Historia',
};

const subjectColors: Record<string, { bg: string; text: string; gradient: string }> = {
  M1: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-blue-700' },
  M2: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-indigo-700' },
  L: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-700' },
  C: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-rose-700' },
  CB: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', gradient: 'from-green-500 to-green-700' },
  CF: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500 to-cyan-700' },
  CQ: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500 to-pink-700' },
  H: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-700' },
};

// Función para estimar puntaje PAES basado en porcentaje de aciertos
function estimatePAESScore(percentage: number): { min: number; max: number } {
  // Escala aproximada PAES: 100-1000 puntos
  // 0% ≈ 100-150, 50% ≈ 500-550, 100% ≈ 950-1000
  const baseMin = 100 + (percentage * 8.5);
  const baseMax = 150 + (percentage * 8.5);
  return {
    min: Math.round(Math.max(100, Math.min(1000, baseMin))),
    max: Math.round(Math.max(100, Math.min(1000, baseMax)))
  };
}

// Componente de barra de progreso con gradiente
function ProgressBar({ percentage, size = 'md' }: { percentage: number; size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const getColor = (pct: number) => {
    if (pct >= 75) return 'from-emerald-400 to-emerald-600';
    if (pct >= 50) return 'from-yellow-400 to-amber-500';
    if (pct >= 25) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${heights[size]} overflow-hidden`}>
      <div
        className={`${heights[size]} rounded-full bg-gradient-to-r ${getColor(percentage)} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}

// Componente de mapa de calor
function HeatmapCell({ percentage, label }: { percentage: number; label: string }) {
  const getColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500 text-white';
    if (pct >= 60) return 'bg-emerald-300 text-emerald-900';
    if (pct >= 40) return 'bg-yellow-300 text-yellow-900';
    if (pct >= 20) return 'bg-orange-400 text-orange-900';
    return 'bg-red-500 text-white';
  };

  return (
    <div 
      className={`${getColor(percentage)} rounded-lg p-3 text-center transition-transform hover:scale-105 cursor-default`}
      title={`${label}: ${percentage.toFixed(0)}%`}
    >
      <div className="text-xs font-medium truncate">{label}</div>
      <div className="text-lg font-bold">{percentage.toFixed(0)}%</div>
    </div>
  );
}

// Componente de logro/badge
function AchievementBadge({ achievement }: { achievement: DiagnosticData['achievements'][0] }) {
  const iconMap: Record<string, React.ReactNode> = {
    'flame': <Flame className="w-6 h-6" />,
    'star': <Star className="w-6 h-6" />,
    'trophy': <Trophy className="w-6 h-6" />,
    'target': <Target className="w-6 h-6" />,
    'zap': <Zap className="w-6 h-6" />,
    'brain': <Brain className="w-6 h-6" />,
    'award': <Award className="w-6 h-6" />,
    'book': <BookOpen className="w-6 h-6" />,
  };

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all ${
        achievement.unlocked 
          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-400 dark:border-amber-600'
          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50'
      }`}
    >
      <div className={`flex items-center gap-3 ${achievement.unlocked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {iconMap[achievement.icon] || <Award className="w-6 h-6" />}
        <div className="flex-1">
          <div className="font-semibold text-sm">{achievement.name}</div>
          <div className="text-xs opacity-80">{achievement.description}</div>
        </div>
      </div>
      {achievement.progress !== undefined && achievement.maxProgress && !achievement.unlocked && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progreso</span>
            <span>{achievement.progress}/{achievement.maxProgress}</span>
          </div>
          <ProgressBar percentage={(achievement.progress / achievement.maxProgress) * 100} size="sm" />
        </div>
      )}
      {achievement.unlocked && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1">
          <CheckCircle className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

export function DiagnosticView({ onStartPractice }: DiagnosticViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [showStrengthsModal, setShowStrengthsModal] = useState(false);
  const [showWeaknessesModal, setShowWeaknessesModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchDiagnostic = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const oneWeekAgo = subWeeks(now, 1);
        const twoWeeksAgo = subWeeks(now, 2);

        // Obtener todos los intentos
        const { data: allAttempts, error: attemptsError } = await supabase
          .from('question_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (attemptsError) throw attemptsError;

        // Obtener sesiones para tiempo de estudio
        const { data: sessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (sessionsError) throw sessionsError;

        // Separar intentos por período
        const thisWeekAttempts = allAttempts?.filter(a => 
          parseISO(a.created_at) >= oneWeekAgo
        ) || [];
        const lastWeekAttempts = allAttempts?.filter(a => 
          parseISO(a.created_at) >= twoWeeksAgo && parseISO(a.created_at) < oneWeekAgo
        ) || [];

        // Calcular estadísticas por tema
        const topicStats: Record<string, TopicStats> = {};
        const topicStatsLastWeek: Record<string, { total: number; correct: number }> = {};

        allAttempts?.forEach(attempt => {
          const key = `${attempt.subject}-${attempt.area_tematica || 'General'}`;
          if (!topicStats[key]) {
            topicStats[key] = {
              name: attempt.area_tematica || 'General',
              subject: attempt.subject,
              total: 0,
              correct: 0,
              percentage: 0
            };
          }
          topicStats[key].total++;
          if (attempt.is_correct) topicStats[key].correct++;
        });

        lastWeekAttempts.forEach(attempt => {
          const key = `${attempt.subject}-${attempt.area_tematica || 'General'}`;
          if (!topicStatsLastWeek[key]) {
            topicStatsLastWeek[key] = { total: 0, correct: 0 };
          }
          topicStatsLastWeek[key].total++;
          if (attempt.is_correct) topicStatsLastWeek[key].correct++;
        });

        // Calcular porcentajes y tendencias
        Object.keys(topicStats).forEach(key => {
          const stat = topicStats[key];
          stat.percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
          
          const lastWeek = topicStatsLastWeek[key];
          if (lastWeek && lastWeek.total >= 3) {
            const lastWeekPct = (lastWeek.correct / lastWeek.total) * 100;
            stat.trend = stat.percentage - lastWeekPct;
          }
        });

        const topicArray = Object.values(topicStats).filter(t => t.total >= 3);
        
        // Fortalezas (>70% y al menos 5 preguntas)
        const strengths = topicArray
          .filter(t => t.percentage >= 70 && t.total >= 5)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);

        // Debilidades (<50% y al menos 3 preguntas)
        const weaknesses = topicArray
          .filter(t => t.percentage < 50 && t.total >= 3)
          .sort((a, b) => a.percentage - b.percentage)
          .slice(0, 5);

        // Temas críticos (los peores)
        const criticalTopics = topicArray
          .filter(t => t.total >= 3)
          .sort((a, b) => a.percentage - b.percentage)
          .slice(0, 5);

        // Diagnóstico por materia
        const subjectStats: Record<string, SubjectDiagnostic> = {};
        allAttempts?.forEach(attempt => {
          if (!subjectStats[attempt.subject]) {
            subjectStats[attempt.subject] = {
              subject: attempt.subject,
              total: 0,
              correct: 0,
              percentage: 0,
              trend: 0,
              estimatedScore: { min: 100, max: 150 },
              areas: []
            };
          }
          subjectStats[attempt.subject].total++;
          if (attempt.is_correct) subjectStats[attempt.subject].correct++;
        });

        // Calcular porcentajes y scores por materia
        Object.keys(subjectStats).forEach(subject => {
          const stat = subjectStats[subject];
          stat.percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
          stat.estimatedScore = estimatePAESScore(stat.percentage);

          // Calcular tendencia
          const thisWeekSubject = thisWeekAttempts.filter(a => a.subject === subject);
          const lastWeekSubject = lastWeekAttempts.filter(a => a.subject === subject);
          
          if (thisWeekSubject.length >= 3 && lastWeekSubject.length >= 3) {
            const thisWeekPct = (thisWeekSubject.filter(a => a.is_correct).length / thisWeekSubject.length) * 100;
            const lastWeekPct = (lastWeekSubject.filter(a => a.is_correct).length / lastWeekSubject.length) * 100;
            stat.trend = thisWeekPct - lastWeekPct;
          }

          // Áreas por materia
          const areasMap: Record<string, { total: number; correct: number }> = {};
          allAttempts?.filter(a => a.subject === subject).forEach(a => {
            const area = a.area_tematica || 'General';
            if (!areasMap[area]) areasMap[area] = { total: 0, correct: 0 };
            areasMap[area].total++;
            if (a.is_correct) areasMap[area].correct++;
          });
          
          stat.areas = Object.entries(areasMap).map(([name, data]) => ({
            name,
            total: data.total,
            correct: data.correct,
            percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
          })).sort((a, b) => a.percentage - b.percentage);
        });

        // Tiempo de estudio
        const totalTime = sessions?.reduce((sum, s) => sum + (s.time_spent || 0), 0) || 0;
        const thisWeekSessions = sessions?.filter(s => parseISO(s.created_at) >= oneWeekAgo) || [];
        const thisWeekTime = thisWeekSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0);

        // Calcular racha
        const sessionDays = new Set(
          sessions?.map(s => format(parseISO(s.created_at), 'yyyy-MM-dd')) || []
        );
        const sortedDays = Array.from(sessionDays).sort().reverse();
        
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        // Check current streak
        if (sessionDays.has(today) || sessionDays.has(yesterday)) {
          let checkDate = sessionDays.has(today) ? new Date() : subDays(new Date(), 1);
          while (sessionDays.has(format(checkDate, 'yyyy-MM-dd'))) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
          }
        }

        // Calculate best streak
        const allDaysSorted = Array.from(sessionDays).sort();
        allDaysSorted.forEach((day, i) => {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDay = allDaysSorted[i - 1];
            const diff = differenceInDays(parseISO(day), parseISO(prevDay));
            if (diff === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          bestStreak = Math.max(bestStreak, tempStreak);
        });

        const daysWithData = sessionDays.size || 1;
        const avgPerDay = Math.round(totalTime / daysWithData / 60); // minutos

        // Recomendación del día
        const worstTopic = criticalTopics[0];
        const todayRecommendation = worstTopic ? {
          subject: worstTopic.subject,
          subjectName: subjectNames[worstTopic.subject] || worstTopic.subject,
          topic: worstTopic.name,
          reason: `Solo ${worstTopic.percentage.toFixed(0)}% de aciertos`,
          questionCount: 15
        } : {
          subject: 'M1',
          subjectName: 'Matemática 1',
          topic: 'General',
          reason: 'Comienza tu práctica',
          questionCount: 10
        };

        // Logros
        const totalQuestions = allAttempts?.length || 0;
        const totalCorrect = allAttempts?.filter(a => a.is_correct).length || 0;
        const perfectSessions = sessions?.filter(s => 
          s.questions_total > 0 && s.questions_correct === s.questions_total
        ).length || 0;

        const achievements: DiagnosticData['achievements'] = [
          {
            id: 'first_session',
            name: 'Primer Paso',
            description: 'Completa tu primera sesión',
            icon: 'star',
            unlocked: (sessions?.length || 0) >= 1,
            unlockedAt: sessions?.[0]?.created_at
          },
          {
            id: 'streak_3',
            name: 'Racha de 3',
            description: '3 días seguidos practicando',
            icon: 'flame',
            unlocked: bestStreak >= 3,
            progress: currentStreak,
            maxProgress: 3
          },
          {
            id: 'streak_7',
            name: 'Semana Perfecta',
            description: '7 días seguidos practicando',
            icon: 'flame',
            unlocked: bestStreak >= 7,
            progress: Math.min(currentStreak, 7),
            maxProgress: 7
          },
          {
            id: 'questions_100',
            name: 'Centenario',
            description: 'Responde 100 preguntas',
            icon: 'target',
            unlocked: totalQuestions >= 100,
            progress: totalQuestions,
            maxProgress: 100
          },
          {
            id: 'questions_500',
            name: 'Medio Millar',
            description: 'Responde 500 preguntas',
            icon: 'zap',
            unlocked: totalQuestions >= 500,
            progress: totalQuestions,
            maxProgress: 500
          },
          {
            id: 'perfect_exam',
            name: 'Perfección',
            description: 'Obtén 100% en un examen',
            icon: 'trophy',
            unlocked: perfectSessions >= 1
          },
          {
            id: 'perfect_5',
            name: 'Maestro',
            description: '5 exámenes perfectos',
            icon: 'award',
            unlocked: perfectSessions >= 5,
            progress: perfectSessions,
            maxProgress: 5
          },
          {
            id: 'all_subjects',
            name: 'Multidisciplinario',
            description: 'Practica todas las materias',
            icon: 'book',
            unlocked: Object.keys(subjectStats).length >= 5,
            progress: Object.keys(subjectStats).length,
            maxProgress: 5
          }
        ];

        // Tendencia general
        const thisWeekCorrect = thisWeekAttempts.filter(a => a.is_correct).length;
        const lastWeekCorrect = lastWeekAttempts.filter(a => a.is_correct).length;
        const thisWeekPct = thisWeekAttempts.length > 0 ? (thisWeekCorrect / thisWeekAttempts.length) * 100 : 0;
        const lastWeekPct = lastWeekAttempts.length > 0 ? (lastWeekCorrect / lastWeekAttempts.length) * 100 : 0;
        const overallTrend = thisWeekPct - lastWeekPct;

        setDiagnostic({
          strengths,
          weaknesses,
          criticalTopics,
          subjectDiagnostics: Object.values(subjectStats).sort((a, b) => b.total - a.total),
          studyTime: {
            total: Math.round(totalTime / 60), // convertir a minutos
            thisWeek: Math.round(thisWeekTime / 60),
            avgPerDay,
            streak: currentStreak,
            bestStreak
          },
          todayRecommendation,
          achievements,
          overallTrend
        });

      } catch (error) {
        console.error('Error fetching diagnostic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostic();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Analizando tu progreso...</p>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aún no hay datos suficientes para generar un diagnóstico.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          ¡Completa algunas sesiones de práctica para ver tu análisis!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con tendencia general */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Tu rendimiento esta semana</h3>
            <div className="flex items-center gap-3 mt-2">
              {diagnostic.overallTrend > 0 ? (
                <TrendingUp className="w-8 h-8" />
              ) : diagnostic.overallTrend < 0 ? (
                <TrendingDown className="w-8 h-8" />
              ) : (
                <Target className="w-8 h-8" />
              )}
              <span className="text-3xl font-bold">
                {diagnostic.overallTrend > 0 ? '+' : ''}{diagnostic.overallTrend.toFixed(1)}%
              </span>
              <span className="opacity-80">vs semana pasada</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Flame className="w-6 h-6 text-orange-300" />
              <span className="text-2xl font-bold">{diagnostic.studyTime.streak}</span>
              <span className="opacity-80">días de racha</span>
            </div>
            <div className="text-sm opacity-70 mt-1">
              Mejor racha: {diagnostic.studyTime.bestStreak} días
            </div>
          </div>
        </div>
      </div>

      {/* Recomendación del día */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              📚 Recomendación de hoy
            </h3>
            <p className="text-amber-800 dark:text-amber-200 mt-1">
              Practica <strong>{diagnostic.todayRecommendation.questionCount} preguntas</strong> de{' '}
              <strong>{diagnostic.todayRecommendation.topic}</strong> en{' '}
              <strong>{diagnostic.todayRecommendation.subjectName}</strong>
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {diagnostic.todayRecommendation.reason}
            </p>
          </div>
          {onStartPractice && (
            <button
              onClick={() => onStartPractice(diagnostic.todayRecommendation.subject, diagnostic.todayRecommendation.topic)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Comenzar
            </button>
          )}
        </div>
      </div>

      {/* Fortalezas y Debilidades - Cards Clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fortalezas */}
        <div 
          onClick={() => diagnostic.strengths.length > 0 && setShowStrengthsModal(true)}
          className={`bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg transition-all duration-300 ${
            diagnostic.strengths.length > 0 ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Fortalezas</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {diagnostic.strengths.length} áreas dominadas
                </p>
              </div>
            </div>
            {diagnostic.strengths.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-md">
                <BarChart3 className="w-4 h-4" />
                Ver análisis
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {diagnostic.strengths.length > 0 ? (
            <div className="space-y-3">
              {diagnostic.strengths.slice(0, 3).map((topic, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${subjectColors[topic.subject]?.bg} ${subjectColors[topic.subject]?.text}`}>
                        {subjectNames[topic.subject] || topic.subject}
                      </span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                        {topic.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {topic.percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.correct}/{topic.total} correctas
                    </div>
                  </div>
                </div>
              ))}
              {diagnostic.strengths.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    +{diagnostic.strengths.length - 3} más • Clic para ver gráficos detallados
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">Sigue practicando</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">para identificar tus fortalezas</p>
            </div>
          )}
        </div>

        {/* Debilidades / Por Reforzar */}
        <div 
          onClick={() => diagnostic.weaknesses.length > 0 && setShowWeaknessesModal(true)}
          className={`bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg transition-all duration-300 ${
            diagnostic.weaknesses.length > 0 ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-red-400 dark:hover:border-red-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Por Reforzar</h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {diagnostic.weaknesses.length} áreas a mejorar
                </p>
              </div>
            </div>
            {diagnostic.weaknesses.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl shadow-md">
                <Target className="w-4 h-4" />
                Plan de mejora
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {diagnostic.weaknesses.length > 0 ? (
            <div className="space-y-3">
              {diagnostic.weaknesses.slice(0, 3).map((topic, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${subjectColors[topic.subject]?.bg} ${subjectColors[topic.subject]?.text}`}>
                        {subjectNames[topic.subject] || topic.subject}
                      </span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                        {topic.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {topic.percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.correct}/{topic.total} correctas
                    </div>
                  </div>
                </div>
              ))}
              {diagnostic.weaknesses.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    +{diagnostic.weaknesses.length - 3} más • Clic para ver plan de estudio
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">¡Excelente!</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">No hay áreas críticas detectadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Predictor de Puntaje por Materia */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Puntaje PAES Estimado</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (basado en tu rendimiento actual)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagnostic.subjectDiagnostics.map(subj => (
            <div 
              key={subj.subject}
              className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-4`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${subjectColors[subj.subject]?.gradient || 'from-gray-500 to-gray-700'} opacity-5`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {subjectNames[subj.subject] || subj.subject}
                  </span>
                  {subj.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-xs ${
                      subj.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {subj.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {subj.trend > 0 ? '+' : ''}{subj.trend.toFixed(0)}%
                    </div>
                  )}
                </div>
                
                <div className="text-center py-3">
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {subj.estimatedScore.min} - {subj.estimatedScore.max}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    puntos estimados
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Aciertos: {subj.percentage.toFixed(0)}%</span>
                    <span>{subj.correct}/{subj.total}</span>
                  </div>
                  <ProgressBar percentage={subj.percentage} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {diagnostic.subjectDiagnostics.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Practica al menos una materia para ver tu puntaje estimado
          </p>
        )}
      </div>

      {/* Mapa de Calor por Área */}
      {diagnostic.subjectDiagnostics.some(s => s.areas.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Mapa de Rendimiento</h3>
          </div>
          
          <div className="space-y-4">
            {diagnostic.subjectDiagnostics.filter(s => s.areas.length > 0).map(subj => (
              <div key={subj.subject}>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {subjectNames[subj.subject] || subj.subject}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {subj.areas.map(area => (
                    <HeatmapCell 
                      key={area.name}
                      percentage={area.percentage}
                      label={area.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tiempo de Estudio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <Clock className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {diagnostic.studyTime.total}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">minutos totales</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {diagnostic.studyTime.thisWeek}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">min esta semana</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {diagnostic.studyTime.avgPerDay}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">min promedio/día</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {diagnostic.studyTime.streak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">días de racha</div>
        </div>
      </div>

      {/* Logros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Logros</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {diagnostic.achievements.filter(a => a.unlocked).length}/{diagnostic.achievements.length} desbloqueados
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {diagnostic.achievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Modales de Análisis Detallado */}
      <StrengthsWeaknessesModal
        isOpen={showStrengthsModal}
        onClose={() => setShowStrengthsModal(false)}
        type="strengths"
        data={diagnostic.strengths}
        subjectDiagnostics={diagnostic.subjectDiagnostics}
        onStartPractice={onStartPractice}
      />

      <StrengthsWeaknessesModal
        isOpen={showWeaknessesModal}
        onClose={() => setShowWeaknessesModal(false)}
        type="weaknesses"
        data={diagnostic.weaknesses}
        subjectDiagnostics={diagnostic.subjectDiagnostics}
        onStartPractice={onStartPractice}
      />
    </div>
  );
}
