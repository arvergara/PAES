import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  totalMinutes: number;
  onTimeUp: () => void;
  /**
   * Optional value that forces the timer to restart when it changes.
   * Useful for per-question timers inside test mode.
   */
  resetKey?: string | number;
}

export function Timer({ totalMinutes, onTimeUp, resetKey }: TimerProps) {
  const initialSeconds = Math.max(0, Math.round(totalMinutes * 60));
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Reset timer whenever totalMinutes or resetKey changes.
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setHasTriggered(false);
  }, [initialSeconds, resetKey]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasTriggered) {
        setHasTriggered(true);
        onTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, hasTriggered]);

  const safeTimeLeft = Math.max(0, timeLeft);
  const minutes = Math.floor(safeTimeLeft / 60);
  const seconds = safeTimeLeft % 60;

  const timeColor = timeLeft < 300 ? 'text-red-600' : 'text-gray-800';

  return (
    <div className="flex items-center space-x-2 text-lg font-semibold">
      <TimerIcon className="h-6 w-6" />
      <span className={timeColor}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
