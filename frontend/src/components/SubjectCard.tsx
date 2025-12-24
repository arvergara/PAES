import React from 'react';
import { BookOpen, Brain, Calculator, FlaskRound as Flask, History, Microscope, Atom } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onSelect: (subject: Subject) => void;
}

const subjectConfig = {
  M1: {
    title: 'Matemática 1',
    description: 'Álgebra y funciones',
    icon: Calculator,
    intensity: 1, // más claro
    classicGradient: 'from-blue-400 to-blue-600',
    classicHover: 'hover:from-blue-500 hover:to-blue-700',
  },
  M2: {
    title: 'Matemática 2',
    description: 'Geometría y probabilidad',
    icon: Brain,
    intensity: 3,
    classicGradient: 'from-purple-400 to-indigo-600',
    classicHover: 'hover:from-purple-500 hover:to-indigo-700',
  },
  L: {
    title: 'Lenguaje',
    description: 'Comprensión lectora',
    icon: BookOpen,
    intensity: 5, // medio-oscuro
    classicGradient: 'from-rose-400 to-red-600',
    classicHover: 'hover:from-rose-500 hover:to-red-700',
  },
  C: {
    title: 'Ciencias',
    description: 'Biología, Química y Física',
    icon: Flask,
    intensity: 2,
    classicGradient: 'from-emerald-400 to-teal-600',
    classicHover: 'hover:from-emerald-500 hover:to-teal-700',
  },
  CB: {
    title: 'Biología',
    description: 'Ciencias de la vida',
    icon: Microscope,
    intensity: 2,
    classicGradient: 'from-green-400 to-emerald-600',
    classicHover: 'hover:from-green-500 hover:to-emerald-700',
  },
  CQ: {
    title: 'Química',
    description: 'Estructura y transformación de la materia',
    icon: Flask,
    intensity: 4,
    classicGradient: 'from-orange-400 to-amber-600',
    classicHover: 'hover:from-orange-500 hover:to-amber-700',
  },
  CF: {
    title: 'Física',
    description: 'Energía, movimiento y fuerzas',
    icon: Atom,
    intensity: 6,
    classicGradient: 'from-cyan-400 to-blue-600',
    classicHover: 'hover:from-cyan-500 hover:to-blue-700',
  },
  H: {
    title: 'Historia',
    description: 'Historia y ciencias sociales',
    icon: History,
    intensity: 7, // más oscuro
    classicGradient: 'from-amber-400 to-orange-600',
    classicHover: 'hover:from-amber-500 hover:to-orange-700',
  },
  ALL: {
    title: 'Todas las Materias',
    description: 'Práctica completa',
    icon: BookOpen,
    intensity: 4,
    classicGradient: 'from-gray-500 to-slate-700',
    classicHover: 'hover:from-gray-600 hover:to-slate-800',
  },
};

// Gradientes con mayor variación de intensidad (1=muy claro, 7=muy oscuro)
const themeGradients: Record<string, Record<number, { gradient: string; hover: string }>> = {
  indigo: {
    1: { gradient: 'from-indigo-300 to-indigo-400', hover: 'hover:from-indigo-400 hover:to-indigo-500' },
    2: { gradient: 'from-indigo-400 to-indigo-500', hover: 'hover:from-indigo-500 hover:to-indigo-600' },
    3: { gradient: 'from-indigo-500 to-indigo-600', hover: 'hover:from-indigo-600 hover:to-indigo-700' },
    4: { gradient: 'from-indigo-500 to-purple-600', hover: 'hover:from-indigo-600 hover:to-purple-700' },
    5: { gradient: 'from-indigo-600 to-purple-700', hover: 'hover:from-indigo-700 hover:to-purple-800' },
    6: { gradient: 'from-purple-600 to-indigo-700', hover: 'hover:from-purple-700 hover:to-indigo-800' },
    7: { gradient: 'from-indigo-700 to-purple-800', hover: 'hover:from-indigo-800 hover:to-purple-900' },
  },
  slate: {
    1: { gradient: 'from-slate-300 to-slate-400', hover: 'hover:from-slate-400 hover:to-slate-500' },
    2: { gradient: 'from-slate-400 to-slate-500', hover: 'hover:from-slate-500 hover:to-slate-600' },
    3: { gradient: 'from-slate-500 to-slate-600', hover: 'hover:from-slate-600 hover:to-slate-700' },
    4: { gradient: 'from-slate-500 to-gray-600', hover: 'hover:from-slate-600 hover:to-gray-700' },
    5: { gradient: 'from-slate-600 to-gray-700', hover: 'hover:from-slate-700 hover:to-gray-800' },
    6: { gradient: 'from-gray-600 to-slate-700', hover: 'hover:from-gray-700 hover:to-slate-800' },
    7: { gradient: 'from-slate-700 to-gray-800', hover: 'hover:from-slate-800 hover:to-gray-900' },
  },
  rose: {
    1: { gradient: 'from-rose-300 to-rose-400', hover: 'hover:from-rose-400 hover:to-rose-500' },
    2: { gradient: 'from-rose-400 to-rose-500', hover: 'hover:from-rose-500 hover:to-rose-600' },
    3: { gradient: 'from-rose-500 to-rose-600', hover: 'hover:from-rose-600 hover:to-rose-700' },
    4: { gradient: 'from-rose-500 to-pink-600', hover: 'hover:from-rose-600 hover:to-pink-700' },
    5: { gradient: 'from-rose-600 to-pink-700', hover: 'hover:from-rose-700 hover:to-pink-800' },
    6: { gradient: 'from-pink-600 to-rose-700', hover: 'hover:from-pink-700 hover:to-rose-800' },
    7: { gradient: 'from-rose-700 to-pink-800', hover: 'hover:from-rose-800 hover:to-pink-900' },
  },
  emerald: {
    1: { gradient: 'from-emerald-300 to-emerald-400', hover: 'hover:from-emerald-400 hover:to-emerald-500' },
    2: { gradient: 'from-emerald-400 to-emerald-500', hover: 'hover:from-emerald-500 hover:to-emerald-600' },
    3: { gradient: 'from-emerald-500 to-emerald-600', hover: 'hover:from-emerald-600 hover:to-emerald-700' },
    4: { gradient: 'from-emerald-500 to-teal-600', hover: 'hover:from-emerald-600 hover:to-teal-700' },
    5: { gradient: 'from-emerald-600 to-teal-700', hover: 'hover:from-emerald-700 hover:to-teal-800' },
    6: { gradient: 'from-teal-600 to-emerald-700', hover: 'hover:from-teal-700 hover:to-emerald-800' },
    7: { gradient: 'from-emerald-700 to-teal-800', hover: 'hover:from-emerald-800 hover:to-teal-900' },
  },
  amber: {
    1: { gradient: 'from-amber-300 to-amber-400', hover: 'hover:from-amber-400 hover:to-amber-500' },
    2: { gradient: 'from-amber-400 to-amber-500', hover: 'hover:from-amber-500 hover:to-amber-600' },
    3: { gradient: 'from-amber-500 to-amber-600', hover: 'hover:from-amber-600 hover:to-amber-700' },
    4: { gradient: 'from-amber-500 to-orange-600', hover: 'hover:from-amber-600 hover:to-orange-700' },
    5: { gradient: 'from-amber-600 to-orange-700', hover: 'hover:from-amber-700 hover:to-orange-800' },
    6: { gradient: 'from-orange-600 to-amber-700', hover: 'hover:from-orange-700 hover:to-amber-800' },
    7: { gradient: 'from-amber-700 to-orange-800', hover: 'hover:from-amber-800 hover:to-orange-900' },
  },
  purple: {
    1: { gradient: 'from-purple-300 to-purple-400', hover: 'hover:from-purple-400 hover:to-purple-500' },
    2: { gradient: 'from-purple-400 to-purple-500', hover: 'hover:from-purple-500 hover:to-purple-600' },
    3: { gradient: 'from-purple-500 to-purple-600', hover: 'hover:from-purple-600 hover:to-purple-700' },
    4: { gradient: 'from-purple-500 to-fuchsia-600', hover: 'hover:from-purple-600 hover:to-fuchsia-700' },
    5: { gradient: 'from-purple-600 to-fuchsia-700', hover: 'hover:from-purple-700 hover:to-fuchsia-800' },
    6: { gradient: 'from-fuchsia-600 to-purple-700', hover: 'hover:from-fuchsia-700 hover:to-purple-800' },
    7: { gradient: 'from-purple-700 to-fuchsia-800', hover: 'hover:from-purple-800 hover:to-fuchsia-900' },
  },
  ocean: {
    1: { gradient: 'from-cyan-300 to-cyan-400', hover: 'hover:from-cyan-400 hover:to-cyan-500' },
    2: { gradient: 'from-cyan-400 to-cyan-500', hover: 'hover:from-cyan-500 hover:to-cyan-600' },
    3: { gradient: 'from-cyan-500 to-cyan-600', hover: 'hover:from-cyan-600 hover:to-cyan-700' },
    4: { gradient: 'from-cyan-500 to-blue-600', hover: 'hover:from-cyan-600 hover:to-blue-700' },
    5: { gradient: 'from-cyan-600 to-blue-700', hover: 'hover:from-cyan-700 hover:to-blue-800' },
    6: { gradient: 'from-blue-600 to-cyan-700', hover: 'hover:from-blue-700 hover:to-cyan-800' },
    7: { gradient: 'from-cyan-700 to-blue-800', hover: 'hover:from-cyan-800 hover:to-blue-900' },
  },
};

export function SubjectCard({ subject, onSelect }: SubjectCardProps) {
  const { theme } = useTheme();
  const config = subjectConfig[subject];
  const Icon = config.icon;
  
  // Si es tema clásico, usar colores originales por materia
  let gradient: string;
  let hover: string;
  
  if (theme === 'classic') {
    gradient = config.classicGradient;
    hover = config.classicHover;
  } else {
    const themeStyles = themeGradients[theme] || themeGradients.indigo;
    const intensityStyles = themeStyles[config.intensity] || themeStyles[4];
    gradient = intensityStyles.gradient;
    hover = intensityStyles.hover;
  }

  return (
    <button
      onClick={() => onSelect(subject)}
      className={`
        bg-gradient-to-br ${gradient} ${hover}
        text-white p-10 rounded-3xl mb-2 
        shadow-md hover:shadow-lg
        hover:scale-105 transition-all duration-300 w-full group
      `}
    >
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-white/30 rounded-xl group-hover:bg-white/40 transition-colors">
          <Icon className="h-12 w-12" />
        </div>
        <div className="text-left">
          <h3 className="text-3xl font-bold">{config.title}</h3>
          <p className="text-sm text-white/90">{config.description}</p>
        </div>
      </div>
    </button>
  );
}
