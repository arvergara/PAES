import React from 'react';
import { Clock, BookOpen, Brain } from 'lucide-react';
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
    color: 'bg-orange-500',
  },
  {
    id: 'TEST' as PracticeMode,
    title: 'Modo Test',
    description: 'Práctica rápida con retroalimentación inmediata',
    icon: BookOpen,
    color: 'bg-emerald-500',
  },
  {
    id: 'REVIEW' as PracticeMode,
    title: 'Modo Repaso',
    description: 'Refuerza tus conocimientos en áreas específicas',
    icon: Brain,
    color: 'bg-purple-500',
  },
];

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`${mode.color} text-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200`}
          >
            <Icon className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
            <p className="text-sm opacity-90">{mode.description}</p>
          </button>
        );
      })}
    </div>
  );
}