import React from 'react';
import { X, Palette, Moon, Sun, Check } from 'lucide-react';
import { useTheme, themeOptions, ThemeColor } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

// Colores para la vista previa de cada tema
const previewColors: Record<ThemeColor, { light: string; medium: string; dark: string }> = {
  classic: { light: '#3b82f6', medium: '#8b5cf6', dark: '#10b981' }, // multicolor
  indigo: { light: '#a5b4fc', medium: '#6366f1', dark: '#3730a3' },
  slate: { light: '#94a3b8', medium: '#64748b', dark: '#334155' },
  rose: { light: '#fda4af', medium: '#f43f5e', dark: '#9f1239' },
  emerald: { light: '#6ee7b7', medium: '#10b981', dark: '#065f46' },
  amber: { light: '#fcd34d', medium: '#f59e0b', dark: '#92400e' },
  purple: { light: '#c4b5fd', medium: '#a855f7', dark: '#6b21a8' },
  ocean: { light: '#67e8f9', medium: '#06b6d4', dark: '#155e75' },
};

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { theme, setTheme, isDark, toggleDark } = useTheme();

  // Cerrar con Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreview = previewColors[theme] || previewColors.indigo;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Personalizar Tema
            </h2>
          </div>

          {/* Dark Mode Toggle */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Modo de visualización
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => isDark && toggleDark()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  !isDark
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">Claro</span>
              </button>
              <button
                onClick={() => !isDark && toggleDark()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  isDark
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">Oscuro</span>
              </button>
            </div>
          </div>

          {/* Color Theme Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Color del tema
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    theme === option.id
                      ? 'border-gray-800 dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {option.isMultiColor ? (
                    // Círculo multicolor para "Clásico"
                    <div
                      className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center overflow-hidden"
                      style={{
                        background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #10b981, #f59e0b, #3b82f6)'
                      }}
                    >
                      {theme === option.id && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: isDark ? option.darkColor : option.color }}
                    >
                      {theme === option.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                  <span className={`font-medium ${
                    theme === option.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Vista previa de intensidades:</p>
            {theme === 'classic' ? (
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium">M1</span>
                <span className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium">M2</span>
                <span className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-medium">L</span>
                <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium">C</span>
                <span className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium">H</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <span 
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                  style={{ backgroundColor: currentPreview.light }}
                >
                  Claro
                </span>
                <span 
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                  style={{ backgroundColor: currentPreview.medium }}
                >
                  Medio
                </span>
                <span 
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                  style={{ backgroundColor: currentPreview.dark }}
                >
                  Oscuro
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
