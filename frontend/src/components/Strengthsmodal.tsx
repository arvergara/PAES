import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Target, ArrowRight, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Subject } from '../types';

interface StrengthsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSubject: (subject: Subject) => void;
}

interface SubjectStats {
  subject: Subject;
  name: string;
  accuracy: number | null;
  totalAttempts: number;
  correctAttempts: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const subjectInfo: Record<Subject, { name: string; color: string; bgColor: string; borderColor: string }> = {
  M1: { name: 'Matemática 1', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-500/20', borderColor: 'border-blue-300 dark:border-blue-500/50' },
  M2: { name: 'Matemática 2', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-500/20', borderColor: 'border-violet-300 dark:border-violet-500/50' },
  L: { name: 'Lenguaje', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-500/20', borderColor: 'border-rose-300 dark:border-rose-500/50' },
  C: { name: 'Ciencias', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', borderColor: 'border-emerald-300 dark:border-emerald-500/50' },
  H: { name: 'Historia', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-500/20', borderColor: 'border-amber-300 dark:border-amber-500/50' },
};

const subjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H'];

export function StrengthsModal({ isOpen, onClose, onSelectSubject }: StrengthsModalProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchStats = async () => {
      setLoading(true);
      const statsData: SubjectStats[] = [];

      for (const subject of subjects) {
        const info = subjectInfo[subject];
        
        let query = supabase
          .from('question_attempts')
          .select('is_correct')
          .eq('user_id', user.id);

        if (subject === 'C') {
          query = query.in('subject', ['C', 'CF', 'CQ', 'CB']);
        } else {
          query = query.eq('subject', subject);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          statsData.push({
            subject,
            name: info.name,
            accuracy: null,
            totalAttempts: 0,
            correctAttempts: 0,
            color: info.color,
            bgColor: info.bgColor,
            borderColor: info.borderColor,
          });
        } else {
          const correctCount = data.filter(a => a.is_correct).length;
          const totalCount = data.length;
          statsData.push({
            subject,
            name: info.name,
            accuracy: Math.round((correctCount / totalCount) * 100),
            totalAttempts: totalCount,
            correctAttempts: correctCount,
            color: info.color,
            bgColor: info.bgColor,
            borderColor: info.borderColor,
          });
        }
      }

      // Ordenar: primero las que tienen datos (por accuracy ascendente), luego las sin datos
      statsData.sort((a, b) => {
        if (a.accuracy === null && b.accuracy === null) return 0;
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy;
      });

      setStats(statsData);
      setLoading(false);
    };

    fetchStats();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getStatusIcon = (accuracy: number | null) => {
    if (accuracy === null) return <Minus className="w-5 h-5 text-gray-400" />;
    if (accuracy < 50) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    if (accuracy < 70) return <TrendingUp className="w-5 h-5 text-amber-500" />;
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  };

  const getStatusText = (accuracy: number | null) => {
    if (accuracy === null) return 'Sin datos';
    if (accuracy < 50) return 'Necesita refuerzo';
    if (accuracy < 70) return 'En progreso';
    return 'Buen nivel';
  };

  const getStatusColor = (accuracy: number | null) => {
    if (accuracy === null) return 'text-gray-500 dark:text-gray-400';
    if (accuracy < 50) return 'text-rose-600 dark:text-rose-400';
    if (accuracy < 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const weakestSubjects = stats.filter(s => s.accuracy !== null && s.accuracy < 70);
  const noDataSubjects = stats.filter(s => s.accuracy === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl">
                <Target className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Análisis de rendimiento</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">¿Qué materias debo reforzar?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Recomendación principal */}
              {weakestSubjects.length > 0 && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-200">
                        Te recomendamos practicar más:
                      </p>
                      <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                        {weakestSubjects.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {noDataSubjects.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Minus className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-200">
                        Materias sin practicar:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {noDataSubjects.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de materias */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Todas las materias
                </h3>
                {stats.map((stat) => (
                  <button
                    key={stat.subject}
                    onClick={() => {
                      onSelectSubject(stat.subject);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-4 ${stat.bgColor} border ${stat.borderColor} rounded-xl hover:shadow-md transition-all duration-200 group`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(stat.accuracy)}
                      <div className="text-left">
                        <p className={`font-semibold ${stat.color}`}>{stat.name}</p>
                        <p className={`text-sm ${getStatusColor(stat.accuracy)}`}>
                          {getStatusText(stat.accuracy)}
                          {stat.totalAttempts > 0 && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              · {stat.totalAttempts} intentos
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {stat.accuracy !== null && (
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${stat.color}`}>{stat.accuracy}%</p>
                        </div>
                      )}
                      <ArrowRight className={`w-5 h-5 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Haz clic en una materia para comenzar a practicar
          </p>
        </div>
      </div>
    </div>
  );
}