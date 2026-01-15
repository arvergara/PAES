import { useState, useEffect } from 'react';
import { Settings, Clock, X, Calculator, Brain, BookOpen, FlaskConical, History, GraduationCap, Target, Hash, RefreshCw, Layers } from 'lucide-react';
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

const STORAGE_KEY = 'paes_time_settings_v6';

const defaultSettings: TimeSettings = {
  test: { M1: 1, M2: 1, L: 1, C: 1, H: 1 },
  paes: { M1: 1, M2: 1, L: 1, C: 1, H: 1 },
  paesQuestions: { M1: 15, M2: 15, L: 15, C: 15, H: 15 },
  readingTime: { M1: 5, M2: 5, L: 5, C: 5, H: 5 },
  reviewQuestions: { M1: 0, M2: 0, L: 0, C: 0, H: 0 },
};

const realPaesQuestionCount: Record<Subject, number> = {
  M1: 65,
  M2: 65,
  L: 65,
  C: 80,
  H: 65,
};

const subjectConfig: Record<Subject, { name: string; icon: typeof Calculator; gradient: string; accent: string }> = {
  M1: { 
    name: 'Matemática 1', 
    icon: Calculator, 
    gradient: 'from-blue-500 to-blue-700',
    accent: 'bg-blue-500 hover:bg-blue-600'
  },
  M2: { 
    name: 'Matemática 2', 
    icon: Brain, 
    gradient: 'from-purple-500 to-indigo-700',
    accent: 'bg-purple-500 hover:bg-purple-600'
  },
  L: { 
    name: 'Lenguaje', 
    icon: BookOpen, 
    gradient: 'from-red-500 to-rose-700',
    accent: 'bg-red-500 hover:bg-red-600'
  },
  C: { 
    name: 'Ciencias', 
    icon: FlaskConical, 
    gradient: 'from-emerald-500 to-teal-700',
    accent: 'bg-emerald-500 hover:bg-emerald-600'
  },
  H: { 
    name: 'Historia', 
    icon: History, 
    gradient: 'from-amber-500 to-orange-700',
    accent: 'bg-amber-500 hover:bg-amber-600'
  },
};

// Tiempo: 30 seg a 3 min (en minutos)
const timeOptions = [0.5, 1, 1.5, 2, 2.5, 3];
const readingTimeOptions = [3, 5, 7, 10, 15];
const questionOptions = [5, 10, 15, 20, 30, 40, 50, 65];
const reviewQuestionOptions = [0, 5, 10, 15, 20, 30, 50];

// Formatear tiempo en minutos a texto legible
function formatTimeOption(time: number): string {
  if (time === 0.5) return '30 seg';
  return `${time} min`;
}

function formatTotalTime(totalMinutes: number): string {
  if (totalMinutes < 1) {
    return `${Math.round(totalMinutes * 60)} seg`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

const allSubjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H'];

export function useTimeSettings() {
  const [settings, setSettings] = useState<TimeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { 
            test: { ...defaultSettings.test, ...parsed.test },
            paes: { ...defaultSettings.paes, ...parsed.paes },
            paesQuestions: { ...defaultSettings.paesQuestions, ...parsed.paesQuestions },
            readingTime: { ...defaultSettings.readingTime, ...parsed.readingTime },
            reviewQuestions: { ...defaultSettings.reviewQuestions, ...parsed.reviewQuestions }
          };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (mode: 'test' | 'paes', subject: Subject, time: number) => {
    setSettings(prev => ({
      ...prev,
      [mode]: { ...prev[mode], [subject]: time }
    }));
  };

  // Nuevo: Actualizar tiempo para todas las materias
  const updateAllSettings = (mode: 'test' | 'paes', time: number) => {
    setSettings(prev => ({
      ...prev,
      [mode]: { M1: time, M2: time, L: time, C: time, H: time }
    }));
  };

  const updatePaesQuestions = (subject: Subject, count: number) => {
    setSettings(prev => ({
      ...prev,
      paesQuestions: { ...prev.paesQuestions, [subject]: count }
    }));
  };

  // Nuevo: Actualizar preguntas PAES para todas las materias
  const updateAllPaesQuestions = (count: number) => {
    setSettings(prev => ({
      ...prev,
      paesQuestions: { M1: count, M2: count, L: count, C: count, H: count }
    }));
  };

  const updateReadingTime = (subject: Subject, time: number) => {
    setSettings(prev => ({
      ...prev,
      readingTime: { ...prev.readingTime, [subject]: time }
    }));
  };

  // Nuevo: Actualizar tiempo de lectura para todas las materias
  const updateAllReadingTime = (time: number) => {
    setSettings(prev => ({
      ...prev,
      readingTime: { M1: time, M2: time, L: time, C: time, H: time }
    }));
  };

  const updateReviewQuestions = (subject: Subject, count: number) => {
    setSettings(prev => ({
      ...prev,
      reviewQuestions: { ...prev.reviewQuestions, [subject]: count }
    }));
  };

  // Nuevo: Actualizar preguntas de repaso para todas las materias
  const updateAllReviewQuestions = (count: number) => {
    setSettings(prev => ({
      ...prev,
      reviewQuestions: { M1: count, M2: count, L: count, C: count, H: count }
    }));
  };

  const getTimeForSubject = (mode: 'test' | 'paes', subject: Subject): number => {
    return settings[mode]?.[subject] ?? 1;
  };

  const getPaesQuestionsForSubject = (subject: Subject): number => {
    return settings.paesQuestions?.[subject] ?? 15;
  };

  const getReadingTimeForSubject = (subject: Subject): number => {
    return settings.readingTime?.[subject] ?? 5;
  };

  const getReviewQuestionsForSubject = (subject: Subject): number => {
    return settings.reviewQuestions?.[subject] ?? 0;
  };

  return { 
    settings, 
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
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimeSettings;
  onUpdateSetting: (mode: 'test' | 'paes', subject: Subject, time: number) => void;
  onUpdateAllSettings: (mode: 'test' | 'paes', time: number) => void;
  onUpdatePaesQuestions: (subject: Subject, count: number) => void;
  onUpdateAllPaesQuestions: (count: number) => void;
  onUpdateReadingTime: (subject: Subject, time: number) => void;
  onUpdateAllReadingTime: (time: number) => void;
  onUpdateReviewQuestions: (subject: Subject, count: number) => void;
  onUpdateAllReviewQuestions: (count: number) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSetting, 
  onUpdateAllSettings,
  onUpdatePaesQuestions, 
  onUpdateAllPaesQuestions,
  onUpdateReadingTime,
  onUpdateAllReadingTime,
  onUpdateReviewQuestions,
  onUpdateAllReviewQuestions
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'test' | 'paes' | 'review'>('test');
  const subjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H'];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTimeSettings = settings[activeTab === 'review' ? 'test' : activeTab];
  const currentQuestionSettings = settings.paesQuestions;
  const currentReadingSettings = settings.readingTime;
  const currentReviewSettings = settings.reviewQuestions;

  const calculateTotalTime = (subject: Subject, timePerQ: number): number => {
    return currentQuestionSettings[subject] * timePerQ;
  };

  // Verificar si todas las materias tienen el mismo valor
  const allSameTime = (mode: 'test' | 'paes'): number | null => {
    const values = subjects.map(s => settings[mode][s]);
    return values.every(v => v === values[0]) ? values[0] : null;
  };

  const allSamePaesQuestions = (): number | null => {
    const values = subjects.map(s => currentQuestionSettings[s]);
    return values.every(v => v === values[0]) ? values[0] : null;
  };

  const allSameReviewQuestions = (): number | null => {
    const values = subjects.map(s => currentReviewSettings[s]);
    return values.every(v => v === values[0]) ? values[0] : null;
  };

  const allSameReadingTime = (): number | null => {
    const values = subjects.map(s => currentReadingSettings[s]);
    return values.every(v => v === values[0]) ? values[0] : null;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Configuración</h2>
              <p className="text-sm text-indigo-200">Personaliza tiempos y cantidad de preguntas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'test'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Test</span>
          </button>
          <button
            onClick={() => setActiveTab('paes')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'paes'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>PAES</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'review'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Repaso</span>
          </button>
        </div>

        {/* Description */}
        <div className={`px-6 py-3 text-sm ${
          activeTab === 'test' 
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
            : activeTab === 'paes'
            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        }`}>
          {activeTab === 'test' 
            ? '⏱️ Practica a tu ritmo con tiempo personalizado por pregunta'
            : activeTab === 'paes'
            ? '📝 Configura tiempo y cantidad de preguntas para simular el PAES'
            : '🔄 Configura cuántas preguntas quieres en cada sesión de repaso'
          }
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-280px)]">
          
          {/* ========== SECCIÓN: APLICAR A TODAS LAS MATERIAS ========== */}
          <div className={`rounded-xl p-4 border-2 border-dashed ${
            activeTab === 'test' 
              ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
              : activeTab === 'paes'
              ? 'border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10'
              : 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10'
          }`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-xl ${
                activeTab === 'test' 
                  ? 'bg-indigo-100 dark:bg-indigo-500/20'
                  : activeTab === 'paes'
                  ? 'bg-purple-100 dark:bg-purple-500/20'
                  : 'bg-green-100 dark:bg-green-500/20'
              }`}>
                <Layers className={`w-5 h-5 ${
                  activeTab === 'test' 
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : activeTab === 'paes'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  activeTab === 'test' 
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : activeTab === 'paes'
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  Aplicar a todas las materias
                </h3>
                {/* Resumen de configuración actual */}
                <div className="flex items-center gap-3 flex-wrap">
                  {activeTab !== 'review' && allSameTime(activeTab) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tiempo: <span className={`font-medium ${activeTab === 'test' ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'}`}>
                        {formatTimeOption(allSameTime(activeTab)!)}/preg
                      </span>
                    </p>
                  )}
                  {activeTab === 'test' && allSameReadingTime() && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Lectura: <span className="font-medium text-amber-600 dark:text-amber-400">
                          {allSameReadingTime()} min
                        </span>
                      </p>
                    </>
                  )}
                  {activeTab === 'paes' && allSamePaesQuestions() && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Preguntas: <span className="font-medium text-purple-600 dark:text-purple-400">
                          {allSamePaesQuestions()}
                        </span>
                      </p>
                      {allSameTime('paes') && (
                        <span className="text-sm px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                          Total: {formatTotalTime(allSameTime('paes')! * allSamePaesQuestions()!)}
                        </span>
                      )}
                    </>
                  )}
                  {activeTab === 'review' && allSameReviewQuestions() !== null && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Preguntas: <span className="font-medium text-green-600 dark:text-green-400">
                        {allSameReviewQuestions() === 0 ? 'Sin límite' : allSameReviewQuestions()}
                      </span>
                    </p>
                  )}
                  {/* Mensaje cuando hay valores mixtos */}
                  {activeTab === 'test' && !allSameTime('test') && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Valores mixtos por materia
                    </p>
                  )}
                  {activeTab === 'paes' && (!allSameTime('paes') || !allSamePaesQuestions()) && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Valores mixtos por materia
                    </p>
                  )}
                  {activeTab === 'review' && allSameReviewQuestions() === null && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Valores mixtos por materia
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tiempo por pregunta (Test y PAES) */}
            {activeTab !== 'review' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tiempo por pregunta
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((time) => {
                    const isSelected = allSameTime(activeTab) === time;
                    // Calcular tiempo total promedio para PAES (usando la cantidad de preguntas actual)
                    const avgQuestions = allSamePaesQuestions();
                    const totalTimeEstimate = activeTab === 'paes' && avgQuestions ? avgQuestions * time : null;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => onUpdateAllSettings(activeTab, time)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? activeTab === 'test'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md scale-105'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <span>{formatTimeOption(time)}</span>
                        {activeTab === 'paes' && totalTimeEstimate && (
                          <span className={`block text-xs ${
                            isSelected 
                              ? 'text-white/80' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            = {formatTotalTime(totalTimeEstimate)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tiempo de lectura (solo Test) */}
            {activeTab === 'test' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tiempo de lectura (Lenguaje)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {readingTimeOptions.map((time) => {
                    const isSelected = allSameReadingTime() === time;
                    return (
                      <button
                        key={time}
                        onClick={() => onUpdateAllReadingTime(time)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        {time} min
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cantidad de preguntas (PAES) */}
            {activeTab === 'paes' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Cantidad de preguntas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {questionOptions.map((count) => {
                    const isSelected = allSamePaesQuestions() === count;
                    // Calcular tiempo total usando el tiempo por pregunta actual
                    const currentTime = allSameTime('paes') ?? 1;
                    const totalTimeEstimate = currentTime * count;
                    
                    return (
                      <button
                        key={count}
                        onClick={() => onUpdateAllPaesQuestions(count)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <span>{count}</span>
                        <span className={`block text-xs ${
                          isSelected 
                            ? 'text-white/80' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          = {formatTotalTime(totalTimeEstimate)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cantidad de preguntas (Repaso) */}
            {activeTab === 'review' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Cantidad de preguntas por sesión
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reviewQuestionOptions.map((count) => {
                    const isSelected = allSameReviewQuestions() === count;
                    return (
                      <button
                        key={count}
                        onClick={() => onUpdateAllReviewQuestions(count)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        {count === 0 ? '∞ Sin límite' : count}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              O configura por materia
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* ========== CONFIGURACIÓN POR MATERIA ========== */}
          {subjects.map((subject) => {
            const config = subjectConfig[subject];
            const Icon = config.icon;
            const totalTime = activeTab === 'paes' ? calculateTotalTime(subject, currentTimeSettings[subject]) : null;
            const showReadingTime = activeTab === 'test' && subject === 'L';
            
            return (
              <div 
                key={subject}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {config.name}
                      {activeTab === 'paes' && (
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                          (PAES real: {realPaesQuestionCount[subject]} preguntas)
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {activeTab !== 'review' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tiempo: <span className={`font-medium ${activeTab === 'test' ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'}`}>
                            {formatTimeOption(currentTimeSettings[subject])}/preg
                          </span>
                        </p>
                      )}
                      {showReadingTime && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Lectura: <span className="font-medium text-amber-600 dark:text-amber-400">
                              {currentReadingSettings[subject]} min
                            </span>
                          </p>
                        </>
                      )}
                      {activeTab === 'paes' && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Preguntas: <span className="font-medium text-purple-600 dark:text-purple-400">
                              {currentQuestionSettings[subject]}
                            </span>
                          </p>
                          {totalTime && (
                            <span className="text-sm px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                              Total: {formatTotalTime(totalTime)}
                            </span>
                          )}
                        </>
                      )}
                      {activeTab === 'review' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Preguntas: <span className="font-medium text-green-600 dark:text-green-400">
                            {currentReviewSettings[subject] === 0 ? 'Sin límite' : currentReviewSettings[subject]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selector de tiempo por pregunta (Test y PAES) */}
                {activeTab !== 'review' && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Tiempo por pregunta
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {timeOptions.map((time) => {
                        const buttonTotalTime = activeTab === 'paes' ? currentQuestionSettings[subject] * time : null;
                        
                        return (
                          <button
                            key={time}
                            onClick={() => onUpdateSetting(activeTab, subject, time)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              currentTimeSettings[subject] === time
                                ? `${config.accent} text-white shadow-md scale-105`
                                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                            }`}
                          >
                            <span>{formatTimeOption(time)}</span>
                            {activeTab === 'paes' && buttonTotalTime && (
                              <span className={`block text-xs ${
                                currentTimeSettings[subject] === time 
                                  ? 'text-white/80' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                = {formatTotalTime(buttonTotalTime)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selector de tiempo de lectura (solo Lenguaje en modo Test) */}
                {showReadingTime && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Tiempo de lectura (por texto)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {readingTimeOptions.map((time) => (
                        <button
                          key={time}
                          onClick={() => onUpdateReadingTime(subject, time)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            currentReadingSettings[subject] === time
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md scale-105'
                              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                          }`}
                        >
                          {time} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selector de cantidad de preguntas (PAES) */}
                {activeTab === 'paes' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Cantidad de preguntas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {questionOptions.map((count) => {
                        const buttonTotalTime = currentTimeSettings[subject] * count;
                        
                        return (
                          <button
                            key={count}
                            onClick={() => onUpdatePaesQuestions(subject, count)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              currentQuestionSettings[subject] === count
                                ? `${config.accent} text-white shadow-md scale-105`
                                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                            }`}
                          >
                            <span>{count}</span>
                            <span className={`block text-xs ${
                              currentQuestionSettings[subject] === count 
                                ? 'text-white/80' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              = {formatTotalTime(buttonTotalTime)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selector de cantidad de preguntas (Repaso) */}
                {activeTab === 'review' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Cantidad de preguntas por sesión
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reviewQuestionOptions.map((count) => (
                        <button
                          key={count}
                          onClick={() => onUpdateReviewQuestions(subject, count)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            currentReviewSettings[subject] === count
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-md scale-105'
                              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-sm'
                          }`}
                        >
                          {count === 0 ? '∞ Sin límite' : count}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Se guarda automáticamente
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
      title="Configuración"
    >
      <Settings className="h-5 w-5" />
      <span className="hidden sm:inline">Configuración</span>
    </button>
  );
}