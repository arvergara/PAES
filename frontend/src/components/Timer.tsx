import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Infinity } from 'lucide-react';

interface TimerProps {
  totalMinutes: number;
  onTimeUp: () => void;
  resetKey?: number | string;
  onTick?: (timeLeft: number) => void;
  initialTimeSeconds?: number;
  paused?: boolean;
}

export function Timer({
  totalMinutes,
  onTimeUp,
  resetKey,
  onTick,
  initialTimeSeconds,
  paused = false
}: TimerProps) {
  const getInitialTime = useCallback(() => {
    if (initialTimeSeconds !== undefined && initialTimeSeconds > 0) {
      return initialTimeSeconds;
    }
    return Math.round(totalMinutes * 60);
  }, [initialTimeSeconds, totalMinutes]);

  const [timeLeft, setTimeLeft] = useState(getInitialTime);
  const hasCalledTimeUp = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);

  // Keep refs up to date without triggering effects
  onTimeUpRef.current = onTimeUp;
  onTickRef.current = onTick;

  // Reset when key or totalMinutes changes
  useEffect(() => {
    if (initialTimeSeconds === undefined) {
      setTimeLeft(Math.round(totalMinutes * 60));
      hasCalledTimeUp.current = false;
    }
  }, [totalMinutes, resetKey, initialTimeSeconds]);

  // Reset when initialTimeSeconds changes
  useEffect(() => {
    if (initialTimeSeconds !== undefined && initialTimeSeconds > 0) {
      setTimeLeft(initialTimeSeconds);
      hasCalledTimeUp.current = false;
    }
  }, [initialTimeSeconds]);

  // Single interval that runs the countdown
  useEffect(() => {
    if (totalMinutes === 0 || paused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            // Call onTimeUp async to avoid state update during render
            setTimeout(() => onTimeUpRef.current(), 0);
          }
          return 0;
        }
        // Report tick
        if (onTickRef.current) {
          onTickRef.current(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalMinutes, paused, resetKey, initialTimeSeconds]);

  // Sin límite de tiempo
  if (totalMinutes === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <Infinity className="h-5 w-5" />
        <span className="font-medium">Sin límite</span>
      </div>
    );
  }

  const displayTime = Math.max(0, timeLeft);
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const isLow = displayTime < 30 && displayTime > 0;
  const isExpired = displayTime === 0;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md border ${
      isExpired
        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
        : isLow
          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          : paused
            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }`}>
      <Clock className={`h-5 w-5 ${isLow ? 'animate-pulse' : ''}`} />
      <span className="font-mono font-medium text-lg">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      {paused && (
        <span className="text-xs font-medium ml-1">(pausado)</span>
      )}
    </div>
  );
}

// Componente simple para mostrar tiempo (sin lógica de conteo)
interface TimeDisplayProps {
  timeLeft: number;
}

export function TimeDisplay({ timeLeft }: TimeDisplayProps) {
  const displayTime = Math.max(0, timeLeft);
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const isLow = displayTime < 30 && displayTime > 0;

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
