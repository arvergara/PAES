import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

const PAES_DATE = '2026-11-24T00:00:00';

export function CountdownBanner() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('countdownBannerDismissed');
    if (dismissed === 'true') setIsDismissed(true);

    const calculateDays = () => {
      const now = new Date();
      const paesDate = new Date(PAES_DATE);
      const diffTime = paesDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('countdownBannerDismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">PAES 2026</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">24 de noviembre</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Countdown */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{daysLeft}</span>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">días restantes</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Progreso del año</span>
            <span>{Math.round((1 - daysLeft / 365) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1.5">
            <div 
              className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, (1 - daysLeft / 365) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}