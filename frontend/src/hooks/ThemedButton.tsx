import { useTheme, themeButtonColors, ThemeColor } from './useThemeColors';

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'solid' | 'gradient';
  fullWidth?: boolean;
}

// Componente de botón que usa los colores del tema
export function ThemedButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  variant = 'solid',
  fullWidth = false
}: ThemedButtonProps) {
  const theme = useTheme();
  const colors = themeButtonColors[theme] || themeButtonColors.classic;
  
  const baseClass = `px-6 py-3 rounded-lg transition-colors font-medium ${fullWidth ? 'w-full' : ''}`;
  
  const colorClass = variant === 'gradient' 
    ? `${colors.gradient} ${colors.gradientHover}`
    : `${colors.primary} ${colors.primaryHover}`;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${colorClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// Hook para obtener las clases de botón del tema actual
export function useThemedButtonClass(variant: 'solid' | 'gradient' = 'solid') {
  const theme = useTheme();
  const colors = themeButtonColors[theme] || themeButtonColors.classic;
  
  if (variant === 'gradient') {
    return `${colors.gradient} ${colors.gradientHover}`;
  }
  return `${colors.primary} ${colors.primaryHover}`;
}

// Función para reemplazar bg-indigo-600 con colores del tema
export function getThemedButtonClass(theme: ThemeColor): string {
  const colors = themeButtonColors[theme] || themeButtonColors.classic;
  return `${colors.primary} ${colors.primaryHover}`;
}
