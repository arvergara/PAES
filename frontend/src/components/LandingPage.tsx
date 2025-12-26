import { useState } from 'react';
import { 
  GraduationCap, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  BookOpen,
  Sparkles,
  Award
} from 'lucide-react';
import { AuthModal } from './AuthModal';

export function LandingPage() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });

  const openLogin = () => setAuthModal({ isOpen: true, mode: 'login' });
  const openRegister = () => setAuthModal({ isOpen: true, mode: 'register' });
  const closeModal = () => setAuthModal({ ...authModal, isOpen: false });

  const features = [
    { icon: Brain, title: 'Aprendizaje Adaptativo', description: 'El sistema aprende de tus respuestas y se adapta a tu nivel.' },
    { icon: Target, title: 'Preguntas Oficiales', description: 'Practica con preguntas de exámenes PAES reales.' },
    { icon: TrendingUp, title: 'Seguimiento de Progreso', description: 'Visualiza tu avance con estadísticas detalladas.' },
    { icon: Clock, title: 'Simulacros Cronometrados', description: 'Entrena bajo las mismas condiciones del examen real.' },
    { icon: BookOpen, title: 'Explicaciones Detalladas', description: 'Cada pregunta incluye una explicación completa.' },
    { icon: Sparkles, title: 'Textos de Lectura', description: 'Para Lenguaje, practica con los textos originales en PDF.' }
  ];

  const subjects = [
    { name: 'Matemática 1', color: 'from-blue-500 to-cyan-500' },
    { name: 'Matemática 2', color: 'from-purple-500 to-pink-500' },
    { name: 'Lenguaje', color: 'from-emerald-500 to-teal-500' },
    { name: 'Ciencias', color: 'from-orange-500 to-red-500' },
    { name: 'Historia', color: 'from-amber-500 to-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Tutor<span className="text-indigo-600 dark:text-indigo-400">PAES</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openLogin} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 font-medium transition-colors">
              Iniciar Sesión
            </button>
            <button onClick={openRegister} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all">
              Registrarse
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Preparación inteligente para la PAES 2025
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Domina la PAES con práctica
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> personalizada</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Miles de preguntas oficiales, explicaciones detalladas y seguimiento de tu progreso.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={openRegister} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Comenzar Gratis
            </button>
            <button onClick={openLogin} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all">
              Ya tengo cuenta
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">2000+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Preguntas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">5</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Materias</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">100%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Gratis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Preview */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center gap-3">
            {subjects.map((subject) => (
              <div key={subject.name} className={`px-5 py-2 bg-gradient-to-r ${subject.color} rounded-full text-white font-medium shadow-md`}>
                {subject.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitas para prepararte
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl">
            <Award className="w-16 h-16 text-white/90 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">¿Listo para mejorar tu puntaje?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">Únete ahora y comienza a practicar con preguntas reales</p>
            <button onClick={openRegister} className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              Crear Cuenta Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 TutorPAES. Preparación inteligente para tu futuro.</p>
        </div>
      </footer>

      <AuthModal isOpen={authModal.isOpen} onClose={closeModal} mode={authModal.mode} />
    </div>
  );
}