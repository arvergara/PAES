import { useState, useEffect } from 'react';
import { Flame, Trophy, Zap, Star } from 'lucide-react';

interface StreakBannerProps {
  userId: string;
}

interface StreakData {
  currentStreak: number;
  lastVisitDate: string;
  longestStreak: number;
  userId: string;
}

function getTodayChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

function getYesterdayChile(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

function getStreakMessage(streak: number): string {
  if (streak === 1) return 'Vuelve mañana para iniciar tu racha';
  if (streak === 2) return '¡El hábito está naciendo!';
  if (streak === 3) return '¡3 días seguidos, vas con todo!';
  if (streak <= 5) return '¡La disciplina se nota!';
  if (streak <= 7) return '¡Una semana completa!';
  if (streak <= 14) return '¡Estás imparable!';
  if (streak <= 30) return '¡Nivel PAES Pro!';
  return '¡Leyenda absoluta!';
}

function getStreakTheme(streak: number) {
  if (streak >= 14) return {
    icon: Trophy,
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
    numberBg: 'bg-amber-50 dark:bg-amber-500/10',
    numberBorder: 'border-amber-200 dark:border-amber-500/30',
  };
  if (streak >= 7) return {
    icon: Star,
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accentColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-500/20',
    numberBg: 'bg-orange-50 dark:bg-orange-500/10',
    numberBorder: 'border-orange-200 dark:border-orange-500/30',
  };
  if (streak >= 3) return {
    icon: Zap,
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconColor: 'text-rose-500 dark:text-rose-400',
    accentColor: 'text-rose-500 dark:text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-500/20',
    numberBg: 'bg-rose-50 dark:bg-rose-500/10',
    numberBorder: 'border-rose-200 dark:border-rose-500/30',
  };
  return {
    icon: Flame,
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    iconColor: 'text-orange-500 dark:text-orange-400',
    accentColor: 'text-orange-500 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-500/20',
    numberBg: 'bg-orange-50 dark:bg-orange-500/10',
    numberBorder: 'border-orange-200 dark:border-orange-500/30',
  };
}

export function StreakBanner({ userId }: StreakBannerProps) {
  const [streak, setStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [isNewDay, setIsNewDay] = useState(false);

  useEffect(() => {
    const STORAGE_KEY = 'tutorpaes_streak';
    const today = getTodayChile();
    const yesterday = getYesterdayChile();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let data: StreakData | null = raw ? JSON.parse(raw) : null;

      if (data && data.userId !== userId) data = null;

      if (!data) {
        const newData: StreakData = { currentStreak: 1, lastVisitDate: today, longestStreak: 1, userId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setStreak(1);
        setLongestStreak(1);
        setIsNewDay(true);
        return;
      }

      if (data.lastVisitDate === today) {
        setStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);
        setIsNewDay(false);
      } else if (data.lastVisitDate === yesterday) {
        const newStreak = data.currentStreak + 1;
        const newLongest = Math.max(data.longestStreak, newStreak);
        const updated: StreakData = { currentStreak: newStreak, lastVisitDate: today, longestStreak: newLongest, userId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setStreak(newStreak);
        setLongestStreak(newLongest);
        setIsNewDay(true);
      } else {
        const updated: StreakData = { currentStreak: 1, lastVisitDate: today, longestStreak: data.longestStreak, userId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setStreak(1);
        setLongestStreak(data.longestStreak);
        setIsNewDay(true);
      }
    } catch {
      const newData: StreakData = { currentStreak: 1, lastVisitDate: today, longestStreak: 1, userId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setStreak(1);
      setLongestStreak(1);
    }
  }, [userId]);

  if (streak <= 0) return null;

  const theme = getStreakTheme(streak);
  const Icon = theme.icon;
  const message = getStreakMessage(streak);

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm h-full">
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${theme.iconBg}`}>
            <Icon className={`w-5 h-5 ${theme.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Racha de estudio</h3>
              {isNewDay && streak > 1 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.accentColor}`}>
                  +1
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
            {longestStreak > streak && (
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                <Trophy className="w-3 h-3" />
                Récord: {longestStreak} días
              </p>
            )}
          </div>
          {/* Prominent number pill */}
          <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border ${theme.numberBg} ${theme.numberBorder} flex-shrink-0`}>
            <span className={`text-4xl font-black tabular-nums leading-none ${theme.accentColor}`}>
              {streak}
            </span>
            <span className={`text-xs font-semibold ${theme.accentColor} opacity-70`}>
              {streak === 1 ? 'día' : 'días'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}