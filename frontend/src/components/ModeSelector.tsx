import React from 'react';
import { Clock, BookOpen, Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { PracticeMode } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: PracticeMode) => void;
}

const modes = [
  {
    id: 'PAES' as PracticeMode,
    title: 'Modo PAES',
    description: 'Simula la prueba real con tiempo límite',
    icon: Clock,
    intensity: 1, // más claro
    classicGradient: 'from-orange-400 to-rose-500',
    classicHover: 'hover:from-orange-500 hover:to-rose-600',
  },
  {
    id: 'TEST' as PracticeMode,
    title: 'Modo Test',
    description: 'Práctica rápida con retroalimentación inmediata',
    icon: BookOpen,
    intensity: 4, // medio
    classicGradient: 'from-emerald-400 to-green-500',
    classicHover: 'hover:from-emerald-500 hover:to-green-600',
  },
  {
    id: 'REVIEW' as PracticeMode,
    title: 'Modo Repaso',
    description: 'Refuerza tus conocimientos en áreas específicas',
    icon: Brain,
    intensity: 7, // más oscuro
    classicGradient: 'from-purple-400 to-indigo-500',
    classicHover: 'hover:from-purple-500 hover:to-indigo-600',
  },
];

// Gradientes con mayor variación (1=muy claro, 7=muy oscuro)
const themeGradients: Record<string, Record<number, { gradient: string; hover: string }>> = {
  indigo: {
    1: { gradient: 'from-indigo-300 to-purple-400', hover: 'hover:from-indigo-400 hover:to-purple-500' },
    4: { gradient: 'from-indigo-500 to-purple-600', hover: 'hover:from-indigo-600 hover:to-purple-700' },
    7: { gradient: 'from-indigo-700 to-purple-800', hover: 'hover:from-indigo-800 hover:to-purple-900' },
  },
  slate: {
    1: { gradient: 'from-slate-300 to-gray-400', hover: 'hover:from-slate-400 hover:to-gray-500' },
    4: { gradient: 'from-slate-500 to-gray-600', hover: 'hover:from-slate-600 hover:to-gray-700' },
    7: { gradient: 'from-slate-700 to-gray-800', hover: 'hover:from-slate-800 hover:to-gray-900' },
  },
  rose: {
    1: { gradient: 'from-rose-300 to-pink-400', hover: 'hover:from-rose-400 hover:to-pink-500' },
    4: { gradient: 'from-rose-500 to-pink-600', hover: 'hover:from-rose-600 hover:to-pink-700' },
    7: { gradient: 'from-rose-700 to-pink-800', hover: 'hover:from-rose-800 hover:to-pink-900' },
  },
  emerald: {
    1: { gradient: 'from-emerald-300 to-teal-400', hover: 'hover:from-emerald-400 hover:to-teal-500' },
    4: { gradient: 'from-emerald-500 to-teal-600', hover: 'hover:from-emerald-600 hover:to-teal-700' },
    7: { gradient: 'from-emerald-700 to-teal-800', hover: 'hover:from-emerald-800 hover:to-teal-900' },
  },
  amber: {
    1: { gradient: 'from-amber-300 to-orange-400', hover: 'hover:from-amber-400 hover:to-orange-500' },
    4: { gradient: 'from-amber-500 to-orange-600', hover: 'hover:from-amber-600 hover:to-orange-700' },
    7: { gradient: 'from-amber-700 to-orange-800', hover: 'hover:from-amber-800 hover:to-orange-900' },
  },
  purple: {
    1: { gradient: 'from-purple-300 to-fuchsia-400', hover: 'hover:from-purple-400 hover:to-fuchsia-500' },
    4: { gradient: 'from-purple-500 to-fuchsia-600', hover: 'hover:from-purple-600 hover:to-fuchsia-700' },
    7: { gradient: 'from-purple-700 to-fuchsia-800', hover: 'hover:from-purple-800 hover:to-fuchsia-900' },
  },
  ocean: {
    1: { gradient: 'from-cyan-300 to-blue-400', hover: 'hover:from-cyan-400 hover:to-blue-500' },
    4: { gradient: 'from-cyan-500 to-blue-600', hover: 'hover:from-cyan-600 hover:to-blue-700' },
    7: { gradient: 'from-cyan-700 to-blue-800', hover: 'hover:from-cyan-800 hover:to-blue-900' },
  },
};

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {modes.map((mode) => {
        const Icon = mode.icon;
        
        // Si es tema clásico, usar colores originales
        let gradient: string;
        let hover: string;
        
        if (theme === 'classic') {
          gradient = mode.classicGradient;
          hover = mode.classicHover;
        } else {
          const themeStyles = themeGradients[theme] || themeGradients.indigo;
          const intensityStyles = themeStyles[mode.intensity] || themeStyles[4];
          gradient = intensityStyles.gradient;
          hover = intensityStyles.hover;
        }
        
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`
              bg-gradient-to-br ${gradient} ${hover}
              text-white p-8 rounded-2xl 
              shadow-md hover:shadow-lg
              hover:scale-105 transition-all duration-300 group
            `}
          >
            <div className="p-4 bg-white/30 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-white/40 transition-colors">
              <Icon className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
            <p className="text-sm text-white/90">{mode.description}</p>
          </button>
        );
      })}
    </div>
  );
}
