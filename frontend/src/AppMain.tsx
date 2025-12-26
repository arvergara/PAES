import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BookOpen, FlaskConical, Atom, Leaf } from 'lucide-react';
import { Header } from './components/Header';
import { SubjectCard } from './components/SubjectCard';
import { ModeSelector } from './components/ModeSelector';
import { TestMode } from './components/TestMode';
import { ReadingTestMode } from './components/ReadingTestMode';
import { PAESMode } from './components/PAESMode';
import { ReviewMode } from './components/ReviewMode';
import { useTimeSettings } from './components/SettingsMenu';
import { useTheme } from './contexts/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './hooks/useAuth';
import type { Subject, PracticeMode } from './types';

type AppState = 'subject' | 'science-specialty' | 'mode' | 'practice';
type ScienceSpecialty = 'CF' | 'CQ' | 'CB';

const subjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H'];

const classicSpecialtyStyles = [
  { gradient: 'from-cyan-400 to-blue-600', hover: 'hover:from-cyan-500 hover:to-blue-700' },
  { gradient: 'from-purple-400 to-pink-600', hover: 'hover:from-purple-500 hover:to-pink-700' },
  { gradient: 'from-green-400 to-emerald-600', hover: 'hover:from-green-500 hover:to-emerald-700' },
];

const specialtyIntensities = [2, 5, 7];

const themeSpecialtyGradients: Record<string, Record<number, { gradient: string; hover: string }>> = {
  indigo: {
    2: { gradient: 'from-indigo-400 to-indigo-500', hover: 'hover:from-indigo-500 hover:to-indigo-600' },
    5: { gradient: 'from-indigo-600 to-purple-700', hover: 'hover:from-indigo-700 hover:to-purple-800' },
    7: { gradient: 'from-indigo-700 to-purple-800', hover: 'hover:from-indigo-800 hover:to-purple-900' },
  },
  slate: {
    2: { gradient: 'from-slate-400 to-slate-500', hover: 'hover:from-slate-500 hover:to-slate-600' },
    5: { gradient: 'from-slate-600 to-gray-700', hover: 'hover:from-slate-700 hover:to-gray-800' },
    7: { gradient: 'from-slate-700 to-gray-800', hover: 'hover:from-slate-800 hover:to-gray-900' },
  },
  rose: {
    2: { gradient: 'from-rose-400 to-rose-500', hover: 'hover:from-rose-500 hover:to-rose-600' },
    5: { gradient: 'from-rose-600 to-pink-700', hover: 'hover:from-rose-700 hover:to-pink-800' },
    7: { gradient: 'from-rose-700 to-pink-800', hover: 'hover:from-rose-800 hover:to-pink-900' },
  },
  emerald: {
    2: { gradient: 'from-emerald-400 to-emerald-500', hover: 'hover:from-emerald-500 hover:to-emerald-600' },
    5: { gradient: 'from-emerald-600 to-teal-700', hover: 'hover:from-emerald-700 hover:to-teal-800' },
    7: { gradient: 'from-emerald-700 to-teal-800', hover: 'hover:from-emerald-800 hover:to-teal-900' },
  },
  amber: {
    2: { gradient: 'from-amber-400 to-amber-500', hover: 'hover:from-amber-500 hover:to-amber-600' },
    5: { gradient: 'from-amber-600 to-orange-700', hover: 'hover:from-amber-700 hover:to-orange-800' },
    7: { gradient: 'from-amber-700 to-orange-800', hover: 'hover:from-amber-800 hover:to-orange-900' },
  },
  purple: {
    2: { gradient: 'from-purple-400 to-purple-500', hover: 'hover:from-purple-500 hover:to-purple-600' },
    5: { gradient: 'from-purple-600 to-fuchsia-700', hover: 'hover:from-purple-700 hover:to-fuchsia-800' },
    7: { gradient: 'from-purple-700 to-fuchsia-800', hover: 'hover:from-purple-800 hover:to-fuchsia-900' },
  },
  ocean: {
    2: { gradient: 'from-cyan-400 to-cyan-500', hover: 'hover:from-cyan-500 hover:to-cyan-600' },
    5: { gradient: 'from-cyan-600 to-blue-700', hover: 'hover:from-cyan-700 hover:to-blue-800' },
    7: { gradient: 'from-cyan-700 to-blue-800', hover: 'hover:from-cyan-800 hover:to-blue-900' },
  },
};

const getSpecialtyStyles = (theme: string, index: number) => {
  if (theme === 'classic') {
    return classicSpecialtyStyles[index];
  }
  const intensity = specialtyIntensities[index];
  const themeStyles = themeSpecialtyGradients[theme] || themeSpecialtyGradients.indigo;
  return themeStyles[intensity] || themeStyles[5];
};

const scienceSpecialties = [
  { code: 'CF' as ScienceSpecialty, name: 'Fisica', icon: Atom, description: 'Mecanica, ondas, electricidad y mas' },
  { code: 'CQ' as ScienceSpecialty, name: 'Quimica', icon: FlaskConical, description: 'Reacciones, estequiometria y quimica organica' },
  { code: 'CB' as ScienceSpecialty, name: 'Biologia', icon: Leaf, description: 'Celula, genetica, evolucion y ecologia' },
];

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
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

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [state, setState] = useState<AppState>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const { theme } = useTheme();
  const { 
    settings: timeSettings, 
    updateSetting, 
    updatePaesQuestions, 
    updateReadingTime,
    updateReviewQuestions,
    getTimeForSubject, 
    getPaesQuestionsForSubject,
    getReadingTimeForSubject,
    getReviewQuestionsForSubject
  } = useTimeSettings();

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    if (subject === 'C') {
      setState('science-specialty');
    } else {
      setState('mode');
    }
  };

  const handleScienceSpecialtySelect = (specialty: ScienceSpecialty) => {
    setSelectedSubject(specialty);
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
  };

  const handleBackToSubjects = () => {
    setState('subject');
    setSelectedSubject(null);
  };

  const handleBackToSpecialty = () => {
    setState('science-specialty');
    setSelectedSubject('C');
  };

  const renderContent = () => {
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
          />
        );
      }
      if (selectedMode === 'REVIEW') {
        return (
          <ReviewMode 
            subject={selectedSubject} 
            onExit={handleExit}
            questionCount={reviewQuestions}
          />
        );
      }
      if (selectedSubject === 'L') {
        return (
          <ReadingTestMode 
            subject={selectedSubject} 
            onExit={handleExit} 
            timePerQuestion={testTime}
            readingTime={readingTime}
          />
        );
      }
      return <TestMode subject={selectedSubject} onExit={handleExit} timePerQuestion={testTime} />;
    }

    if (state === 'science-specialty') {
      return (
        <div>
          <button
            onClick={handleBackToSubjects}
            className="mb-6 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            ← Volver a materias
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">Ciencias</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Selecciona tu especialidad</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {scienceSpecialties.map((specialty, index) => {
              const Icon = specialty.icon;
              const styles = getSpecialtyStyles(theme, index);
              return (
                <button
                  key={specialty.code}
                  onClick={() => handleScienceSpecialtySelect(specialty.code)}
                  className={`group relative bg-gradient-to-br ${styles.gradient} ${styles.hover} rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden`}
                >
                  <div className="relative p-8 flex flex-col items-center text-center text-white">
                    <div className="p-4 rounded-2xl bg-white/30 mb-4 group-hover:bg-white/40 transition-colors group-hover:scale-110 duration-300">
                      <Icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{specialty.name}</h3>
                    <p className="text-sm text-white/90">{specialty.description}</p>
                  </div>
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
            className="mb-6 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            ← Volver a {isScienceSpecialty ? 'especialidades' : 'materias'}
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Selecciona un modo de practica</h2>
          <ModeSelector onSelect={handleModeSelect} />
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Selecciona una materia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 max-w-6xl mx-auto">
          {subjects.map((subject) => (
            <SubjectCard key={subject} subject={subject} onSelect={handleSubjectSelect} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Toaster position="top-center" />
      <Header 
        timeSettings={timeSettings} 
        onUpdateTimeSetting={updateSetting}
        onUpdatePaesQuestions={updatePaesQuestions}
        onUpdateReadingTime={updateReadingTime}
        onUpdateReviewQuestions={updateReviewQuestions}
        showHomeButton={state !== 'subject'}
        onGoHome={handleExit}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <a
        href="/resumenes.html"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50"
      >
        <BookOpen className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Resúmenes PAES</span>
      </a>
    </div>
  );
}

export default App;
