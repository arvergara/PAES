import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  color?: 'gradient' | 'white' | 'currentColor';
}

export function TutorPAESLogo({ 
  size = 40, 
  className = '', 
  color = 'gradient' 
}: LogoProps) {
  const gradientId = `logo-grad-${React.useId().replace(/:/g, '')}`;
  
  const strokeColor = color === 'gradient' 
    ? `url(#${gradientId})` 
    : color === 'white' 
      ? 'white' 
      : 'currentColor';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {color === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#a855f7"/>
          </linearGradient>
        </defs>
      )}
      
      <rect x="5" y="82" width="32" height="10" rx="2" stroke={strokeColor} strokeWidth="2.5" fill="none"/>
      <rect x="18" y="66" width="38" height="10" rx="2" stroke={strokeColor} strokeWidth="2.5" fill="none"/>
      <rect x="32" y="50" width="28" height="10" rx="2" stroke={strokeColor} strokeWidth="2.5" fill="none"/>
      <rect x="44" y="34" width="42" height="10" rx="2" stroke={strokeColor} strokeWidth="2.5" fill="none"/>
      <rect x="60" y="18" width="30" height="10" rx="2" stroke={strokeColor} strokeWidth="2.5" fill="none"/>
    </svg>
  );
}

export default TutorPAESLogo;
