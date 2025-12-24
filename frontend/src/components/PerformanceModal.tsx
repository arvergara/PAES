import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, ChevronRight, ChevronDown, History, Target, Clock, GraduationCap, BookOpen, Trophy, Award, Zap, Star, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, subWeeks, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { QuestionAttempt } from '../types';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimeRange = 'day' | 'week' | 'month';
type TabType = 'progress' | 'history' | 'records';

interface AreaStats {
  total: number;
  correct: number;
  temas: Record<string, {
    total: number;
    correct: number;
    subtemas: Record<string, {
      total: number;
      correct: number;
    }>;
  }>;
}

interface SubjectStats {
  [subject: string]: {
    total: number;
    correct: number;
    areas: Record<string, AreaStats>;
  };
}

interface SessionRecord {
  id: string;
  subject: string;
  mode: string;
  questions_total: number;
  questions_correct: number;
  time_spent: number;
  created_at: string;
}

interface RecordEntry {
  percentage: number;
  date: string;
  mode: string;
  subject: string;
  time_spent: number;
  questions_total: number;
  questions_correct: number;
}

interface RecordData {
  bestBySubject: Record<string, RecordEntry>;
  bestByMode: Record<string, RecordEntry>;
  topBySubject: Record<string, RecordEntry[]>;
  topByMode: Record<string, RecordEntry[]>;
  fastestExam: { time: number; subject: string; percentage: number; date: string; mode: string } | null;
  fastestExams: Array<{ time: number; subject: string; percentage: number; date: string; mode: string }>;
  mostQuestionsDay: { count: number; date: string } | null;
  topQuestionsDays: Array<{ count: number; date: string }>;
  currentStreak: number;
  bestStreak: number;
  totalExams: number;
  totalQuestions: number;
  perfectExams: number;
  averageScore: number;
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
  ALL: 'Todas las Materias'
};

const subjectColors: Record<string, string> = {
  M1: 'bg-blue-500',
  M2: 'bg-purple-500',
  L: 'bg-red-500',
  C: 'bg-emerald-500',
  CB: 'bg-green-500',
  CF: 'bg-cyan-500',
  CQ: 'bg-pink-500',
  H: 'bg-amber-500',
};

const subjectGradients: Record<string, string> = {
  M1: 'from-blue-500 to-blue-700',
  M2: 'from-purple-500 to-indigo-700',
  L: 'from-red-500 to-rose-700',
  C: 'from-emerald-500 to-teal-700',
  CB: 'from-green-500 to-green-700',
  CF: 'from-cyan-500 to-cyan-700',
  CQ: 'from-pink-500 to-pink-700',
  H: 'from-amber-500 to-orange-700',
};

const modeNames: Record<string, string> = {
  TEST: 'Test',
  PAES: 'PAES',
  REVIEW: 'Repaso'
};

const modeIcons: Record<string, React.ReactNode> = {
  TEST: <Target className="w-4 h-4" />,
  PAES: <GraduationCap className="w-4 h-4" />,
  REVIEW: <BookOpen className="w-4 h-4" />
};

const modeGradients: Record<string, string> = {
  TEST: 'from-indigo-500 to-indigo-700',
  PAES: 'from-purple-500 to-purple-700',
  REVIEW: 'from-green-500 to-green-700'
};

const areaColors = {
  'Números': '#4F46E5',
  'Álgebra y Funciones': '#7C3AED',
  'Geometría': '#EC4899',
  'Probabilidad y Estadística': '#8B5CF6',
  'Localizar': '#10B981',
  'Interpretar': '#059669',
  'Evaluar': '#047857',
  'Biología': '#EF4444',
  'Química': '#DC2626',
  'Física': '#B91C1C',
  'Historia Universal': '#F59E0B',
  'Historia de Chile': '#D97706',
  'Geografía': '#B45309'
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1).replace('.', ',')}%`;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {formatPercentage(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function AreaBreakdown({ subject, stats }: { subject: string; stats: SubjectStats }) {
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const [expandedTemas, setExpandedTemas] = useState<Record<string, boolean>>({});

  const toggleArea = (area: string) => {
    setExpandedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const toggleTema = (tema: string) => {
    setExpandedTemas(prev => ({ ...prev, [tema]: !prev[tema] }));
  };

  const subjectStat = stats[subject];
  if (!subjectStat) return null;

  const pieData = Object.entries(subjectStat.areas).map(([area, data]) => ({
    name: area,
    value: data.total > 0 ? (data.correct / data.total) * 100 : 0
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {subjectNames[subject] || subject}
      </h3>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={areaColors[entry.name as keyof typeof areaColors] || `hsl(${index * 45}, 70%, 50%)`}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatPercentage(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        {Object.entries(subjectStat.areas).map(([area, areaData]) => (
          <div key={area} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4">
            <button
              onClick={() => toggleArea(area)}
              className="w-full flex items-center justify-between text-left py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200">{area}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {areaData.correct}/{areaData.total} correctas
                </span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${areaData.total > 0 ? (areaData.correct / areaData.total) * 100 : 0}%`
                    }}
                  />
                </div>
                {expandedAreas[area] ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </button>

            {expandedAreas[area] && (
              <div className="pl-4 mt-2 space-y-3">
                {Object.entries(areaData.temas).map(([tema, temaData]) => (
                  <div key={tema}>
                    <button
                      onClick={() => toggleTema(`${area}-${tema}`)}
                      className="w-full flex items-center justify-between text-left py-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded px-2 -mx-2 transition-colors"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300">{tema}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {temaData.correct}/{temaData.total}
                        </span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-indigo-400 rounded-full h-1.5 transition-all duration-300"
                            style={{
                              width: `${temaData.total > 0 ? (temaData.correct / temaData.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                        {expandedTemas[`${area}-${tema}`] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedTemas[`${area}-${tema}`] && (
                      <div className="pl-4 mt-1 space-y-2">
                        {Object.entries(temaData.subtemas).map(([subtema, subtemaData]) => (
                          <div key={subtema} className="flex items-center justify-between py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{subtema}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {subtemaData.correct}/{subtemaData.total}
                              </span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                <div
                                  className="bg-indigo-300 rounded-full h-1 transition-all duration-300"
                                  style={{
                                    width: `${subtemaData.total > 0 ? (subtemaData.correct / subtemaData.total) * 100 : 0}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SessionAttempt {
  id: string;
  question_id: string;
  area_tematica: string;
  tema: string;
  subtema: string;
  answer: string;
  is_correct: boolean;
  time_spent: number;
}

function SessionHistory({ sessions, loading }: { sessions: SessionRecord[]; loading: boolean }) {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [sessionAttempts, setSessionAttempts] = useState<Record<string, SessionAttempt[]>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<Record<string, boolean>>({});

  const toggleSession = async (sessionId: string) => {
    const isExpanding = !expandedSessions[sessionId];
    setExpandedSessions(prev => ({ ...prev, [sessionId]: isExpanding }));

    // Load attempts if expanding and not already loaded
    if (isExpanding && !sessionAttempts[sessionId]) {
      setLoadingAttempts(prev => ({ ...prev, [sessionId]: true }));
      try {
        const { data, error } = await supabase
          .from('question_attempts')
          .select('id, question_id, area_tematica, tema, subtema, answer, is_correct, time_spent')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setSessionAttempts(prev => ({ ...prev, [sessionId]: data || [] }));
      } catch (error) {
        console.error('Error loading attempts:', error);
      } finally {
        setLoadingAttempts(prev => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aún no tienes exámenes completados. ¡Comienza a practicar!
        </p>
      </div>
    );
  }

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
    if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Clic en una sesión para ver el detalle de cada pregunta
      </p>
      {sessions.map((session) => {
        const percentage = session.questions_total > 0 
          ? Math.round((session.questions_correct / session.questions_total) * 100) 
          : 0;
        const isExpanded = expandedSessions[session.id];
        const attempts = sessionAttempts[session.id] || [];
        const isLoadingSession = loadingAttempts[session.id];

        // Group attempts by area_tematica
        const attemptsByArea: Record<string, SessionAttempt[]> = {};
        attempts.forEach(attempt => {
          const area = attempt.area_tematica || 'Sin clasificar';
          if (!attemptsByArea[area]) attemptsByArea[area] = [];
          attemptsByArea[area].push(attempt);
        });

        return (
          <div key={session.id}>
            <button
              onClick={() => toggleSession(session.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${subjectColors[session.subject] || 'bg-gray-400'}`} />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {subjectNames[session.subject] || session.subject}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.mode === 'PAES' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : session.mode === 'TEST'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {modeIcons[session.mode]}
                        {modeNames[session.mode] || session.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(session.created_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.time_spent)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {session.questions_correct} / {session.questions_total} correctas
                    </div>
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentage >= 75 ? 'bg-emerald-500' :
                          percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getPercentageColor(percentage)}`}>
                    {percentage}%
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-2 ml-4 pl-4 border-l-2 border-indigo-300 dark:border-indigo-700 space-y-3">
                {isLoadingSession ? (
                  <div className="flex items-center gap-2 py-4 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm">Cargando detalles...</span>
                  </div>
                ) : attempts.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No hay detalles disponibles para esta sesión
                  </p>
                ) : (
                  <>
                    {/* Summary by Area */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resumen por Área</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(attemptsByArea).map(([area, areaAttempts]) => {
                          const areaCorrect = areaAttempts.filter(a => a.is_correct).length;
                          const areaTotal = areaAttempts.length;
                          const areaPct = Math.round((areaCorrect / areaTotal) * 100);
                          return (
                            <div key={area} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{area}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {areaCorrect}/{areaTotal}
                                </span>
                                <span className={`text-sm font-bold ${
                                  areaPct >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                                  areaPct >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {areaPct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual Questions */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detalle de Preguntas</h4>
                      {attempts.map((attempt, idx) => (
                        <div 
                          key={attempt.id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            attempt.is_correct 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            attempt.is_correct
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {attempt.area_tematica && (
                                <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full truncate">
                                  {attempt.area_tematica}
                                </span>
                              )}
                              {attempt.tema && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {attempt.tema}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`font-bold ${
                              attempt.is_correct 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {attempt.answer?.toUpperCase() || '?'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {attempt.time_spent}s
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Time Analysis */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-700 dark:text-blue-300">
                          Tiempo promedio por pregunta: <strong>{Math.round(attempts.reduce((sum, a) => sum + a.time_spent, 0) / attempts.length)}s</strong>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordsView({ records, loading }: { records: RecordData | null; loading: boolean }) {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedModes, setExpandedModes] = useState<Record<string, boolean>>({});
  const [expandedFastest, setExpandedFastest] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const toggleMode = (mode: string) => {
    setExpandedModes(prev => ({ ...prev, [mode]: !prev[mode] }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando récords...</p>
      </div>
    );
  }

  if (!records || records.totalExams === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aún no tienes récords. ¡Completa algunos exámenes para ver tus mejores resultados!
        </p>
      </div>
    );
  }

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Total Exámenes</span>
          </div>
          <div className="text-3xl font-bold">{records.totalExams}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Perfectos</span>
          </div>
          <div className="text-3xl font-bold">{records.perfectExams}</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Preguntas</span>
          </div>
          <div className="text-3xl font-bold">{records.totalQuestions}</div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Mejor Racha</span>
          </div>
          <div className="text-3xl font-bold">{records.bestStreak} días</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Promedio</span>
          </div>
          <div className="text-3xl font-bold">{records.averageScore}%</div>
        </div>
      </div>

      {/* Best by Subject - Expandible */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Mejor Puntaje por Materia
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (clic para ver top 5)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(records.bestBySubject).map(([subject, data]) => (
            <div key={subject}>
              <button
                onClick={() => toggleSubject(subject)}
                className="w-full relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${subjectGradients[subject] || 'from-gray-500 to-gray-700'} opacity-10`} />
                <div className="relative p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {subjectNames[subject] || subject}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getPercentageColor(data.percentage)}`}>
                        {data.percentage}%
                      </span>
                      {expandedSubjects[subject] ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full ${
                      data.mode === 'PAES' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                      data.mode === 'TEST' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      {modeNames[data.mode] || data.mode}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(data.time_spent)}
                    </span>
                    <span>•</span>
                    <span>{format(parseISO(data.date), "d MMM yyyy", { locale: es })}</span>
                  </div>
                </div>
              </button>

              {/* Expanded: Top 5 */}
              {expandedSubjects[subject] && records.topBySubject[subject] && (
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                  {records.topBySubject[subject].map((entry, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400 text-amber-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={`font-semibold ${getPercentageColor(entry.percentage)}`}>
                          {entry.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{entry.questions_correct}/{entry.questions_total}</span>
                        <span>•</span>
                        <span>{formatTime(entry.time_spent)}</span>
                        <span>•</span>
                        <span>{format(parseISO(entry.date), "d MMM", { locale: es })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {Object.keys(records.bestBySubject).length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Aún no tienes récords por materia
          </p>
        )}
      </div>

      {/* Best by Mode - Expandible */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Mejor Puntaje por Modo
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (clic para ver top 5)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(records.bestByMode).map(([mode, data]) => (
            <div key={mode}>
              <button
                onClick={() => toggleMode(mode)}
                className="w-full relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${modeGradients[mode] || 'from-gray-500 to-gray-700'} opacity-10`} />
                <div className="relative p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {modeIcons[mode]}
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {modeNames[mode] || mode}
                      </span>
                    </div>
                    {expandedModes[mode] ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${getPercentageColor(data.percentage)}`}>
                    {data.percentage}%
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span>{subjectNames[data.subject] || data.subject}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(data.time_spent)}
                    </span>
                    <span>•</span>
                    <span>{format(parseISO(data.date), "d MMM yyyy", { locale: es })}</span>
                  </div>
                </div>
              </button>

              {/* Expanded: Top 5 */}
              {expandedModes[mode] && records.topByMode[mode] && (
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-purple-300 dark:border-purple-700">
                  {records.topByMode[mode].map((entry, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400 text-amber-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={`font-semibold ${getPercentageColor(entry.percentage)}`}>
                          {entry.percentage}%
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-gray-600 dark:text-gray-300">{subjectNames[entry.subject]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatTime(entry.time_spent)}</span>
                        <span>•</span>
                        <span>{format(parseISO(entry.date), "d MMM", { locale: es })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {Object.keys(records.bestByMode).length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Aún no tienes récords por modo
          </p>
        )}
      </div>

      {/* Special Records - Expandible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fastest Exam */}
        {records.fastestExam && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setExpandedFastest(!expandedFastest)}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Exámenes Más Rápidos
                  </h3>
                </div>
                {expandedFastest ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {formatTime(records.fastestExam.time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {subjectNames[records.fastestExam.subject]} • {records.fastestExam.percentage}%
                  </div>
                </div>
                <Clock className="w-12 h-12 text-cyan-200 dark:text-cyan-800" />
              </div>
            </button>

            {expandedFastest && records.fastestExams.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                {records.fastestExams.map((exam, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-cyan-400 text-cyan-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-cyan-600 text-cyan-100' :
                        'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">
                        {formatTime(exam.time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{subjectNames[exam.subject]}</span>
                      <span>•</span>
                      <span>{exam.percentage}%</span>
                      <span>•</span>
                      <span>{format(parseISO(exam.date), "d MMM", { locale: es })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Most Questions in a Day */}
        {records.mostQuestionsDay && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setExpandedQuestions(!expandedQuestions)}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Días Más Productivos
                  </h3>
                </div>
                {expandedQuestions ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                    {records.mostQuestionsDay.count}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    preguntas respondidas
                  </div>
                </div>
                <Target className="w-12 h-12 text-rose-200 dark:text-rose-800" />
              </div>
            </button>

            {expandedQuestions && records.topQuestionsDays.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                {records.topQuestionsDays.map((day, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-rose-400 text-rose-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-rose-600 text-rose-100' :
                        'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {day.count} preguntas
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(day.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [stats, setStats] = useState<SubjectStats>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [records, setRecords] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Fetch sessions history
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchSessions = async () => {
      setSessionsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [isOpen, user]);

  // Fetch records
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchRecords = async () => {
      setRecordsLoading(true);
      try {
        // Fetch all sessions for records
        const { data: allSessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (sessionsError) throw sessionsError;

        // Fetch all attempts for daily count
        const { data: allAttempts, error: attemptsError } = await supabase
          .from('question_attempts')
          .select('created_at')
          .eq('user_id', user.id);

        if (attemptsError) throw attemptsError;

        // Calculate records
        const bestBySubject: Record<string, RecordEntry> = {};
        const bestByMode: Record<string, RecordEntry> = {};
        const allBySubject: Record<string, RecordEntry[]> = {};
        const allByMode: Record<string, RecordEntry[]> = {};
        const allFastExams: Array<{ time: number; subject: string; percentage: number; date: string; mode: string }> = [];
        
        let perfectExams = 0;
        let totalQuestions = 0;
        let totalScore = 0;
        let validExams = 0;

        allSessions?.forEach(session => {
          const percentage = session.questions_total > 0 
            ? Math.round((session.questions_correct / session.questions_total) * 100)
            : 0;
          
          totalQuestions += session.questions_total;
          if (session.questions_total > 0) {
            totalScore += percentage;
            validExams++;
          }
          
          if (percentage === 100) perfectExams++;

          const entry: RecordEntry = {
            percentage,
            date: session.created_at,
            mode: session.mode,
            subject: session.subject,
            time_spent: session.time_spent,
            questions_total: session.questions_total,
            questions_correct: session.questions_correct
          };

          // Track all by subject
          if (!allBySubject[session.subject]) {
            allBySubject[session.subject] = [];
          }
          allBySubject[session.subject].push(entry);

          // Track all by mode
          if (!allByMode[session.mode]) {
            allByMode[session.mode] = [];
          }
          allByMode[session.mode].push(entry);

          // Best by subject
          if (!bestBySubject[session.subject] || percentage > bestBySubject[session.subject].percentage) {
            bestBySubject[session.subject] = entry;
          }

          // Best by mode
          if (!bestByMode[session.mode] || percentage > bestByMode[session.mode].percentage) {
            bestByMode[session.mode] = entry;
          }

          // Fastest exams (with at least 50% correct)
          if (percentage >= 50 && session.time_spent > 0) {
            allFastExams.push({
              time: session.time_spent,
              subject: session.subject,
              percentage,
              date: session.created_at,
              mode: session.mode
            });
          }
        });

        // Sort and get top 5 by subject
        const topBySubject: Record<string, RecordEntry[]> = {};
        Object.entries(allBySubject).forEach(([subject, entries]) => {
          topBySubject[subject] = entries
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);
        });

        // Sort and get top 5 by mode
        const topByMode: Record<string, RecordEntry[]> = {};
        Object.entries(allByMode).forEach(([mode, entries]) => {
          topByMode[mode] = entries
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);
        });

        // Sort and get top 5 fastest exams
        const fastestExams = allFastExams
          .sort((a, b) => a.time - b.time)
          .slice(0, 5);

        // Calculate most questions in a day
        const questionsByDay: Record<string, number> = {};
        allAttempts?.forEach(attempt => {
          const day = format(parseISO(attempt.created_at), 'yyyy-MM-dd');
          questionsByDay[day] = (questionsByDay[day] || 0) + 1;
        });

        // Sort and get top 5 productive days
        const topQuestionsDays = Object.entries(questionsByDay)
          .map(([date, count]) => ({ count, date: `${date}T00:00:00Z` }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const mostQuestionsDay = topQuestionsDays[0] || null;

        // Calculate streaks (days with at least one session)
        const sessionDays = new Set(
          allSessions?.map(s => format(parseISO(s.created_at), 'yyyy-MM-dd')) || []
        );
        const sortedDays = Array.from(sessionDays).sort();
        
        let bestStreak = 0;
        let currentStreak = 0;
        let lastDate: Date | null = null;

        sortedDays.forEach(dayStr => {
          const day = parseISO(dayStr);
          if (lastDate) {
            const diff = Math.floor((day.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
          bestStreak = Math.max(bestStreak, currentStreak);
          lastDate = day;
        });

        // Check if current streak is still active
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        if (!sessionDays.has(today) && !sessionDays.has(yesterday)) {
          currentStreak = 0;
        }

        const averageScore = validExams > 0 ? Math.round(totalScore / validExams) : 0;

        setRecords({
          bestBySubject,
          bestByMode,
          topBySubject,
          topByMode,
          fastestExam: fastestExams[0] || null,
          fastestExams,
          mostQuestionsDay,
          topQuestionsDays,
          currentStreak,
          bestStreak,
          totalExams: allSessions?.length || 0,
          totalQuestions,
          perfectExams,
          averageScore
        });
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchRecords();
  }, [isOpen, user]);

  // Fetch progress stats
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDate;
        switch (timeRange) {
          case 'day':
            startDate = subDays(now, 7);
            break;
          case 'week':
            startDate = subWeeks(now, 4);
            break;
          case 'month':
            startDate = subMonths(now, 3);
            break;
        }

        const { data: attempts, error } = await supabase
          .from('question_attempts')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        const subjectStats: SubjectStats = {};
        attempts?.forEach((attempt) => {
          if (!subjectStats[attempt.subject]) {
            subjectStats[attempt.subject] = {
              total: 0,
              correct: 0,
              areas: {}
            };
          }

          const subjectStat = subjectStats[attempt.subject];
          subjectStat.total++;
          if (attempt.is_correct) subjectStat.correct++;

          if (attempt.area_tematica) {
            if (!subjectStat.areas[attempt.area_tematica]) {
              subjectStat.areas[attempt.area_tematica] = {
                total: 0,
                correct: 0,
                temas: {}
              };
            }

            const areaStat = subjectStat.areas[attempt.area_tematica];
            areaStat.total++;
            if (attempt.is_correct) areaStat.correct++;

            if (attempt.tema) {
              if (!areaStat.temas[attempt.tema]) {
                areaStat.temas[attempt.tema] = {
                  total: 0,
                  correct: 0,
                  subtemas: {}
                };
              }

              const temaStat = areaStat.temas[attempt.tema];
              temaStat.total++;
              if (attempt.is_correct) temaStat.correct++;

              if (attempt.subtema) {
                if (!temaStat.subtemas[attempt.subtema]) {
                  temaStat.subtemas[attempt.subtema] = {
                    total: 0,
                    correct: 0
                  };
                }

                const subtemaStat = temaStat.subtemas[attempt.subtema];
                subtemaStat.total++;
                if (attempt.is_correct) subtemaStat.correct++;
              }
            }
          }
        });

        setStats(subjectStats);

        const groupedData: Record<string, any> = {};
        attempts?.forEach(attempt => {
          let dateKey;
          const date = parseISO(attempt.created_at);
          
          switch (timeRange) {
            case 'day':
              dateKey = format(date, 'yyyy-MM-dd');
              break;
            case 'week':
              dateKey = `Semana ${format(date, 'w', { locale: es })}`;
              break;
            case 'month':
              dateKey = format(date, 'MMM yyyy', { locale: es });
              break;
          }

          if (!groupedData[dateKey]) {
            groupedData[dateKey] = {
              date: dateKey,
              M1: 0,
              M2: 0,
              L: 0,
              C: 0,
              H: 0,
              count: { M1: 0, M2: 0, L: 0, C: 0, H: 0 }
            };
          }

          groupedData[dateKey].count[attempt.subject]++;
          groupedData[dateKey][attempt.subject] = 
            ((groupedData[dateKey][attempt.subject] * (groupedData[dateKey].count[attempt.subject] - 1)) + 
            (attempt.is_correct ? 100 : 0)) / groupedData[dateKey].count[attempt.subject];
        });

        setChartData(Object.values(groupedData));
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, user, timeRange]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Progreso</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Progreso
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'records'
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Trophy className="w-5 h-5" />
              Récords
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <History className="w-5 h-5" />
              Historial
              {sessions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                  {sessions.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'progress' ? (
            <>
              <div className="flex items-center space-x-4 mb-6">
                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="day">Últimos 7 días</option>
                  <option value="week">Últimas 4 semanas</option>
                  <option value="month">Últimos 3 meses</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Progreso General
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF' }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={formatPercentage}
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            wrapperStyle={{ color: '#9CA3AF' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="M1"
                            name="Matemática 1"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="M2"
                            name="Matemática 2"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ fill: '#8B5CF6' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="L"
                            name="Lenguaje"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="C"
                            name="Ciencias"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{ fill: '#EF4444' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="H"
                            name="Historia"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ fill: '#F59E0B' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {Object.keys(stats).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">
                        Aún no tienes estadísticas. ¡Comienza a practicar para ver tu progreso!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(stats).map(subject => (
                        <AreaBreakdown
                          key={subject}
                          subject={subject}
                          stats={stats}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : activeTab === 'records' ? (
            <RecordsView records={records} loading={recordsLoading} />
          ) : (
            <SessionHistory sessions={sessions} loading={sessionsLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
