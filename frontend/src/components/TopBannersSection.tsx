import { WelcomeBanner } from './WelcomeBanner';
import { CountdownBanner } from './CountdownBanner';
import { ContinueButton } from './ContinueButton';
import type { Subject, PracticeMode } from '../types';

interface TopBannersSectionProps {
  onContinue: (subject: Subject, mode: PracticeMode, questionIndex?: number, timeRemaining?: number) => void;
  userId: string; // Nuevo: userId requerido
}

export function TopBannersSection({ onContinue, userId }: TopBannersSectionProps) {
  return (
    <div className="max-w-5xl mx-auto mb-8 space-y-4">
      {/* Welcome Banner - Full Width */}
      <WelcomeBanner />
      
      {/* Countdown and Continue - Side by side on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CountdownBanner />
        <ContinueButton onContinue={onContinue} userId={userId} />
      </div>
    </div>
  );
}