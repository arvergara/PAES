import React, { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

// Componente del ícono de Google
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'select' | 'email'>('select');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthMethod('select');
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, initialMode]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('Error de login:', error);
        toast.error('Error al iniciar sesión con Google');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast.success('Revisa tu email para restablecer tu contraseña');
        setMode('login');
      } else if (mode === 'register') {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: window.location.origin
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('Este email ya está registrado. Inicia sesión o recupera tu contraseña.');
          }
          throw signUpError;
        }

        if (data.user) {
          toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
          setMode('login');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Email o contraseña incorrectos');
          }
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Debes confirmar tu email antes de iniciar sesión');
          }
          throw signInError;
        }

        toast.success('¡Bienvenido de vuelta!');
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
      const message = error instanceof Error ? error.message : 'Ocurrió un error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de selección de método
  const renderMethodSelection = () => (
    <div className="space-y-4">
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Elige cómo quieres continuar
      </p>

      {/* Botón Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <GoogleIcon className="w-5 h-5" />
        <span className="font-medium text-gray-700 dark:text-gray-200">
          Continuar con Google
        </span>
      </button>

      {/* Separador */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            o
          </span>
        </div>
      </div>

      {/* Botón Email */}
      <button
        onClick={() => setAuthMethod('email')}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <Mail className="w-5 h-5" />
        <span className="font-medium">
          Continuar con Email
        </span>
      </button>

      {/* Toggle login/register */}
      <div className="text-center text-sm mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {mode === 'login' ? (
          <p className="text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => setMode('register')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
            >
              Regístrate
            </button>
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
            >
              Inicia sesión
            </button>
          </p>
        )}
      </div>
    </div>
  );

  // Formulario de email
  const renderEmailForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Botón volver */}
      <button
        type="button"
        onClick={() => setAuthMethod('select')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
      >
        ← Volver
      </button>

      {mode === 'register' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2.5 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2.5 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      {mode !== 'reset' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2.5 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
            minLength={6}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Registrarse' : 'Enviar'}
      </button>

      <div className="text-sm text-center space-y-2">
        {mode === 'login' && (
          <>
            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div>
              <span className="text-gray-600 dark:text-gray-400">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                Regístrate
              </button>
            </div>
          </>
        )}
        {(mode === 'register' || mode === 'reset') && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            Volver a iniciar sesión
          </button>
        )}
      </div>
    </form>
  );

  const getTitle = () => {
    if (authMethod === 'select') {
      return mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
    }
    if (mode === 'login') return 'Iniciar con Email';
    if (mode === 'register') return 'Registrarse con Email';
    return 'Recuperar Contraseña';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            {getTitle()}
          </h2>

          {authMethod === 'select' ? renderMethodSelection() : renderEmailForm()}
        </div>
      </div>
    </div>
  );
}