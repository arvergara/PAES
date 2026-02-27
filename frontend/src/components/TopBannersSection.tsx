import { WelcomeBanner } from './WelcomeBanner';
import { CountdownBanner } from './CountdownBanner';
import { ContinueButton } from './ContinueButton';
import { StreakBanner } from './StreakBanner';
import type { Subject, PracticeMode } from '../types';

interface TopBannersSectionProps {
  onContinue: (subject: Subject, mode: PracticeMode, questionIndex?: number, timeRemaining?: number) => void;
  userId: string;
}

export function TopBannersSection({ onContinue, userId }: TopBannersSectionProps) {
  return (
    <div className="max-w-5xl mx-auto mb-8 space-y-4">
      {/* Welcome Banner - Full Width */}
      <WelcomeBanner />
      
      {/* Streak + Continue - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StreakBanner userId={userId} />
        <ContinueButton onContinue={onContinue} userId={userId} />
      </div>

      {/* Countdown - Full Width */}
      <CountdownBanner />
    </div>
  );
}