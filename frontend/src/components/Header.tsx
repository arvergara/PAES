import React, { useState } from 'react';
import { BookOpen, BarChart, Home, FileText, Sun, Moon, Palette } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { PerformanceModal } from './PerformanceModal';
import { ContentModal } from './ContentModal';
import { SettingsModal, SettingsButton } from './SettingsMenu';
import { ThemeSelector } from './ThemeSelector';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import type { Subject } from '../types';

interface ModeTimeSettings {
  M1: number;
  M2: number;
  L: number;
  C: number;
  H: number;
}

interface TimeSettings {
  test: ModeTimeSettings;
  paes: ModeTimeSettings;
  paesQuestions: ModeTimeSettings;
  readingTime: ModeTimeSettings;
  reviewQuestions: ModeTimeSettings;
}

interface HeaderProps {
  timeSettings?: TimeSettings;
  onUpdateTimeSetting?: (mode: 'test' | 'paes', subject: Subject, time: number) => void;
  onUpdatePaesQuestions?: (subject: Subject, count: number) => void;
  onUpdateReadingTime?: (subject: Subject, time: number) => void;
  onUpdateReviewQuestions?: (subject: Subject, count: number) => void;
  showHomeButton?: boolean;
  onGoHome?: () => void;
}

const themeGradients: Record<string, string> = {
  classic: 'from-indigo-600 to-purple-600',
  indigo: 'from-indigo-600 to-purple-600',
  slate: 'from-slate-600 to-slate-800',
  rose: 'from-rose-600 to-pink-700',
  emerald: 'from-emerald-600 to-teal-700',
  amber: 'from-amber-500 to-orange-600',
  purple: 'from-purple-600 to-fuchsia-700',
  ocean: 'from-cyan-600 to-blue-700',
};

const themeTextColors: Record<string, string> = {
  classic: 'text-indigo-200',
  indigo: 'text-indigo-200',
  slate: 'text-slate-300',
  rose: 'text-rose-200',
  emerald: 'text-emerald-200',
  amber: 'text-amber-200',
  purple: 'text-purple-200',
  ocean: 'text-cyan-200',
};

const themeButtonColors: Record<string, string> = {
  classic: 'text-indigo-600',
  indigo: 'text-indigo-600',
  slate: 'text-slate-600',
  rose: 'text-rose-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  purple: 'text-purple-600',
  ocean: 'text-cyan-600',
};

export function Header({ 
  timeSettings, 
  onUpdateTimeSetting, 
  onUpdatePaesQuestions, 
  onUpdateReadingTime, 
  onUpdateReviewQuestions,
  showHomeButton = false,
  onGoHome
}: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, loading } = useAuth();
  const { theme, isDark, toggleDark } = useTheme();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('¡Hasta pronto!');
    }
  };

  const openModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const gradientClass = isDark 
    ? 'from-gray-800 to-gray-900' 
    : themeGradients[theme] || themeGradients.indigo;
  
  const subtitleClass = isDark 
    ? 'text-gray-400' 
    : themeTextColors[theme] || themeTextColors.indigo;

  const buttonTextClass = themeButtonColors[theme] || themeButtonColors.indigo;

  // Estilo del botón de tema según el tema actual
  const getThemeButtonStyle = () => {
    if (theme === 'classic') {
      return {
        background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #10b981, #f59e0b, #3b82f6)'
      };
    }
    
    const colors: Record<string, string> = {
      slate: 'linear-gradient(135deg, #64748b, #475569)',
      rose: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      emerald: 'linear-gradient(135deg, #10b981, #059669)',
      amber: 'linear-gradient(135deg, #f59e0b, #d97706)',
      purple: 'linear-gradient(135deg, #a855f7, #9333ea)',
      ocean: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      indigo: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    };
    return { background: colors[theme] || colors.indigo };
  };

  return (
    <>
      <header className={`bg-gradient-to-r ${gradientClass} text-white py-4 px-6 shadow-lg transition-all duration-300`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Botón de Inicio - solo visible cuando no estamos en inicio */}
            {showHomeButton && onGoHome && (
              <button
                onClick={onGoHome}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                title="Volver al inicio"
              >
                <Home className="h-6 w-6" />
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TutorPAES</h1>
                <p className={`text-xs ${subtitleClass}`}>Tu preparación inteligente</p>
              </div>
            </div>
          </div>
          
          <nav>
            <ul className="flex space-x-3 items-center">
              {/* Botón Contenidos - siempre visible */}
              <li>
                <button
                  onClick={() => setShowContentModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  title="Ver contenidos PAES"
                >
                  <FileText className="h-5 w-5" />
                  <span className="hidden sm:inline">Contenidos</span>
                </button>
              </li>

              {/* Settings Button - siempre visible */}
              {timeSettings && onUpdateTimeSetting && onUpdatePaesQuestions && (
                <li>
                  <SettingsButton onClick={() => setShowSettingsModal(true)} />
                </li>
              )}
              
              {loading ? (
                <li className="animate-pulse">Cargando...</li>
              ) : user ? (
                <>
                  <li>
                    <button
                      onClick={() => setShowPerformanceModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <BarChart className="h-5 w-5" />
                      <span className="hidden sm:inline">Mi Progreso</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-sm hidden md:inline">¡Hola, {user.user_metadata.name || 'Usuario'}!</span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => openModal('login')}
                      className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                  </li>
                </>
              )}

              {/* Botón Salir o Registrarse */}
              {user ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className={`bg-white ${buttonTextClass} dark:bg-gray-200 dark:text-gray-800 px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors`}
                  >
                    Salir
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => openModal('register')}
                    className={`bg-white ${buttonTextClass} px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors`}
                  >
                    Registrarse
                  </button>
                </li>
              )}

              {/* Separador visual */}
              <li className="hidden sm:block w-px h-8 bg-white/20" />

              {/* Botón Dark/Light Mode */}
              <li>
                <button
                  onClick={toggleDark}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  title={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-yellow-300" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </li>

              {/* Botón Tema de Color */}
              <li>
                <button
                  onClick={() => setShowThemeSelector(true)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Cambiar tema de color"
                  title="Tema de color"
                >
                  <div 
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={getThemeButtonStyle()}
                  >
                    <Palette className="h-3.5 w-3.5 text-white" />
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} mode={authMode} />
      <PerformanceModal isOpen={showPerformanceModal} onClose={() => setShowPerformanceModal(false)} />
      <ContentModal isOpen={showContentModal} onClose={() => setShowContentModal(false)} />
      <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
      
      {timeSettings && onUpdateTimeSetting && onUpdatePaesQuestions && onUpdateReadingTime && onUpdateReviewQuestions && (
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)}
          settings={timeSettings}
          onUpdateSetting={onUpdateTimeSetting}
          onUpdatePaesQuestions={onUpdatePaesQuestions}
          onUpdateReadingTime={onUpdateReadingTime}
          onUpdateReviewQuestions={onUpdateReviewQuestions}
        />
      )}
    </>
  );
}
