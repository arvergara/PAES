import { DailyProgressBanner } from './DailyProgressBanner';
import { CountdownBanner } from './CountdownBanner';
import { ContinueButton } from './ContinueButton';
import type { Subject, PracticeMode } from '../types';

interface TopBannersSectionProps {
  onContinue: (subject: Subject, mode: PracticeMode, questionIndex?: number, timeRemaining?: number) => void;
  userId: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  questionsToday: number;
  correctToday: number;
  dailyGoal: number;
  progressLoading: boolean;
}

export function TopBannersSection({
  onContinue,
  userId,
  xp,
  currentStreak,
  longestStreak,
  questionsToday,
  correctToday,
  dailyGoal,
  progressLoading,
}: TopBannersSectionProps) {
  return (
    <div className="max-w-5xl mx-auto mb-8 space-y-4">
      {/* Daily Progress - Full Width (streak + XP + daily goal) */}
      <DailyProgressBanner
        xp={xp}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        questionsToday={questionsToday}
        correctToday={correctToday}
        dailyGoal={dailyGoal}
        loading={progressLoading}
      />

      {/* Continue + Countdown - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContinueButton onContinue={onContinue} userId={userId} />
        <CountdownBanner />
      </div>
    </div>
  );
}
