import { Clock, BookOpen, Brain, Star, CheckCircle } from 'lucide-react';
import type { PracticeMode } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: PracticeMode) => void;
}

const modes = [
  {
    id: 'PAES' as PracticeMode,
    name: 'Modo PAES',
    description: 'Simula la prueba real con tiempo límite y condiciones de examen',
    icon: Clock,
    time: '65 min',
    questions: '65 preguntas',
    badge: 'POPULAR',
    badgeColor: 'bg-amber-200/80 text-amber-800 dark:bg-amber-500/40 dark:text-amber-200',
    bgColor: 'bg-amber-100 dark:bg-amber-600/30',
    bgHover: 'hover:bg-amber-200 dark:hover:bg-amber-600/40',
    borderColor: 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400 dark:hover:border-amber-400/70',
    iconBg: 'bg-amber-200 dark:bg-amber-500/40',
    iconColor: 'text-amber-700 dark:text-amber-300',
    textColor: 'text-amber-900 dark:text-amber-100',
    descColor: 'text-amber-700 dark:text-amber-300',
    statColor: 'text-amber-600 dark:text-amber-400',
    dividerColor: 'border-amber-200 dark:border-amber-500/30',
  },
  {
    id: 'TEST' as PracticeMode,
    name: 'Modo Test',
    description: 'Práctica rápida con retroalimentación inmediata después de cada pregunta',
    icon: BookOpen,
    time: '~15 min',
    questions: '10 preguntas',
    badge: 'RECOMENDADO',
    badgeColor: 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-500/40 dark:text-emerald-200',
    bgColor: 'bg-emerald-100 dark:bg-emerald-600/30',
    bgHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-600/40',
    borderColor: 'border-emerald-300 dark:border-emerald-500/50 hover:border-emerald-400 dark:hover:border-emerald-400/70',
    iconBg: 'bg-emerald-200 dark:bg-emerald-500/40',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    descColor: 'text-emerald-700 dark:text-emerald-300',
    statColor: 'text-emerald-600 dark:text-emerald-400',
    dividerColor: 'border-emerald-200 dark:border-emerald-500/30',
  },
  {
    id: 'REVIEW' as PracticeMode,
    name: 'Modo Repaso',
    description: 'Refuerza áreas específicas sin presión de tiempo',
    icon: Brain,
    time: 'Sin límite',
    questions: '20 preguntas',
    badge: null,
    badgeColor: '',
    bgColor: 'bg-violet-100 dark:bg-violet-600/30',
    bgHover: 'hover:bg-violet-200 dark:hover:bg-violet-600/40',
    borderColor: 'border-violet-300 dark:border-violet-500/50 hover:border-violet-400 dark:hover:border-violet-400/70',
    iconBg: 'bg-violet-200 dark:bg-violet-500/40',
    iconColor: 'text-violet-700 dark:text-violet-300',
    textColor: 'text-violet-900 dark:text-violet-100',
    descColor: 'text-violet-700 dark:text-violet-300',
    statColor: 'text-violet-600 dark:text-violet-400',
    dividerColor: 'border-violet-200 dark:border-violet-500/30',
  },
];

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`group relative text-left ${mode.bgColor} ${mode.bgHover} rounded-2xl border ${mode.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 p-6`}
          >
            {/* Badge */}
            {mode.badge && (
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${mode.badgeColor}`}>
                  {mode.badge === 'POPULAR' ? <Star className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {mode.badge}
                </span>
              </div>
            )}

            {/* Icon */}
            <div className={`inline-flex p-4 ${mode.iconBg} rounded-2xl mb-4`}>
              <Icon className={`w-8 h-8 ${mode.iconColor}`} />
            </div>

            {/* Content */}
            <h3 className={`text-lg font-bold ${mode.textColor} mb-2`}>
              {mode.name}
            </h3>
            <p className={`text-sm ${mode.descColor} mb-4 min-h-[40px]`}>
              {mode.description}
            </p>

            {/* Stats */}
            <div className={`flex items-center gap-4 pt-4 border-t ${mode.dividerColor}`}>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${mode.statColor}`}>
                <Clock className="w-4 h-4" />
                <span>{mode.time}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${mode.statColor}`}>
                <CheckCircle className="w-4 h-4" />
                <span>{mode.questions}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}