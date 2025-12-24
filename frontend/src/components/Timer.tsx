import React, { useState, useEffect } from 'react';
import { Clock, Infinity } from 'lucide-react';

interface TimerProps {
  totalMinutes: number;
  onTimeUp: () => void;
  resetKey?: number | string;
  onTick?: (timeLeft: number) => void;
}

export function Timer({ totalMinutes, onTimeUp, resetKey, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalMinutes * 60);

  useEffect(() => {
    setTimeLeft(totalMinutes * 60);
  }, [totalMinutes, resetKey]);

  useEffect(() => {
    // Si es 0, significa sin límite
    if (totalMinutes === 0) return;
    
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    // Reportar el tiempo restante si hay callback
    if (onTick) {
      onTick(timeLeft);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, totalMinutes, onTick]);

  // Sin límite de tiempo
  if (totalMinutes === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <Infinity className="h-5 w-5" />
        <span className="font-medium">Sin límite</span>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 30;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md border ${
      isLow 
        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' 
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }`}>
      <Clock className={`h-5 w-5 ${isLow ? 'animate-pulse' : ''}`} />
      <span className="font-mono font-medium text-lg">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

// Componente simple para mostrar tiempo (sin lógica de conteo)
interface TimeDisplayProps {
  timeLeft: number;
}

export function TimeDisplay({ timeLeft }: TimeDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 30;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md border ${
      isLow 
        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' 
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }`}>
      <Clock className={`h-5 w-5 ${isLow ? 'animate-pulse' : ''}`} />
      <span className="font-mono font-medium text-lg">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
