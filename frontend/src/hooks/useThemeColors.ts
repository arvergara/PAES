import { useTheme as useThemeContext } from '../contexts/ThemeContext';

export type ThemeColor = 'classic' | 'indigo' | 'slate' | 'rose' | 'emerald' | 'amber' | 'ocean';

// Definición completa de colores por tema
const themeColorMap: Record<ThemeColor, {
  primary: string;
  primaryHover: string;
  primaryText: string;
  primaryLight: string;
  primaryBorder: string;
  tabActive: string;
  tabActiveBg: string;
  selected: string;
  selectedRing: string;
  hover: string;
  badge: string;
  optionBg: string;
}> = {
  classic: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600 dark:text-blue-400',
    primaryLight: 'bg-blue-50 dark:bg-blue-900/30',
    primaryBorder: 'border-blue-500',
    tabActive: 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400',
    tabActiveBg: 'bg-blue-50 dark:bg-blue-900/30',
    selected: 'border-blue-500 bg-blue-500',
    selectedRing: 'ring-blue-100 dark:ring-blue-800',
    hover: 'hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600',
    badge: 'bg-blue-500',
    optionBg: 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-blue-100 dark:ring-blue-800',
  },
  indigo: {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryText: 'text-indigo-600 dark:text-indigo-400',
    primaryLight: 'bg-indigo-50 dark:bg-indigo-900/30',
    primaryBorder: 'border-indigo-500',
    tabActive: 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400',
    tabActiveBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    selected: 'border-indigo-500 bg-indigo-500',
    selectedRing: 'ring-indigo-100 dark:ring-indigo-800',
    hover: 'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-600',
    badge: 'bg-indigo-500',
    optionBg: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 ring-indigo-100 dark:ring-indigo-800',
  },
  slate: {
    primary: 'bg-slate-600',
    primaryHover: 'hover:bg-slate-700',
    primaryText: 'text-slate-600 dark:text-slate-400',
    primaryLight: 'bg-slate-50 dark:bg-slate-900/30',
    primaryBorder: 'border-slate-500',
    tabActive: 'text-slate-600 dark:text-slate-400 border-slate-600 dark:border-slate-400',
    tabActiveBg: 'bg-slate-50 dark:bg-slate-900/30',
    selected: 'border-slate-500 bg-slate-500',
    selectedRing: 'ring-slate-100 dark:ring-slate-800',
    hover: 'hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-gray-600',
    badge: 'bg-slate-500',
    optionBg: 'border-slate-400 bg-slate-50 dark:bg-slate-900/30 ring-slate-100 dark:ring-slate-800',
  },
  rose: {
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryText: 'text-rose-600 dark:text-rose-400',
    primaryLight: 'bg-rose-50 dark:bg-rose-900/30',
    primaryBorder: 'border-rose-500',
    tabActive: 'text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-400',
    tabActiveBg: 'bg-rose-50 dark:bg-rose-900/30',
    selected: 'border-rose-500 bg-rose-500',
    selectedRing: 'ring-rose-100 dark:ring-rose-800',
    hover: 'hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-gray-600',
    badge: 'bg-rose-500',
    optionBg: 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 ring-rose-100 dark:ring-rose-800',
  },
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    primaryLight: 'bg-emerald-50 dark:bg-emerald-900/30',
    primaryBorder: 'border-emerald-500',
    tabActive: 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400',
    tabActiveBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    selected: 'border-emerald-500 bg-emerald-500',
    selectedRing: 'ring-emerald-100 dark:ring-emerald-800',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-gray-600',
    badge: 'bg-emerald-500',
    optionBg: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 ring-emerald-100 dark:ring-emerald-800',
  },
  amber: {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    primaryText: 'text-amber-600 dark:text-amber-400',
    primaryLight: 'bg-amber-50 dark:bg-amber-900/30',
    primaryBorder: 'border-amber-500',
    tabActive: 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400',
    tabActiveBg: 'bg-amber-50 dark:bg-amber-900/30',
    selected: 'border-amber-500 bg-amber-500',
    selectedRing: 'ring-amber-100 dark:ring-amber-800',
    hover: 'hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-gray-600',
    badge: 'bg-amber-500',
    optionBg: 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 ring-amber-100 dark:ring-amber-800',
  },
  ocean: {
    primary: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-700',
    primaryText: 'text-cyan-600 dark:text-cyan-400',
    primaryLight: 'bg-cyan-50 dark:bg-cyan-900/30',
    primaryBorder: 'border-cyan-500',
    tabActive: 'text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400',
    tabActiveBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    selected: 'border-cyan-500 bg-cyan-500',
    selectedRing: 'ring-cyan-100 dark:ring-cyan-800',
    hover: 'hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-gray-600',
    badge: 'bg-cyan-500',
    optionBg: 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 ring-cyan-100 dark:ring-cyan-800',
  },
};

// Hook principal que retorna todos los colores del tema actual
export function useThemeColors() {
  const { theme } = useThemeContext();
  return themeColorMap[theme] || themeColorMap.classic;
}

// Exportar también el mapa por si se necesita acceso directo
export { themeColorMap };
