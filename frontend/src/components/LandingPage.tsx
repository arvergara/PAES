import { useState } from 'react';
import { BookOpen, Calculator, Languages, FlaskConical, Clock, Check, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthModal } from './AuthModal';

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const daysUntilPAES = Math.ceil((new Date('2026-11-24').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const subjects = [
    { name: 'Matemática 1', description: 'Álgebra y funciones', icon: Calculator, questions: 156, color: 'blue' },
    { name: 'Matemática 2', description: 'Geometría y probabilidad', icon: Calculator, questions: 89, color: 'violet' },
    { name: 'Lenguaje', description: 'Comprensión lectora', icon: Languages, questions: 35, color: 'rose' },
    { name: 'Ciencias', description: 'Biología, Química y Física', icon: FlaskConical, questions: 124, color: 'emerald' },
    { name: 'Historia', description: 'Historia y ciencias sociales', icon: Clock, questions: 23, color: 'amber' },
  ];

  const faqs = [
    { q: '¿Realmente son 30 días gratis?', a: 'Sí. Acceso completo a todas las funciones durante 30 días sin pagar nada. Ni siquiera te pedimos tarjeta de crédito para registrarte.' },
    { q: '¿Qué pasa después de los 30 días?', a: 'Si quieres seguir, activas tu suscripción por $25.000 mensuales. Si no, tu cuenta queda inactiva. Sin cargos sorpresa.' },
    { q: '¿Puedo cancelar cuando quiera?', a: 'Absolutamente. Sin contratos ni permanencia mínima. Cancelas con un click y no se te cobra el siguiente mes.' },
    { q: '¿Las preguntas son realmente oficiales?', a: 'Sí. Trabajamos con preguntas de pruebas PAES ya rendidas. Son las reales, no inventadas.' },
    { q: '¿Incluye las 5 pruebas?', a: 'Todo incluido. Por $25.000/mes tienes Matemática 1, Matemática 2, Lenguaje, Ciencias e Historia.' },
  ];

  const colorClasses: Record<string, { card: string; icon: string; badge: string; text: string; desc: string }> = {
    blue: {
      card: 'from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-400/50',
      icon: 'bg-blue-500/20 text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300',
      text: 'text-blue-100',
      desc: 'text-blue-300/80'
    },
    violet: {
      card: 'from-violet-500/20 via-violet-500/10 to-transparent border-violet-500/30 hover:border-violet-400/50',
      icon: 'bg-violet-500/20 text-violet-400',
      badge: 'bg-violet-500/20 text-violet-300',
      text: 'text-violet-100',
      desc: 'text-violet-300/80'
    },
    rose: {
      card: 'from-rose-500/20 via-rose-500/10 to-transparent border-rose-500/30 hover:border-rose-400/50',
      icon: 'bg-rose-500/20 text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300',
      text: 'text-rose-100',
      desc: 'text-rose-300/80'
    },
    emerald: {
      card: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-400/50',
      icon: 'bg-emerald-500/20 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
      text: 'text-emerald-100',
      desc: 'text-emerald-300/80'
    },
    amber: {
      card: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30 hover:border-amber-400/50',
      icon: 'bg-amber-500/20 text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
      text: 'text-amber-100',
      desc: 'text-amber-300/80'
    },
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white overflow-x-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] bg-cyan-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Urgency Banner */}
      <div className="relative bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600 py-3 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        <span className="relative text-sm font-bold">
          🔥 Quedan <span className="text-yellow-300">{daysUntilPAES} días</span> para la PAES 2026 · 
          <button onClick={handleRegister} className="underline cursor-pointer hover:text-yellow-200 transition-colors ml-1">
            ¡Comienza gratis hoy!
          </button>
        </span>
      </div>

      {/* Navbar */}
      <nav className="relative bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 rounded-2xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight">TutorPAES</div>
              <div className="text-xs text-gray-400">Tu preparación inteligente</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="#materias" className="hidden md:block text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
              Materias
            </a>
            <a href="#comparacion" className="hidden md:block text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
              Comparar
            </a>
            <a href="#precio" className="hidden md:block text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
              Precio
            </a>
            <button
              onClick={handleLogin}
              className="ml-2 md:ml-4 px-4 md:px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Iniciar sesión
            </button>
            <button
              onClick={handleRegister}
              className="hidden md:flex px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105"
            >
              Comenzar gratis →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-6" style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 0%, rgba(20, 184, 166, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
          linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)
        `
      }}>
        {/* Grid background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full mb-8">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-sm font-medium text-gray-200">+2,500 preguntas oficiales PAES</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6">
                Prepara tu{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  PAES
                </span>
                <br />
                con preguntas{' '}
                <span className="relative">
                  <span className="relative z-10">reales</span>
                  <span className="absolute bottom-2 left-0 right-0 h-4 bg-gradient-to-r from-cyan-500/40 to-teal-500/40 -skew-x-6" />
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                Practica con las mismas preguntas de pruebas oficiales. 
                Sin trucos, sin invenciones. Solo práctica real.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleRegister}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Comenzar gratis
                </button>
                <a
                  href="#materias"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold rounded-2xl transition-all text-center"
                >
                  Ver materias
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>30 días gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>

            {/* Right - Subject Cards Preview */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {subjects.slice(0, 4).map((subject, index) => {
                  const Icon = subject.icon;
                  const colors = colorClasses[subject.color];
                  return (
                    <div
                      key={subject.name}
                      className={`bg-gradient-to-br ${colors.card} backdrop-blur-sm border rounded-2xl p-5 transform hover:scale-105 transition-all duration-300`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`inline-flex p-3 ${colors.icon} rounded-xl mb-3`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={`font-bold ${colors.text} mb-1`}>{subject.name}</h3>
                      <p className={`text-sm ${colors.desc}`}>{subject.questions} preguntas</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="materias" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">5 pruebas completas</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Todo lo que necesitas para la PAES en un solo lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              const colors = colorClasses[subject.color];
              return (
                <div
                  key={subject.name}
                  className={`group bg-gradient-to-br ${colors.card} backdrop-blur-sm border rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
                  onClick={handleRegister}
                >
                  <div className={`inline-flex p-4 ${colors.icon} rounded-2xl mb-6`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className={`inline-flex px-3 py-1 ${colors.badge} rounded-full text-xs font-bold mb-4`}>
                    {subject.questions} preguntas
                  </div>
                  <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>{subject.name}</h3>
                  <p className={`${colors.desc}`}>{subject.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparacion" className="relative py-24 px-6 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">¿Por qué TutorPAES?</h2>
            <p className="text-xl text-gray-400">Comparado con otras opciones</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-6 text-left text-gray-400 font-medium"></th>
                  <th className="p-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-full">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      <span className="font-bold text-cyan-300">TutorPAES</span>
                    </div>
                  </th>
                  <th className="p-6 text-center text-gray-400">Preu tradicional</th>
                  <th className="p-6 text-center text-gray-400">Estudiar solo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Preguntas oficiales', us: true, preu: false, solo: false },
                  { feature: 'Práctica ilimitada', us: true, preu: false, solo: true },
                  { feature: 'Explicaciones detalladas', us: true, preu: true, solo: false },
                  { feature: 'Seguimiento de progreso', us: true, preu: true, solo: false },
                  { feature: 'Precio accesible', us: true, preu: false, solo: true },
                  { feature: 'A tu ritmo', us: true, preu: false, solo: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6 font-medium">{row.feature}</td>
                    <td className="p-6 text-center">
                      {row.us ? (
                        <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {row.preu ? (
                        <Check className="w-6 h-6 text-gray-400 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {row.solo ? (
                        <Check className="w-6 h-6 text-gray-400 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '2,500+', label: 'preguntas oficiales', color: 'text-cyan-400' },
              { value: '5', label: 'pruebas completas', color: 'text-teal-400' },
              { value: '∞', label: 'práctica ilimitada', color: 'text-teal-400' },
              { value: '100%', label: 'preguntas oficiales', color: 'text-cyan-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="precio" className="relative py-24 px-6 bg-black/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Compara y decide</h2>
            <p className="text-xl text-gray-400">La preparación PAES más accesible de Chile</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Preuniversitario */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600/50 rounded-3xl p-8 flex flex-col">
              {/* Header */}
              <div className="text-center mb-8">
                <span className="inline-block px-5 py-2 bg-slate-700 text-slate-200 rounded-full text-sm font-semibold">
                  Preuniversitario Tradicional
                </span>
              </div>
              
              {/* Precio mensual */}
              <div className="text-center mb-8">
                <p className="text-slate-400 text-sm mb-2">Precio mensual</p>
                <span className="text-4xl md:text-5xl font-black text-white">$150.000 - $400.000</span>
              </div>

              {/* Características */}
              <div className="space-y-4 mb-8 flex-grow">
                {[
                  { text: 'Horarios fijos', ok: false },
                  { text: 'Clases presenciales', ok: true },
                  { text: 'Material no oficial', ok: false },
                  { text: 'Grupos de 20-40 alumnos', ok: false },
                  { text: 'Requiere matrícula extra', ok: false },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-slate-600' : 'bg-slate-700/60'}`}>
                      {item.ok ? <Check className="w-3.5 h-3.5 text-white" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <span className="text-slate-300 text-base">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Precio anual */}
              <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700/50">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Costo anual estimado</p>
                <span className="text-4xl font-black text-white">$1.800.000</span>
                <p className="text-slate-500 text-sm mt-2">+ matrícula adicional</p>
              </div>
            </div>

            {/* TutorPAES */}
            <div className="relative flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-[28px] opacity-50 blur-lg" />
              
              <div className="relative bg-gradient-to-b from-[#0a2535] to-[#061a25] border border-cyan-500/50 rounded-3xl p-8 flex flex-col flex-grow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-t-3xl" />
                
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                    <span className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25">
                      ★ TutorPAES
                    </span>
                    <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-full text-sm font-bold">
                      30 días gratis
                    </span>
                  </div>
                </div>
                
                {/* Precio mensual */}
                <div className="text-center mb-8">
                  <p className="text-cyan-300/70 text-sm mb-2">Precio mensual</p>
                  <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">$25.000</span>
                </div>

                {/* Características */}
                <div className="space-y-4 mb-8 flex-grow">
                  {[
                    'Practica cuando quieras',
                    '5 pruebas completas',
                    'Preguntas 100% oficiales',
                    'Explicaciones paso a paso',
                    'Sin matrícula ni contratos',
                  ].map((text) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-gray-100 text-base">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Precio anual */}
                <div className="bg-cyan-950/50 rounded-2xl p-6 text-center border border-cyan-500/30">
                  <p className="text-cyan-400/70 text-xs uppercase tracking-wider mb-2">Costo anual</p>
                  <span className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">$300.000</span>
                  <p className="text-cyan-400/60 text-sm mt-2">Todo incluido</p>
                </div>
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <span className="text-4xl">💰</span>
              <div className="text-left">
                <div className="text-emerald-400 font-black text-xl">Ahorra $1.500.000 al año</div>
                <div className="text-gray-400 text-sm">vs un preuniversitario tradicional</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Preguntas frecuentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-400 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6 overflow-hidden" style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 0%, rgba(20, 184, 166, 0.3) 0%, transparent 50%),
          linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)
        `
      }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-600/30 via-teal-600/30 to-cyan-600/30 rounded-full blur-[150px] animate-pulse" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-8xl mb-8">🎓</div>
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Tu futuro universitario<br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              empieza hoy
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            30 días gratis. $25.000/mes después.<br />
            Acceso completo a las 5 pruebas.
          </p>
          <button
            onClick={handleRegister}
            className="px-12 py-6 bg-white text-gray-900 font-black text-xl rounded-2xl shadow-2xl hover:scale-105 transition-transform"
          >
            Crear mi cuenta gratis →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">TutorPAES</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="mailto:hola@tutorpaes.cl" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-500">
          © 2025 TutorPAES. Preparación inteligente para tu futuro.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </div>
  );
}