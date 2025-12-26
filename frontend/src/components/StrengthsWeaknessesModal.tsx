import React, { useState } from 'react';
import { 
  X, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle, 
  Brain, Zap, BookOpen, ChevronRight, Play, ArrowRight, BarChart3
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

interface TopicStats {
  name: string;
  subject: string;
  total: number;
  correct: number;
  percentage: number;
  trend?: number;
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

interface StrengthsWeaknessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'strengths' | 'weaknesses';
  data: TopicStats[];
  subjectDiagnostics: SubjectDiagnostic[];
  onStartPractice?: (subject: string, topic?: string) => void;
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

const subjectColors: Record<string, string> = {
  M1: '#3B82F6',
  M2: '#8B5CF6',
  L: '#10B981',
  C: '#EF4444',
  CB: '#22C55E',
  CF: '#06B6D4',
  CQ: '#EC4899',
  H: '#F59E0B',
};

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#22C55E'];

export function StrengthsWeaknessesModal({ 
  isOpen, 
  onClose, 
  type, 
  data, 
  subjectDiagnostics,
  onStartPractice 
}: StrengthsWeaknessesModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bySubject' | 'plan'>('overview');
  
  if (!isOpen) return null;

  const isStrengths = type === 'strengths';
  const title = isStrengths ? 'Análisis de Fortalezas' : 'Plan de Mejora';
  const themeColor = isStrengths ? 'emerald' : 'red';
  const Icon = isStrengths ? CheckCircle : AlertTriangle;

  // Preparar datos para gráfico de barras por materia
  const radarData = subjectDiagnostics.map(subj => ({
    subjectKey: subj.subject,  // Clave original para colores (M1, M2, L, etc.)
    subject: subjectNames[subj.subject]?.slice(0, 3) || subj.subject,
    fullName: subjectNames[subj.subject] || subj.subject,
    percentage: subj.percentage,
    total: subj.total
  }));

  // Preparar datos para gráfico de barras por área
  const barData = data.slice(0, 10).map(topic => ({
    name: topic.name.length > 15 ? topic.name.slice(0, 15) + '...' : topic.name,
    fullName: topic.name,
    percentage: topic.percentage,
    subject: subjectNames[topic.subject] || topic.subject,
    subjectKey: topic.subject,
    correct: topic.correct,
    total: topic.total
  }));

  // Agrupar datos por materia
  const dataBySubject: Record<string, TopicStats[]> = {};
  data.forEach(topic => {
    if (!dataBySubject[topic.subject]) {
      dataBySubject[topic.subject] = [];
    }
    dataBySubject[topic.subject].push(topic);
  });

  // Calcular distribución por materia para pie chart
  const pieData = Object.entries(dataBySubject).map(([subject, topics]) => ({
    name: subjectNames[subject] || subject,
    value: topics.length,
    subject
  }));

  // Plan de estudio sugerido (solo para debilidades)
  const studyPlan = !isStrengths ? data.map(topic => ({
    ...topic,
    suggestedQuestions: Math.max(10, Math.round((100 - topic.percentage) / 3)),
    priority: topic.percentage < 30 ? 'Alta' : topic.percentage < 50 ? 'Media' : 'Baja',
    estimatedTime: Math.round(Math.max(10, Math.round((100 - topic.percentage) / 3)) * 1.5)
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.fullName || label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.subject}</p>
          <p className={`font-bold ${isStrengths ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.percentage?.toFixed(1)}%
          </p>
          {data.correct !== undefined && (
            <p className="text-xs text-gray-500">{data.correct}/{data.total} correctas</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl relative my-8 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${isStrengths ? 'from-emerald-500 to-green-600' : 'from-red-500 to-orange-600'} p-6 text-white`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-white/80 mt-1">
                {isStrengths 
                  ? `${data.length} áreas donde destacas`
                  : `${data.length} áreas que necesitan práctica`
                }
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Visualización
            </button>
            <button
              onClick={() => setActiveTab('bySubject')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'bySubject' 
                  ? 'bg-white text-gray-900' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Por Materia
            </button>
            {!isStrengths && (
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'plan' 
                    ? 'bg-white text-gray-900' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Plan de Estudio
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Gráficos principales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart - Rendimiento por Materia */}
                <div className="bg-slate-900 rounded-xl p-5 border border-gray-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Rendimiento por Materia
                  </h3>
                  {radarData.length > 0 ? (
                    <>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid 
                              stroke="#4b5563" 
                              gridType="polygon"
                            />
                            <PolarAngleAxis 
                              dataKey="fullName" 
                              tick={{ fill: '#e5e7eb', fontSize: 10, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 100]} 
                              tick={{ fill: '#9ca3af', fontSize: 9 }}
                              tickCount={5}
                              axisLine={false}
                            />
                            <Radar
                              name="Rendimiento"
                              dataKey="percentage"
                              stroke={isStrengths ? '#10b981' : '#ef4444'}
                              strokeWidth={3}
                              fill={isStrengths ? '#10b981' : '#ef4444'}
                              fillOpacity={0.5}
                              dot={{ 
                                r: 6, 
                                fill: isStrengths ? '#34d399' : '#f87171',
                                stroke: '#ffffff',
                                strokeWidth: 2
                              }}
                            />
                            <Tooltip 
                              content={<CustomTooltip />}
                              wrapperStyle={{ zIndex: 100 }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Leyenda con colores por materia */}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {radarData.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2"
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subjectColors[item.subjectKey] || COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-xs text-gray-300 flex-1 truncate">{item.fullName}</span>
                            <span className={`text-xs font-bold ${item.percentage >= 60 ? 'text-emerald-400' : item.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {item.percentage.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-400">
                      No hay datos suficientes
                    </div>
                  )}
                </div>

                {/* Pie Chart - Distribución por Materia */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Distribución por Materia
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={entry.subject} 
                              fill={subjectColors[entry.subject] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bar Chart - Top Áreas */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  {isStrengths ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Top Áreas Dominadas
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      Áreas que Requieren Atención
                    </>
                  )}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={barData} 
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]} 
                        tick={{ fill: '#9CA3AF' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="percentage" 
                        radius={[0, 4, 4, 0]}
                      >
                        {barData.map((entry, index) => (
                          <Cell 
                            key={index} 
                            fill={subjectColors[entry.subjectKey] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 ${isStrengths ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className={`text-3xl font-bold ${isStrengths ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {data.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isStrengths ? 'Áreas fuertes' : 'Áreas a mejorar'}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Object.keys(dataBySubject).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Materias involucradas</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {data.length > 0 ? (data.reduce((sum, t) => sum + t.percentage, 0) / data.length).toFixed(0) : 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Promedio</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {data.reduce((sum, t) => sum + t.total, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Preguntas totales</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bySubject' && (
            <div className="space-y-6">
              {Object.entries(dataBySubject).map(([subject, topics]) => {
                const subjectInfo = subjectDiagnostics.find(s => s.subject === subject);
                return (
                  <div 
                    key={subject}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Header de materia */}
                    <div 
                      className="p-4 flex items-center justify-between"
                      style={{ borderLeft: `4px solid ${subjectColors[subject] || '#6B7280'}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: subjectColors[subject] || '#6B7280' }}
                        >
                          {subject}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            {subjectNames[subject] || subject}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {topics.length} área{topics.length !== 1 ? 's' : ''} • 
                            Promedio: {(topics.reduce((sum, t) => sum + t.percentage, 0) / topics.length).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {subjectInfo && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isStrengths ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {subjectInfo.percentage.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">rendimiento general</div>
                        </div>
                      )}
                    </div>

                    {/* Lista de áreas */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {topics.map((topic, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              isStrengths ? 'bg-emerald-500' : 'bg-red-500'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{topic.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {topic.correct}/{topic.total} correctas
                                {topic.trend !== undefined && (
                                  <span className={`ml-2 ${topic.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {topic.trend >= 0 ? '↑' : '↓'} {Math.abs(topic.trend).toFixed(0)}%
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{topic.percentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${isStrengths ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${topic.percentage}%` }}
                                />
                              </div>
                            </div>
                            {!isStrengths && onStartPractice && (
                              <button
                                onClick={() => onStartPractice(subject, topic.name)}
                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Practicar este tema"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'plan' && !isStrengths && (
            <div className="space-y-6">
              {/* Resumen del plan */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Tu Plan de Estudio Personalizado
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {studyPlan.reduce((sum, t) => sum + t.suggestedQuestions, 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">preguntas sugeridas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(studyPlan.reduce((sum, t) => sum + t.estimatedTime, 0) / 60)}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">tiempo estimado</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {studyPlan.filter(t => t.priority === 'Alta').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">prioridad alta</div>
                  </div>
                </div>
              </div>

              {/* Lista de temas a practicar */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Orden de Prioridad</h3>
                
                {studyPlan.map((topic, i) => (
                  <div 
                    key={i}
                    className={`rounded-xl p-4 border-2 ${
                      topic.priority === 'Alta' 
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                        : topic.priority === 'Media'
                        ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          topic.priority === 'Alta' ? 'bg-red-500' :
                          topic.priority === 'Media' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">{topic.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              topic.priority === 'Alta' 
                                ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                : topic.priority === 'Media'
                                ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                                : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              Prioridad {topic.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {subjectNames[topic.subject] || topic.subject} • 
                            Rendimiento actual: <strong>{topic.percentage.toFixed(0)}%</strong>
                          </p>
                          
                          <div className="mt-3 flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                <strong>{topic.suggestedQuestions}</strong> preguntas
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-purple-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                ~<strong>{topic.estimatedTime}</strong> min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {onStartPractice && (
                        <button
                          onClick={() => onStartPractice(topic.subject, topic.name)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            topic.priority === 'Alta'
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : topic.priority === 'Media'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          Practicar
                        </button>
                      )}
                    </div>

                    {/* Barra de progreso hacia meta */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Actual: {topic.percentage.toFixed(0)}%</span>
                        <span>Meta: 70%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative">
                        <div 
                          className={`h-3 rounded-full ${
                            topic.priority === 'Alta' ? 'bg-red-500' :
                            topic.priority === 'Media' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${topic.percentage}%` }}
                        />
                        <div 
                          className="absolute top-0 w-0.5 h-3 bg-emerald-500"
                          style={{ left: '70%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Necesitas mejorar {(70 - topic.percentage).toFixed(0)}% para alcanzar la meta
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Consejos */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">💡 Consejos para mejorar</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Comienza con los temas de <strong>prioridad alta</strong> - tienen mayor impacto en tu puntaje</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Practica en sesiones cortas de <strong>15-20 minutos</strong> para mejor retención</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Revisa tus errores después de cada sesión para entender el <strong>por qué</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Alterna entre materias para <strong>evitar fatiga mental</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
