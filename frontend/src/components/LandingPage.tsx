import { useState } from 'react';
import { 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Clock, 
  BookOpen,
  Sparkles,
  Brain,
  Smartphone,
  FileText,
  Shield,
  ChevronDown
} from 'lucide-react';
import { AuthModal } from './AuthModal';

// Colores consistentes con el dashboard
const subjectColors = {
  matematica1: 'from-indigo-500 to-purple-600',
  matematica2: 'from-cyan-400 to-blue-500',
  lenguaje: 'from-pink-400 to-rose-500',
  ciencias: 'from-teal-400 to-green-500',
  historia: 'from-orange-400 to-yellow-500',
};

const subjects = [
  { id: 'matematica1', name: 'Matemática 1', subtitle: 'Álgebra y funciones', questions: 450, icon: '📐' },
  { id: 'matematica2', name: 'Matemática 2', subtitle: 'Geometría y probabilidad', questions: 380, icon: '📊' },
  { id: 'lenguaje', name: 'Lenguaje', subtitle: 'Comprensión lectora', questions: 420, icon: '📚' },
  { id: 'ciencias', name: 'Ciencias', subtitle: 'Biología, Química y Física', questions: 400, icon: '🔬' },
  { id: 'historia', name: 'Historia', subtitle: 'Historia y ciencias sociales', questions: 350, icon: '🏛️' },
];

const features = [
  {
    icon: Target,
    title: 'Preguntas Oficiales Reales',
    description: 'Practica con las mismas preguntas que han aparecido en PAES anteriores. No inventadas, no "estilo PAES". Las reales.'
  },
  {
    icon: Brain,
    title: 'Práctica Adaptativa',
    description: 'El sistema identifica tus puntos débiles y te muestra más preguntas de los temas que necesitas reforzar.'
  },
  {
    icon: TrendingUp,
    title: 'Mide tu Progreso',
    description: 'Simulacros cronometrados, estadísticas detalladas por tema, y seguimiento de tu avance real.'
  },
  {
    icon: BookOpen,
    title: 'Explicaciones Completas',
    description: 'Cada pregunta incluye el razonamiento paso a paso. Entiende el "por qué", no solo el "qué".'
  },
  {
    icon: Smartphone,
    title: 'Donde Quieras',
    description: 'Funciona en computador, tablet o celular. Practica en el metro, en tu casa, donde sea.'
  },
  {
    icon: FileText,
    title: 'Textos Originales',
    description: 'Para Lenguaje: los textos completos en PDF tal como aparecen en la prueba real.'
  }
];

const faqs = [
  {
    q: '¿Realmente son 30 días gratis?',
    a: 'Sí. Acceso completo a todas las funciones durante 30 días sin pagar nada. Ni siquiera te pedimos tarjeta de crédito para registrarte.'
  },
  {
    q: '¿Qué pasa después de los 30 días?',
    a: 'Si quieres seguir, activas tu suscripción por $25.000 mensuales. Si no, tu cuenta queda inactiva. Sin cargos sorpresa.'
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Absolutamente. Sin contratos ni permanencia mínima. Cancelas con un click y no se te cobra el siguiente mes.'
  },
  {
    q: '¿Las preguntas son realmente oficiales?',
    a: 'Sí. Trabajamos con preguntas de pruebas PAES ya rendidas. Son las reales, no inventadas.'
  },
  {
    q: '¿Incluye las 5 pruebas?',
    a: 'Todo incluido. Por $25.000/mes tienes Matemática 1, Matemática 2, Lenguaje, Ciencias e Historia.'
  }
];

const comparisonData = [
  { label: 'Precio mensual', values: ['$200.000 x materia', '$150.000 - $400.000', '$25.000'] },
  { label: 'Materias incluidas', values: ['1', 'Depende del plan', 'Las 5'] },
  { label: 'Preguntas oficiales', values: ['Depende', 'Algunas', '2.000+'] },
  { label: 'Disponibilidad', values: ['2-4 hrs/semana', 'Horario fijo', '24/7 ilimitada'] },
  { label: 'Explicación de cada pregunta', values: ['A veces', 'Algunas', 'Todas'] },
  { label: 'Costo anual (5 materias)', values: ['~$12.000.000', '~$2.400.000', '$300.000'] }
];

export function LandingPage() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const weeksUntilPAES = 48;

  const openLogin = () => setAuthModal({ isOpen: true, mode: 'login' });
  const openRegister = () => setAuthModal({ isOpen: true, mode: 'register' });
  const closeModal = () => setAuthModal({ ...authModal, isOpen: false });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Urgency Banner */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 text-center font-medium text-sm z-50">
        <Clock className="inline w-4 h-4 mr-2" />
        Quedan <strong>{weeksUntilPAES} semanas</strong> para la PAES 2026. Cada semana de práctica cuenta.
      </div>

      {/* Header */}
      <header className="fixed top-11 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Tutor<span className="text-indigo-600 dark:text-indigo-400">PAES</span>
              </span>
              <div className="text-xs text-gray-400 hidden sm:block">Tu preparación inteligente</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <a href="#como-funciona" className="px-4 py-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium transition-colors">
              Cómo funciona
            </a>
            <a href="#precios" className="px-4 py-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium transition-colors">
              Precios
            </a>
            <a href="#faq" className="px-4 py-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={openLogin} 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 font-medium transition-colors hidden sm:block"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={openRegister} 
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              Comenzar gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-4 lg:px-8 bg-white dark:bg-gray-900 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Preparación inteligente para la PAES 2026
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 tracking-tight">
            Un profesor particular cuesta<br/>
            <span className="relative inline-block text-red-500 text-5xl lg:text-6xl">
              $200.000
              <span className="absolute left-0 right-0 top-1/2 h-1 bg-red-500 -rotate-6"></span>
            </span> al mes.<br/>
            <span className="text-gray-400 text-2xl lg:text-3xl font-medium">Por una sola materia.</span>
          </h1>
          
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            TutorPAES te prepara para las <strong className="text-gray-900 dark:text-white">5 pruebas</strong> por solo{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold text-2xl lg:text-3xl">
              $25.000/mes
            </span>
            <br/>
            Preguntas oficiales, explicaciones paso a paso, y práctica que se adapta a ti.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button 
              onClick={openRegister}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              Prueba 30 días gratis →
            </button>
          </div>
          
          <p className="text-gray-400 text-sm">
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Subject Cards */}
      <section className="py-12 px-4 lg:px-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Las 5 pruebas. Todo incluido.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {subjects.slice(0, 3).map(subject => (
              <div
                key={subject.id}
                className={`bg-gradient-to-br ${subjectColors[subject.id as keyof typeof subjectColors]} rounded-2xl p-7 text-white cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all`}
              >
                <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center text-3xl mb-4">
                  {subject.icon}
                </div>
                <h3 className="text-2xl font-bold mb-1">{subject.name}</h3>
                <p className="opacity-90 text-sm">{subject.subtitle}</p>
                <p className="mt-3 text-sm opacity-80">{subject.questions}+ preguntas oficiales</p>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {subjects.slice(3).map(subject => (
              <div
                key={subject.id}
                className={`bg-gradient-to-br ${subjectColors[subject.id as keyof typeof subjectColors]} rounded-2xl p-7 text-white cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all`}
              >
                <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center text-3xl mb-4">
                  {subject.icon}
                </div>
                <h3 className="text-2xl font-bold mb-1">{subject.name}</h3>
                <p className="opacity-90 text-sm">{subject.subtitle}</p>
                <p className="mt-3 text-sm opacity-80">{subject.questions}+ preguntas oficiales</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="container mx-auto max-w-4xl flex flex-wrap justify-around gap-8 text-center text-white px-4">
          {[
            { number: '2.000+', label: 'Preguntas oficiales' },
            { number: '5', label: 'Pruebas completas' },
            { number: '24/7', label: 'Disponible siempre' },
            { number: '30', label: 'Días gratis' }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-extrabold">{stat.number}</div>
              <div className="opacity-80 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-indigo-950 py-20 px-4 lg:px-8">
        <div className="container mx-auto max-w-3xl text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 leading-tight">
            Prepararse para la PAES<br/>no debería costarte millones
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { price: '$150.000 - $400.000', label: 'Preuniversitario mensual' },
              { price: '$200.000 x materia', label: 'Profesor particular' },
              { price: '+$2.000.000', label: 'Preparación anual completa' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="text-2xl font-bold text-red-300">{item.price}</div>
                <div className="text-indigo-300 mt-2 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
          
          <p className="mt-12 text-lg text-indigo-200 leading-relaxed">
            Y aún así, muchos estudiantes no mejoran porque no pueden practicar a su ritmo,
            no tienen acceso a preguntas oficiales, y no saben cuáles son sus puntos débiles.
          </p>
          
          <p className="mt-6 text-2xl font-semibold">
            Tiene que haber una mejor forma.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 px-4 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitas.<br/>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Por el precio de una salida al cine.
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Por $25.000 al mes tienes acceso ilimitado a todo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 lg:px-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            Empieza a mejorar en 3 minutos
          </h2>
          
          <div className="flex flex-col md:flex-row gap-12 justify-center">
            {[
              { step: '1', title: 'Crea tu cuenta', desc: 'Solo necesitas un email. 30 segundos.' },
              { step: '2', title: 'Haz tu diagnóstico', desc: 'El sistema entiende tu nivel actual.' },
              { step: '3', title: 'Practica cada día', desc: '20-30 minutos. El sistema se adapta a ti.' }
            ].map((item, i) => (
              <div key={i} className="flex-1 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-5 text-white text-3xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="precios" className="py-20 px-4 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            La matemática es simple
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 lg:p-8 shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-2 font-bold text-gray-900 dark:text-white">
                <div></div>
                <div className="text-center text-sm">Profesor Particular</div>
                <div className="text-center text-sm">Preuniversitario</div>
                <div className="text-center text-sm bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-xl py-2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    TutorPAES
                  </span>
                </div>
              </div>
              
              {/* Rows */}
              {comparisonData.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 items-center">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{row.label}</div>
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">{row.values[0]}</div>
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">{row.values[1]}</div>
                  <div className="text-center font-semibold text-purple-600 dark:text-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl py-2 text-sm">
                    {row.values[2]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-center mt-8 text-lg text-gray-500 dark:text-gray-400">
            Con TutorPAES, tu preparación completa cuesta menos que <strong className="text-gray-900 dark:text-white">UN mes</strong> de preuniversitario.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-20 px-4 lg:px-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-md">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 text-white text-center shadow-2xl shadow-indigo-500/30">
            <div className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              Precio de lanzamiento
            </div>
            
            <h3 className="text-2xl font-medium mb-2">TutorPAES</h3>
            <div className="text-6xl font-extrabold">
              $25.000<span className="text-xl font-normal">/mes</span>
            </div>
            
            <div className="mt-8 text-left bg-white/10 rounded-2xl p-6 space-y-3">
              {[
                'Acceso a las 5 pruebas completas',
                'Más de 2.000 preguntas oficiales',
                'Explicaciones detalladas',
                'Simulacros cronometrados',
                'Seguimiento de progreso',
                'Textos de lectura originales',
                'Acceso desde cualquier dispositivo'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={openRegister}
              className="w-full mt-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              Empezar 30 días gratis
            </button>
            
            <p className="mt-4 text-sm opacity-80">
              Después, $25.000/mes. Cancela cuando quieras.
            </p>
          </div>
          
          <div className="flex justify-center gap-6 mt-6 text-gray-400 dark:text-gray-500 text-sm">
            <span>🔒 Pago seguro</span>
            <span>📧 Soporte por email</span>
            <span>❌ Sin contratos</span>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-16 px-4 lg:px-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="container mx-auto max-w-3xl text-center">
          <Shield className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Prueba sin riesgo. En serio.
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            Tienes <strong>30 días completos</strong> para explorar todo TutorPAES.
            Si no es para ti, simplemente no continúes. No te cobramos nada.
            No necesitas tarjeta para empezar. No hay letra chica.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 lg:px-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Preguntas frecuentes
          </h2>
          
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <button 
                  className="w-full px-6 py-5 text-left font-semibold flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-gray-900 dark:text-white"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-indigo-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-500 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
        <div className="container mx-auto max-w-2xl">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Tu futuro universitario<br/>empieza hoy
          </h2>
          <p className="text-xl opacity-90 mb-8">
            30 días gratis. $25.000/mes después. Acceso a todo.<br/>
            Sin excusas, sin riesgos.
          </p>
          <button
            onClick={openRegister}
            className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            Crear mi cuenta gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 text-indigo-300 py-12 px-4 lg:px-8">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">TutorPAES</span>
            </div>
            <p className="text-sm leading-relaxed">
              Preparación inteligente para la PAES.
              Practica con preguntas oficiales, mejora con explicaciones detalladas.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Producto</h4>
            <div className="space-y-2 text-sm">
              <a href="#como-funciona" className="block hover:text-white transition-colors">Cómo funciona</a>
              <a href="#precios" className="block hover:text-white transition-colors">Precios</a>
              <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-white transition-colors">Términos y condiciones</a>
              <a href="#" className="block hover:text-white transition-colors">Política de privacidad</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <div className="space-y-2 text-sm">
              <p>hola@tutorpaes.cl</p>
              <p>@tutorpaes</p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-5xl mt-12 pt-6 border-t border-white/10 text-center text-sm">
          © 2025 TutorPAES. Preparación inteligente para tu futuro.
        </div>
      </footer>

      <AuthModal isOpen={authModal.isOpen} onClose={closeModal} mode={authModal.mode} />
    </div>
  );
}
