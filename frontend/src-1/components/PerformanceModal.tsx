import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
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

const subjectNames = {
  M1: 'Matemática 1',
  M2: 'Matemática 2',
  L: 'Lenguaje',
  C: 'Ciencias',
  H: 'Historia',
  ALL: 'Todas las Materias'
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
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
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {subjectNames[subject as keyof typeof subjectNames]}
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
          <div key={area} className="border-b border-gray-100 last:border-0 pb-4">
            <button
              onClick={() => toggleArea(area)}
              className="w-full flex items-center justify-between text-left py-2"
            >
              <span className="font-medium text-gray-700">{area}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {areaData.correct}/{areaData.total} correctas
                </span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 rounded-full h-2"
                    style={{
                      width: `${areaData.total > 0 ? (areaData.correct / areaData.total) * 100 : 0}%`
                    }}
                  />
                </div>
                {expandedAreas[area] ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>

            {expandedAreas[area] && (
              <div className="pl-4 mt-2 space-y-3">
                {Object.entries(areaData.temas).map(([tema, temaData]) => (
                  <div key={tema}>
                    <button
                      onClick={() => toggleTema(`${area}-${tema}`)}
                      className="w-full flex items-center justify-between text-left py-1"
                    >
                      <span className="text-sm text-gray-600">{tema}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          {temaData.correct}/{temaData.total}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-400 rounded-full h-1.5"
                            style={{
                              width: `${temaData.total > 0 ? (temaData.correct / temaData.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                        {expandedTemas[`${area}-${tema}`] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {expandedTemas[`${area}-${tema}`] && (
                      <div className="pl-4 mt-1 space-y-2">
                        {Object.entries(temaData.subtemas).map(([subtema, subtemaData]) => (
                          <div key={subtema} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{subtema}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-400">
                                {subtemaData.correct}/{subtemaData.total}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-indigo-300 rounded-full h-1"
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

export function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [stats, setStats] = useState<SubjectStats>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch question attempts
        const { data: attempts, error } = await supabase
          .from('question_attempts')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Process attempts into stats
        const subjectStats: SubjectStats = {};
        attempts?.forEach((attempt) => {
          // Initialize subject stats if not exists
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
            // Initialize area stats if not exists
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
              // Initialize tema stats if not exists
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
                // Initialize subtema stats if not exists
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

        // Process attempts into chart data
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Mi Progreso</h2>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <Calendar className="h-5 w-5 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="border rounded-md px-3 py-1.5 text-gray-700"
            >
              <option value="day">Últimos 7 días</option>
              <option value="week">Últimas 4 semanas</option>
              <option value="month">Últimos 3 meses</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando estadísticas...</div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Progreso General
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={formatPercentage}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="M1"
                        name="Matemática 1"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="M2"
                        name="Matemática 2"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="L"
                        name="Lenguaje"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="C"
                        name="Ciencias"
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="H"
                        name="Historia"
                        stroke="#F59E0B"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(stats).map(subject => (
                  <AreaBreakdown
                    key={subject}
                    subject={subject}
                    stats={stats}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}