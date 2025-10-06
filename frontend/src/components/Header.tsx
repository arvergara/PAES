import React, { useState } from 'react';
import { BookOpen, BarChart } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { PerformanceModal } from './PerformanceModal';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, loading } = useAuth();

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

  return (
    <>
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-2xl font-bold">TutorPAES</h1>
          </div>
          <nav>
            <ul className="flex space-x-6 items-center">
              {loading ? (
                <li>Cargando...</li>
              ) : user ? (
                <>
                  <li>
                    <button
                      onClick={() => setShowPerformanceModal(true)}
                      className="flex items-center space-x-2 hover:text-indigo-200 transition-colors"
                    >
                      <BarChart className="h-5 w-5" />
                      <span>Mi Progreso</span>
                    </button>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-4">¡Hola, {user.user_metadata.name || 'Usuario'}!</span>
                    <button
                      onClick={handleLogout}
                      className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => openModal('login')}
                      className="hover:text-indigo-200 transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openModal('register')}
                      className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Registrarse
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      <PerformanceModal
        isOpen={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
      />
    </>
  );
}