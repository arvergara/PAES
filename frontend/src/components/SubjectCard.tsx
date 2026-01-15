import { useEffect, useState } from 'react';
import { BookOpen, Calculator, Clock, FlaskConical, Languages } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onSelect: (subject: Subject) => void;
}

const subjectConfig: Record<Subject, {
  name: string;
  description: string;
  icon: typeof Calculator;
  bgColor: string;
  bgHover: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  progressBg: string;
  progressBar: string;
  textColor: string;
  descColor: string;
}> = {
  M1: {
    name: 'Matemática 1',
    description: 'Álgebra y funciones',
    icon: Calculator,
    bgColor: 'bg-blue-100 dark:bg-blue-600/30',
    bgHover: 'hover:bg-blue-200 dark:hover:bg-blue-600/40',
    borderColor: 'border-blue-300 dark:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-400/70',
    iconBg: 'bg-blue-200 dark:bg-blue-500/40',
    iconColor: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-200/80 dark:bg-blue-500/40',
    badgeText: 'text-blue-800 dark:text-blue-200',
    progressBg: 'bg-blue-200 dark:bg-blue-500/30',
    progressBar: 'bg-blue-600 dark:bg-blue-400',
    textColor: 'text-blue-900 dark:text-blue-100',
    descColor: 'text-blue-700 dark:text-blue-300',
  },
  M2: {
    name: 'Matemática 2',
    description: 'Geometría y probabilidad',
    icon: Calculator,
    bgColor: 'bg-violet-100 dark:bg-violet-600/30',
    bgHover: 'hover:bg-violet-200 dark:hover:bg-violet-600/40',
    borderColor: 'border-violet-300 dark:border-violet-500/50 hover:border-violet-400 dark:hover:border-violet-400/70',
    iconBg: 'bg-violet-200 dark:bg-violet-500/40',
    iconColor: 'text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-200/80 dark:bg-violet-500/40',
    badgeText: 'text-violet-800 dark:text-violet-200',
    progressBg: 'bg-violet-200 dark:bg-violet-500/30',
    progressBar: 'bg-violet-600 dark:bg-violet-400',
    textColor: 'text-violet-900 dark:text-violet-100',
    descColor: 'text-violet-700 dark:text-violet-300',
  },
  L: {
    name: 'Lenguaje',
    description: 'Comprensión lectora',
    icon: Languages,
    bgColor: 'bg-rose-100 dark:bg-rose-600/30',
    bgHover: 'hover:bg-rose-200 dark:hover:bg-rose-600/40',
    borderColor: 'border-rose-300 dark:border-rose-500/50 hover:border-rose-400 dark:hover:border-rose-400/70',
    iconBg: 'bg-rose-200 dark:bg-rose-500/40',
    iconColor: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-200/80 dark:bg-rose-500/40',
    badgeText: 'text-rose-800 dark:text-rose-200',
    progressBg: 'bg-rose-200 dark:bg-rose-500/30',
    progressBar: 'bg-rose-600 dark:bg-rose-400',
    textColor: 'text-rose-900 dark:text-rose-100',
    descColor: 'text-rose-700 dark:text-rose-300',
  },
  C: {
    name: 'Ciencias',
    description: 'Biología, Química y Física',
    icon: FlaskConical,
    bgColor: 'bg-emerald-100 dark:bg-emerald-600/30',
    bgHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-600/40',
    borderColor: 'border-emerald-300 dark:border-emerald-500/50 hover:border-emerald-400 dark:hover:border-emerald-400/70',
    iconBg: 'bg-emerald-200 dark:bg-emerald-500/40',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-200/80 dark:bg-emerald-500/40',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    progressBg: 'bg-emerald-200 dark:bg-emerald-500/30',
    progressBar: 'bg-emerald-600 dark:bg-emerald-400',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    descColor: 'text-emerald-700 dark:text-emerald-300',
  },
  H: {
    name: 'Historia',
    description: 'Historia y ciencias sociales',
    icon: Clock,
    bgColor: 'bg-amber-100 dark:bg-amber-600/30',
    bgHover: 'hover:bg-amber-200 dark:hover:bg-amber-600/40',
    borderColor: 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400 dark:hover:border-amber-400/70',
    iconBg: 'bg-amber-200 dark:bg-amber-500/40',
    iconColor: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-200/80 dark:bg-amber-500/40',
    badgeText: 'text-amber-800 dark:text-amber-200',
    progressBg: 'bg-amber-200 dark:bg-amber-500/30',
    progressBar: 'bg-amber-600 dark:bg-amber-400',
    textColor: 'text-amber-900 dark:text-amber-100',
    descColor: 'text-amber-700 dark:text-amber-300',
  },
};

export function SubjectCard({ subject, onSelect }: SubjectCardProps) {
  const { user } = useAuth();
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const config = subjectConfig[subject];
  const Icon = config.icon;

  useEffect(() => {
    const fetchQuestionCount = async () => {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (subject === 'C') {
        query = query.in('subject', ['C', 'CF', 'CQ', 'CB']);
      } else {
        query = query.eq('subject', subject);
      }

      const { count } = await query;
      setQuestionCount(count || 0);
    };

    const fetchAccuracy = async () => {
      if (!user) return;

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
        setAccuracy(null);
        return;
      }

      const correctCount = data.filter(a => a.is_correct).length;
      const totalCount = data.length;
      setAccuracy(Math.round((correctCount / totalCount) * 100));
    };

    fetchQuestionCount();
    fetchAccuracy();
  }, [subject, user]);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return 'text-emerald-700 dark:text-emerald-300';
    if (acc >= 50) return 'text-amber-700 dark:text-amber-300';
    return 'text-rose-700 dark:text-rose-300';
  };

  return (
    <button
      onClick={() => onSelect(subject)}
      className={`group relative text-left ${config.bgColor} ${config.bgHover} rounded-2xl border ${config.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 p-6`}
    >
      {/* Question count badge */}
      {questionCount !== null && (
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 ${config.badgeBg} ${config.badgeText} text-xs font-semibold rounded-full`}>
            {questionCount} preguntas
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`inline-flex p-3 ${config.iconBg} rounded-xl mb-4`}>
        <Icon className={`w-6 h-6 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
        {config.name}
      </h3>
      <p className={`text-sm ${config.descColor} mb-4`}>
        {config.description}
      </p>

      {/* Accuracy */}
      {accuracy !== null && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${getAccuracyColor(accuracy)}`}>
              ✓ {accuracy}% precisión
            </span>
          </div>
          <div className={`h-2 ${config.progressBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${config.progressBar} rounded-full transition-all duration-500`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}