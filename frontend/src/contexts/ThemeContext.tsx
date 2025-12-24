import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'classic' | 'indigo' | 'slate' | 'rose' | 'emerald' | 'amber' | 'purple' | 'ocean';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeOptions: { id: ThemeColor; name: string; color: string; darkColor: string; isMultiColor?: boolean }[] = [
  { id: 'classic', name: 'Clásico', color: '#6366f1', darkColor: '#818cf8', isMultiColor: true },
  { id: 'indigo', name: 'Índigo', color: '#6366f1', darkColor: '#818cf8' },
  { id: 'slate', name: 'Azul Grisáceo', color: '#64748b', darkColor: '#94a3b8' },
  { id: 'rose', name: 'Rosa', color: '#f43f5e', darkColor: '#fb7185' },
  { id: 'emerald', name: 'Esmeralda', color: '#10b981', darkColor: '#34d399' },
  { id: 'amber', name: 'Ámbar', color: '#f59e0b', darkColor: '#fbbf24' },
  { id: 'purple', name: 'Púrpura', color: '#a855f7', darkColor: '#c084fc' },
  { id: 'ocean', name: 'Océano', color: '#06b6d4', darkColor: '#22d3ee' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-color') as ThemeColor) || 'classic';
    }
    return 'classic';
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    // Aplicar tema de color
    if (theme === 'classic' || theme === 'indigo') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme-color', theme);
  }, [theme]);

  useEffect(() => {
    // Aplicar modo oscuro
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
  };

  const toggleDark = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
