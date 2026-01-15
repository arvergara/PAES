import React, { useState } from 'react';
import { BarChart, Home, FileText, Sun, Moon } from 'lucide-react';
import { TutorPAESLogo } from './TutorPAESLogo';
import { AuthModal } from './AuthModal';
import { PerformanceModal } from './PerformanceModal';
import { ContentModal } from './ContentModal';
import { SettingsModal, SettingsButton } from './SettingsMenu';
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
  onUpdateAllTimeSettings?: (mode: 'test' | 'paes', time: number) => void;
  onUpdatePaesQuestions?: (subject: Subject, count: number) => void;
  onUpdateAllPaesQuestions?: (count: number) => void;
  onUpdateReadingTime?: (subject: Subject, time: number) => void;
  onUpdateAllReadingTime?: (time: number) => void;
  onUpdateReviewQuestions?: (subject: Subject, count: number) => void;
  onUpdateAllReviewQuestions?: (count: number) => void;
  showHomeButton?: boolean;
  onGoHome?: () => void;
}

export function Header({ 
  timeSettings, 
  onUpdateTimeSetting,
  onUpdateAllTimeSettings,
  onUpdatePaesQuestions,
  onUpdateAllPaesQuestions,
  onUpdateReadingTime,
  onUpdateAllReadingTime,
  onUpdateReviewQuestions,
  onUpdateAllReviewQuestions,
  showHomeButton = false,
  onGoHome
}: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, loading } = useAuth();
  const { isDark, toggleDark } = useTheme();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        // Si el error es que no hay sesión, igual consideramos exitoso el logout
        if (error.message?.includes('session missing') || error.name === 'AuthSessionMissingError') {
          // Limpiar cualquier token de supabase en localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
          toast.success('¡Hasta pronto!');
          window.location.reload();
        } else {
          console.error('Logout error:', error);
          toast.error('Error al cerrar sesión');
        }
      } else {
        toast.success('¡Hasta pronto!');
      }
    } catch (err: any) {
      console.error('Logout exception:', err);
      // Si es error de sesión faltante, tratar como éxito
      if (err?.message?.includes('session missing') || err?.name === 'AuthSessionMissingError') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        toast.success('¡Hasta pronto!');
        window.location.reload();
      } else {
        toast.error('Error al cerrar sesión');
      }
    }
  };

  const openModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Verificar si tenemos todas las props necesarias para mostrar el modal de configuración
  const canShowSettings = timeSettings && 
    onUpdateTimeSetting && 
    onUpdateAllTimeSettings &&
    onUpdatePaesQuestions && 
    onUpdateAllPaesQuestions &&
    onUpdateReadingTime && 
    onUpdateAllReadingTime &&
    onUpdateReviewQuestions &&
    onUpdateAllReviewQuestions;

  return (
    <>
      <header className="sticky top-0 z-50 py-4 px-6 bg-white dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Botón de Inicio */}
            {showHomeButton && onGoHome && (
              <button
                onClick={onGoHome}
                className="p-2 rounded-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title="Volver al inicio"
              >
                <Home className="h-5 w-5" />
              </button>
            )}
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <TutorPAESLogo size={40} color={isDark ? 'gradient' : 'gradient'} />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  TutorPAES
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tu preparación inteligente
                </p>
              </div>
            </div>
          </div>
          
          <nav>
            <ul className="flex space-x-1 items-center">
              {/* Botón Contenidos */}
              <li>
                <button
                  onClick={() => setShowContentModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Ver contenidos PAES"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Contenidos</span>
                </button>
              </li>

              {/* Settings Button */}
              {canShowSettings && (
                <li>
                  <SettingsButton onClick={() => setShowSettingsModal(true)} />
                </li>
              )}
              
              {loading ? (
                <li className="text-gray-400 text-sm">Cargando...</li>
              ) : user ? (
                <>
                  <li>
                    <button
                      onClick={() => setShowPerformanceModal(true)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <BarChart className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm font-medium">Mi Progreso</span>
                    </button>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-sm hidden md:inline text-gray-500 dark:text-gray-400">
                      ¡Hola, <span className="text-gray-900 dark:text-white font-medium">{user.user_metadata.name || 'Usuario'}</span>!
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => openModal('login')}
                      className="px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                    className="px-3 py-2 rounded-lg transition-colors font-medium text-sm border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Salir
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => openModal('register')}
                    className="px-3 py-2 rounded-lg font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Registrarse
                  </button>
                </li>
              )}

              {/* Separador visual */}
              <li className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              {/* Botón Dark/Light Mode */}
              <li>
                <button
                  onClick={toggleDark}
                  className="p-2 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  title={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} mode={authMode} />
      <PerformanceModal isOpen={showPerformanceModal} onClose={() => setShowPerformanceModal(false)} />
      <ContentModal isOpen={showContentModal} onClose={() => setShowContentModal(false)} />
      
      {canShowSettings && (
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)}
          settings={timeSettings}
          onUpdateSetting={onUpdateTimeSetting}
          onUpdateAllSettings={onUpdateAllTimeSettings}
          onUpdatePaesQuestions={onUpdatePaesQuestions}
          onUpdateAllPaesQuestions={onUpdateAllPaesQuestions}
          onUpdateReadingTime={onUpdateReadingTime}
          onUpdateAllReadingTime={onUpdateAllReadingTime}
          onUpdateReviewQuestions={onUpdateReviewQuestions}
          onUpdateAllReviewQuestions={onUpdateAllReviewQuestions}
        />
      )}
    </>
  );
}