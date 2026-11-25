import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface UserProgress {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  dailyGoal: number;
}

interface DailyStats {
  questionsToday: number;
  correctToday: number;
}

// XP rewards
const XP_CORRECT = 10;
const XP_INCORRECT = 3;
const XP_DAILY_GOAL_BONUS = 50;

// Level thresholds
const LEVELS = [
  { level: 1, xp: 0, name: 'Novato' },
  { level: 2, xp: 100, name: 'Estudiante' },
  { level: 3, xp: 300, name: 'Aplicado' },
  { level: 4, xp: 600, name: 'Dedicado' },
  { level: 5, xp: 1000, name: 'Avanzado' },
  { level: 6, xp: 1500, name: 'Experto' },
  { level: 7, xp: 2100, name: 'Crack' },
  { level: 8, xp: 2800, name: 'Maestro' },
  { level: 9, xp: 3600, name: 'Leyenda' },
  { level: 10, xp: 4500, name: 'PAES Master' },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xp) current = level;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.xp > xp);
  const xpInLevel = xp - current.xp;
  const xpForNext = nextLevel ? nextLevel.xp - current.xp : 0;
  const progressPct = nextLevel ? xpInLevel / xpForNext : 1;

  return { ...current, nextLevel, xpInLevel, xpForNext, progress: progressPct };
}

function getTodayChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

function getYesterdayChile(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

async function saveToDb(userId: string, data: Partial<Record<string, unknown>>) {
  try {
    await supabase
      .from('user_progress')
      .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch {
    // Silently fail - localStorage fallback handled by caller
  }
}

export function useUserProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<UserProgress>({
    xp: 0, currentStreak: 0, longestStreak: 0, lastPracticeDate: null, dailyGoal: 20,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats>({ questionsToday: 0, correctToday: 0 });
  const [loading, setLoading] = useState(true);

  // Use refs to avoid stale closures in callbacks
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const dailyStatsRef = useRef(dailyStats);
  dailyStatsRef.current = dailyStats;
  const dailyGoalReachedRef = useRef(false);
  const streakUpdatedRef = useRef(false);

  // Fetch progress from DB
  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    streakUpdatedRef.current = false;

    try {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      const fetched: UserProgress = progressData ? {
        xp: progressData.xp || 0,
        currentStreak: progressData.current_streak || 0,
        longestStreak: progressData.longest_streak || 0,
        lastPracticeDate: progressData.last_practice_date,
        dailyGoal: progressData.daily_goal || 20,
      } : { xp: 0, currentStreak: 0, longestStreak: 0, lastPracticeDate: null, dailyGoal: 20 };

      // Fetch today's stats
      const todayStart = getTodayChile() + 'T00:00:00-03:00';
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', userId)
        .gte('created_at', todayStart);

      const questionsToday = attempts?.length || 0;
      const correctToday = attempts?.filter(a => a.is_correct).length || 0;
      dailyGoalReachedRef.current = questionsToday >= fetched.dailyGoal;

      // Update streak inline
      const today = getTodayChile();
      const yesterday = getYesterdayChile();
      let { currentStreak, longestStreak, lastPracticeDate } = fetched;

      if (lastPracticeDate !== today) {
        if (lastPracticeDate === yesterday) {
          currentStreak += 1;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
        lastPracticeDate = today;

        // Save updated streak
        saveToDb(userId, {
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_practice_date: today,
          xp: fetched.xp,
          daily_goal: fetched.dailyGoal,
        });

        // Update legacy localStorage
        localStorage.setItem('tutorpaes_streak', JSON.stringify({
          currentStreak, lastVisitDate: today, longestStreak, userId,
        }));
      }

      setProgress({ ...fetched, currentStreak, longestStreak, lastPracticeDate });
      setDailyStats({ questionsToday, correctToday });
    } catch {
      // Fallback: use localStorage streak data
      const raw = localStorage.getItem('tutorpaes_streak');
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (data.userId === userId) {
            setProgress(prev => ({
              ...prev,
              currentStreak: data.currentStreak || 0,
              longestStreak: data.longestStreak || 0,
              lastPracticeDate: data.lastVisitDate || null,
            }));
          }
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Add XP when answering a question
  const addXP = useCallback(async (isCorrect: boolean) => {
    if (!userId) return;

    const current = progressRef.current;
    const stats = dailyStatsRef.current;
    const xpGain = isCorrect ? XP_CORRECT : XP_INCORRECT;
    const newQuestionsToday = stats.questionsToday + 1;
    const newCorrectToday = stats.correctToday + (isCorrect ? 1 : 0);

    let bonusXP = 0;
    if (newQuestionsToday >= current.dailyGoal && !dailyGoalReachedRef.current) {
      bonusXP = XP_DAILY_GOAL_BONUS;
      dailyGoalReachedRef.current = true;
    }

    const newXP = current.xp + xpGain + bonusXP;
    const today = getTodayChile();

    const updated = { ...current, xp: newXP, lastPracticeDate: today };
    setProgress(updated);
    setDailyStats({ questionsToday: newQuestionsToday, correctToday: newCorrectToday });

    saveToDb(userId, {
      xp: newXP,
      current_streak: current.currentStreak,
      longest_streak: current.longestStreak,
      last_practice_date: today,
      daily_goal: current.dailyGoal,
    });

    return { xpGain: xpGain + bonusXP, bonusXP, newXP };
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    dailyStats,
    loading,
    addXP,
    refreshStats: fetchProgress,
    level: getLevel(progress.xp),
  };
}
