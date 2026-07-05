import { useState, useEffect, FormEvent } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { BookOpen, FlaskConical, Atom, Leaf, Target, AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { SubjectCard } from './components/SubjectCard';
import { ModeSelector } from './components/ModeSelector';
import { TestMode } from './components/TestMode';
import { ReadingTestMode } from './components/ReadingTestMode';
import { PAESMode } from './components/PAESMode';
import { ReviewMode } from './components/ReviewMode';
import { StrengthsModal } from './components/StrengthsModal';
import { useTimeSettings } from './components/SettingsMenu';
import { useTheme } from './contexts/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { AdminReportsPanel } from './components/AdminReportsPanel';
import { useAuth } from './hooks/useAuth';
import { TopBannersSection } from './components/TopBannersSection';
import type { Subject, PracticeMode } from './types';

type AppState = 'subject' | 'science-specialty' | 'mode' | 'practice' | 'admin';
type ScienceSpecialty = 'CF' | 'CQ' | 'CB';

const subjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H'];

const scienceSpecialties = [
  { code: 'CF' as ScienceSpecialty, name: 'Física', icon: Atom, description: 'Mecánica, ondas, electricidad y más', color: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-500/20', borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500/50', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-200 dark:border-cyan-500/30' },
  { code: 'CQ' as ScienceSpecialty, name: 'Química', icon: FlaskConical, description: 'Reacciones, estequiometría y química orgánica', color: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-500/20', borderHover: 'hover:border-purple-400 dark:hover:border-purple-500/50', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-200 dark:border-purple-500/30' },
  { code: 'CB' as ScienceSpecialty, name: 'Biología', icon: Leaf, description: 'Célula, genética, evolución y ecología', color: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-500/20', borderHover: 'hover:border-green-400 dark:hover:border-green-500/50', bgColor: 'bg-green-50 dark:bg-green-500/10', borderColor: 'border-green-200 dark:border-green-500/30' },
];

// Interfaz para sesión guardada
interface SavedSession {
  subject: Subject;
  mode: PracticeMode;
  questionIndex: number;
  timeRemaining: number;
  totalQuestions: number;
  timestamp: number;
  questionIds?: string[];
  answers?: Record<number, string>;
  userId?: string; // Nuevo: identificador del usuario
}

function NewPasswordModal({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('¡Contraseña actualizada! Ya puedes ingresar.');
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Nueva contraseña
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Elige una contraseña segura para tu cuenta
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              minLength={6}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-2"
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const { user, loading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <>
        <Toaster position="top-center" />
        <NewPasswordModal onComplete={() => setIsPasswordRecovery(false)} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <LandingPage />
      </>
    );
  }

  return <AuthenticatedApp userId={user.id} />;
}

// Nuevo: AuthenticatedApp recibe userId como prop
interface AuthenticatedAppProps {
  userId: string;
}

function AuthenticatedApp({ userId }: AuthenticatedAppProps) {
  const [state, setState] = useState<AppState>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [resumeData, setResumeData] = useState<SavedSession | null>(null);
  const [showStrengthsModal, setShowStrengthsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubject, setPendingSubject] = useState<Subject | null>(null);
  const { theme } = useTheme();
  const { 
    settings: timeSettings, 
    updateSetting,
    updateAllSettings,
    updatePaesQuestions,
    updateAllPaesQuestions,
    updateReadingTime,
    updateAllReadingTime,
    updateReviewQuestions,
    updateAllReviewQuestions,
    getTimeForSubject, 
    getPaesQuestionsForSubject,
    getReadingTimeForSubject,
    getReviewQuestionsForSubject
  } = useTimeSettings();

  // Escuchar evento openStrengths
  useEffect(() => {
    const handleOpenStrengths = () => setShowStrengthsModal(true);
    window.addEventListener('openStrengths', handleOpenStrengths);
    return () => window.removeEventListener('openStrengths', handleOpenStrengths);
  }, []);

  // Escuchar evento openAdmin (panel de reportes, solo admins)
  useEffect(() => {
    const handleOpenAdmin = () => setState('admin');
    window.addEventListener('openAdmin', handleOpenAdmin);
    return () => window.removeEventListener('openAdmin', handleOpenAdmin);
  }, []);

  // Helper para obtener la sesión guardada válida
  const getSavedSession = (): SavedSession | null => {
    const sessionData = localStorage.getItem('lastPracticeSession');
    if (!sessionData) return null;
    
    try {
      const session: SavedSession = JSON.parse(sessionData);
      const hoursSinceSession = (Date.now() - session.timestamp) / (1000 * 60 * 60);
      
      // Verificar que pertenece al usuario actual y no ha expirado
      if (session.userId && session.userId !== userId) return null;
      if (hoursSinceSession >= 72 || session.timeRemaining <= 0) {
        localStorage.removeItem('lastPracticeSession');
        return null;
      }
      
      return session;
    } catch {
      localStorage.removeItem('lastPracticeSession');
      return null;
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    const savedSession = getSavedSession();
    
    if (savedSession) {
      // Si es la misma materia, ir directo a continuar
      if (savedSession.subject === subject) {
        handleContinueSession(subject, savedSession.mode, savedSession.questionIndex, savedSession.timeRemaining);
        return;
      }
      
      // Si es diferente materia, mostrar confirmación
      setPendingSubject(subject);
      setShowConfirmModal(true);
      return;
    }
    
    // No hay sesión guardada, proceder normal
    setSelectedSubject(subject);
    setResumeData(null);
    if (subject === 'C') {
      setState('science-specialty');
    } else {
      setState('mode');
    }
  };

  // Confirmar cambio de materia (perder progreso)
  const handleConfirmChangeSubject = () => {
    localStorage.removeItem('lastPracticeSession');
    setShowConfirmModal(false);
    
    if (pendingSubject) {
      setSelectedSubject(pendingSubject);
      setResumeData(null);
      if (pendingSubject === 'C') {
        setState('science-specialty');
      } else {
        setState('mode');
      }
      setPendingSubject(null);
    }
  };

  const handleCancelChangeSubject = () => {
    setShowConfirmModal(false);
    setPendingSubject(null);
  };

  const handleScienceSpecialtySelect = (specialty: ScienceSpecialty) => {
    setSelectedSubject(specialty);
    setResumeData(null);
    setState('mode');
  };

  const handleModeSelect = (mode: PracticeMode) => {
    setSelectedMode(mode);
    setState('practice');
  };

  const handleExit = () => {
    setState('subject');
    setSelectedSubject(null);
    setSelectedMode(null);
    setResumeData(null);
  };

  const handleBackToSubjects = () => {
    setState('subject');
    setSelectedSubject(null);
  };

  const handleBackToSpecialty = () => {
    setState('science-specialty');
    setSelectedSubject('C');
  };

  // Handler para continuar sesión desde ContinueButton o SubjectCard
  const handleContinueSession = (subject: Subject, mode: PracticeMode, questionIndex?: number, timeRemaining?: number) => {
    const sessionData = localStorage.getItem('lastPracticeSession');
    if (sessionData) {
      const session: SavedSession = JSON.parse(sessionData);
      // Verificar que la sesión pertenece al usuario actual (o no tiene userId - sesión antigua)
      if (!session.userId || session.userId === userId) {
        setResumeData(session);
      }
    }
    setSelectedSubject(subject);
    setSelectedMode(mode);
    setState('practice');
  };

  // Handler para guardar sesión cuando el usuario sale de TestMode
  const handleSessionChange = (session: any | null) => {
    if (session) {
      const savedSession: SavedSession = {
        subject: session.subject,
        mode: session.mode,
        questionIndex: session.currentQuestionIndex + 1,
        timeRemaining: session.timeRemaining,
        totalQuestions: session.totalQuestions,
        timestamp: Date.now(),
        questionIds: session.questionIds,
        answers: session.answers,
        userId: userId, // Nuevo: guardar el userId con la sesión
      };
      localStorage.setItem('lastPracticeSession', JSON.stringify(savedSession));
    } else {
      localStorage.removeItem('lastPracticeSession');
    }
  };

  const renderContent = () => {
    if (state === 'admin') {
      return <AdminReportsPanel onExit={handleExit} />;
    }

    if (state === 'practice' && selectedSubject && selectedMode) {
      const configSubject = ['CF', 'CQ', 'CB'].includes(selectedSubject) ? 'C' : selectedSubject;
      const testTime = getTimeForSubject('test', configSubject as Subject);
      const paesTime = getTimeForSubject('paes', configSubject as Subject);
      const paesQuestions = getPaesQuestionsForSubject(configSubject as Subject);
      const readingTime = getReadingTimeForSubject(configSubject as Subject);
      const reviewQuestions = getReviewQuestionsForSubject(configSubject as Subject);
      
      if (selectedMode === 'PAES') {
        return (
          <PAESMode 
            subject={selectedSubject} 
            onExit={handleExit} 
            timePerQuestion={paesTime}
            questionCount={paesQuestions}
            onSessionChange={handleSessionChange}
          />
        );
      }
      if (selectedMode === 'REVIEW') {
        const resumeSessionReview = resumeData && resumeData.subject === selectedSubject && resumeData.mode === 'REVIEW' ? {
          subject: resumeData.subject,
          mode: 'REVIEW' as const,
          currentQuestionIndex: resumeData.questionIndex - 1,
          questionIds: resumeData.questionIds || [],
          answers: resumeData.answers || {},
          totalQuestions: resumeData.totalQuestions,
        } : undefined;
        
        return (
          <ReviewMode 
            subject={selectedSubject} 
            onExit={handleExit}
            questionCount={reviewQuestions}
            onSessionChange={handleSessionChange}
            resumeSession={resumeSessionReview}
          />
        );
      }
      if (selectedSubject === 'L') {
        const resumeSessionL = resumeData && resumeData.subject === 'L' ? {
          subject: resumeData.subject,
          mode: resumeData.mode as 'TEST',
          currentQuestionIndex: resumeData.questionIndex - 1,
          timeRemaining: resumeData.timeRemaining,
          answers: resumeData.answers || {},
          questionIds: resumeData.questionIds || [],
          startTime: Date.now(),
          totalQuestions: resumeData.totalQuestions,
          pausedAt: resumeData.timestamp,
          subjectLabel: 'L' as Subject,
        } : undefined;
        
        return (
          <ReadingTestMode 
            subject={selectedSubject} 
            onExit={handleExit} 
            timePerQuestion={testTime}
            readingTime={readingTime}
            resumeSession={resumeSessionL}
            onSessionChange={handleSessionChange}
          />
        );
      }
      
      const resumeSession = resumeData && resumeData.subject === selectedSubject ? {
        subject: resumeData.subject,
        mode: resumeData.mode as 'TEST',
        currentQuestionIndex: resumeData.questionIndex - 1,
        timeRemaining: resumeData.timeRemaining,
        answers: resumeData.answers || {},
        questionIds: resumeData.questionIds || [],
        startTime: Date.now(),
        totalQuestions: resumeData.totalQuestions,
        pausedAt: resumeData.timestamp,
        subjectLabel: selectedSubject,
      } : undefined;
      
      return (
        <TestMode 
          subject={selectedSubject} 
          onExit={handleExit} 
          timePerQuestion={testTime}
          resumeSession={resumeSession}
          onSessionChange={handleSessionChange}
        />
      );
    }

    if (state === 'science-specialty') {
      return (
        <div>
          <button
            onClick={handleBackToSubjects}
            className="mb-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm font-medium"
          >
            ← Volver a materias
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Ciencias</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-sm">Selecciona tu especialidad</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {scienceSpecialties.map((specialty) => {
              const Icon = specialty.icon;
              return (
                <button
                  key={specialty.code}
                  onClick={() => handleScienceSpecialtySelect(specialty.code)}
                  className={`group text-left ${specialty.bgColor} rounded-2xl border ${specialty.borderColor} ${specialty.borderHover} shadow-sm hover:shadow-lg transition-all duration-300 p-6`}
                >
                  <div className={`inline-flex p-3 ${specialty.iconBg} rounded-xl mb-4`}>
                    <Icon className={`w-6 h-6 ${specialty.color}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${specialty.color} mb-1`}>{specialty.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{specialty.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (state === 'mode' && selectedSubject) {
      const isScienceSpecialty = ['CF', 'CQ', 'CB'].includes(selectedSubject);
      return (
        <div>
          <button
            onClick={isScienceSpecialty ? handleBackToSpecialty : handleBackToSubjects}
            className="mb-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm font-medium"
          >
            ← Volver a {isScienceSpecialty ? 'especialidades' : 'materias'}
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Selecciona un modo de práctica</h2>
          <ModeSelector onSelect={handleModeSelect} />
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Selecciona una materia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {subjects.map((subject) => (
            <SubjectCard key={subject} subject={subject} onSelect={handleSubjectSelect} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster position="top-center" />
      <Header 
        timeSettings={timeSettings} 
        onUpdateTimeSetting={updateSetting}
        onUpdateAllTimeSettings={updateAllSettings}
        onUpdatePaesQuestions={updatePaesQuestions}
        onUpdateAllPaesQuestions={updateAllPaesQuestions}
        onUpdateReadingTime={updateReadingTime}
        onUpdateAllReadingTime={updateAllReadingTime}
        onUpdateReviewQuestions={updateReviewQuestions}
        onUpdateAllReviewQuestions={updateAllReviewQuestions}
        showHomeButton={state !== 'subject'}
        onGoHome={handleExit}
        isInExam={state === 'practice'}
      />
      <main className="container mx-auto px-4 py-8">
        {state === 'subject' && (
          <TopBannersSection onContinue={handleContinueSession} userId={userId} />
        )}
        {renderContent()}
        
        {state === 'subject' && (
          <div className="max-w-5xl mx-auto mt-8">
            <button 
              onClick={() => setShowStrengthsModal(true)} 
              className="w-full flex items-center justify-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-500/20 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="font-semibold text-rose-700 dark:text-rose-300 group-hover:text-rose-800 dark:group-hover:text-rose-200 transition-colors">¿Qué materias debo reforzar?</span>
            </button>
          </div>
        )}
      </main>

      {state !== 'practice' && (
        <a
          href="/resumenes.html"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">Resúmenes PAES</span>
        </a>
      )}

      {/* Modal de análisis de fortalezas */}
      <StrengthsModal 
        isOpen={showStrengthsModal}
        onClose={() => setShowStrengthsModal(false)}
        onSelectSubject={handleSubjectSelect}
      />

      {/* Modal de confirmación para cambiar de materia */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelChangeSubject} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Cambiar de materia?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tienes una sesión en progreso
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Perderás tu progreso en <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {(() => {
                    const session = getSavedSession();
                    if (!session) return '';
                    const names: Record<string, string> = {
                      M1: 'Matemática 1', M2: 'Matemática 2', L: 'Lenguaje',
                      H: 'Historia', C: 'Ciencias', CF: 'Física', CQ: 'Química', CB: 'Biología'
                    };
                    return names[session.subject] || session.subject;
                  })()}
                </span>. ¿Estás seguro?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelChangeSubject}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmChangeSubject}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
                >
                  Sí, cambiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;