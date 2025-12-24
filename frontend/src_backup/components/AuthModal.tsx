import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);

  if (!isOpen) return null;

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
          // Mensaje más descriptivo
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
          // Mensajes más descriptivos
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Registrarse'}
            {mode === 'reset' && 'Recuperar Contraseña'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                required
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Registrarse' : 'Enviar'}
            </button>

            <div className="text-sm text-center space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                  <div>
                    <span className="text-gray-600">¿No tienes cuenta? </span>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-indigo-600 hover:text-indigo-500"
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
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Volver a iniciar sesión
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
