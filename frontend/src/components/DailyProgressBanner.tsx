import { Flame, Trophy, Zap, Star, TrendingUp, Target } from 'lucide-react';
import { getLevel } from '../hooks/useUserProgress';

interface DailyProgressBannerProps {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  questionsToday: number;
  correctToday: number;
  dailyGoal: number;
  loading: boolean;
}

function getStreakIcon(streak: number) {
  if (streak >= 14) return { icon: Trophy, color: 'text-amber-500' };
  if (streak >= 7) return { icon: Star, color: 'text-orange-500' };
  if (streak >= 3) return { icon: Zap, color: 'text-rose-500' };
  return { icon: Flame, color: 'text-orange-500' };
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comienza tu racha hoy';
  if (streak === 1) return 'Primer dia. Vuelve manana!';
  if (streak === 2) return 'El habito esta naciendo!';
  if (streak <= 5) return 'La disciplina se nota!';
  if (streak <= 7) return 'Una semana completa!';
  if (streak <= 14) return 'Estas imparable!';
  if (streak <= 30) return 'Nivel PAES Pro!';
  return 'Leyenda absoluta!';
}

function getProjection(questionsPerDay: number): string {
  if (questionsPerDay <= 0) return 'Responde preguntas para ver tu proyeccion';
  // Based on SAT/Khan Academy data: ~0.08 points per question practiced over a month
  const pointsPerMonth = Math.round(questionsPerDay * 30 * 0.08);
  if (pointsPerMonth < 10) return `Practica un poco mas para ver resultados`;
  return `~${pointsPerMonth} puntos/mes con tu ritmo actual`;
}

export function DailyProgressBanner({
  xp,
  currentStreak,
  longestStreak,
  questionsToday,
  correctToday,
  dailyGoal,
  loading,
}: DailyProgressBannerProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm animate-pulse h-32" />
    );
  }

  const level = getLevel(xp);
  const streakInfo = getStreakIcon(currentStreak);
  const StreakIcon = streakInfo.icon;
  const goalProgress = Math.min(questionsToday / dailyGoal, 1);
  const goalReached = questionsToday >= dailyGoal;
  const accuracyToday = questionsToday > 0 ? Math.round((correctToday / questionsToday) * 100) : 0;

  // Calculate average questions per day based on streak (rough estimate)
  const avgQuestionsPerDay = currentStreak > 0 ? questionsToday : 0;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Top row: Streak + Level + XP */}
        <div className="flex items-center justify-between mb-4">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
              currentStreak >= 7 ? 'bg-amber-50 dark:bg-amber-500/10' :
              currentStreak >= 3 ? 'bg-rose-50 dark:bg-rose-500/10' :
              'bg-orange-50 dark:bg-orange-500/10'
            }`}>
              <StreakIcon className={`w-5 h-5 ${streakInfo.color}`} />
              <span className={`text-2xl font-black tabular-nums ${streakInfo.color}`}>
                {currentStreak}
              </span>
              <span className={`text-xs font-medium ${streakInfo.color} opacity-70`}>
                {currentStreak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            {longestStreak > currentStreak && longestStreak > 1 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Record: {longestStreak}
              </span>
            )}
          </div>

          {/* Level + XP */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nv.</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{level.level}</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{level.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{xp.toLocaleString()} XP</span>
                {level.nextLevel && (
                  <span className="text-[10px] text-gray-400">/ {level.nextLevel.xp.toLocaleString()}</span>
                )}
              </div>
            </div>
            {/* XP progress ring */}
            {level.nextLevel && (
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                    className="text-gray-100 dark:text-gray-700" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                    className="text-indigo-500 dark:text-indigo-400" strokeWidth="3"
                    strokeDasharray={`${level.progress * 94.2} 94.2`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(level.progress * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily goal progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${goalReached ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Meta diaria
              </span>
            </div>
            <div className="flex items-center gap-2">
              {questionsToday > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  accuracyToday >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  accuracyToday >= 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                  'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {accuracyToday}% precision
                </span>
              )}
              <span className={`text-sm font-semibold ${goalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {questionsToday}/{dailyGoal}
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                goalReached
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
              }`}
              style={{ width: `${goalProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom: Message + Projection */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {goalReached ? 'Meta cumplida! +50 XP bonus' : getStreakMessage(currentStreak)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {getProjection(avgQuestionsPerDay)}
          </p>
        </div>
      </div>
    </div>
  );
}
