import { useEffect, useState } from 'react';
import { X, Compass, Loader2, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getMasteryMap, getEjeQuestionIds, PRACTICE_SUBJECTS,
  type SubjectMastery, type MasteryStatus,
} from '../lib/masteryMap';
import type { Subject } from '../types';

interface MasteryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPractice: (ids: string[], subject: Subject) => void;
}

const SUBJECT_LABEL: Record<string, string> = {
  M1: 'Matemática 1', M2: 'Matemática 2', L: 'Lenguaje', H: 'Historia',
};

const STATUS_UI: Record<MasteryStatus, { label: string; chip: string; bar: string }> = {
  casi: {
    label: 'A un paso',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  debil: {
    label: 'Débil',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  sin_datos: {
    label: 'Pocos datos',
    chip: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    bar: 'bg-gray-400',
  },
  domina: {
    label: 'Dominado',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
};

export function MasteryMapModal({ isOpen, onClose, onPractice }: MasteryMapModalProps) {
  const { user } = useAuth();
  const [data, setData] = useState<SubjectMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [expandedEje, setExpandedEje] = useState<string | null>(null);
  const [launchingEje, setLaunchingEje] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    getMasteryMap(user.id)
      .then((m) => {
        setData(m);
        setActiveSubject((prev) => prev && m.some((s) => s.subject === prev) ? prev : m[0]?.subject ?? null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  if (!isOpen) return null;

  const current = data.find((s) => s.subject === activeSubject) ?? null;
  const canPractice = current ? PRACTICE_SUBJECTS.has(current.subject) : false;

  const handlePractice = async (eje: string) => {
    if (!user || !current) return;
    setLaunchingEje(eje);
    try {
      const ids = await getEjeQuestionIds(user.id, current.subject, eje, 15);
      if (ids.length > 0) onPractice(ids, current.subject as Subject);
    } finally {
      setLaunchingEje(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">¿Qué estudiar hoy?</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Responde algunas preguntas y aquí verás tu mapa de dominio por eje: dónde estás fuerte y dónde está tu mayor retorno.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tabs por materia */}
              <div className="flex gap-2 flex-wrap">
                {data.map((s) => (
                  <button
                    key={s.subject}
                    onClick={() => { setActiveSubject(s.subject); setExpandedEje(null); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      s.subject === activeSubject
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {SUBJECT_LABEL[s.subject] ?? s.subject}
                  </button>
                ))}
              </div>

              {current && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ordenado por retorno: primero los ejes que ya casi dominas — ahí cada hora de estudio vale más.
                  </p>

                  <div className="space-y-3">
                    {current.ejes.map((e) => {
                      const ui = STATUS_UI[e.status];
                      const isExpanded = expandedEje === e.eje;
                      return (
                        <div key={e.eje} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => setExpandedEje(isExpanded ? null : e.eje)}
                              className="flex items-center gap-1.5 text-left min-w-0"
                              disabled={e.temas.length === 0}
                            >
                              {e.temas.length > 0 && (
                                isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                  : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                              )}
                              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{e.eje}</span>
                            </button>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${ui.chip}`}>
                              {ui.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ui.bar}`} style={{ width: `${e.accuracy}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 w-10 text-right">{e.accuracy}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{e.correct} de {e.total} correctas</p>

                          {isExpanded && e.temas.length > 0 && (
                            <div className="mt-3 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                              {e.temas.map((t) => (
                                <div key={t.tema} className="flex justify-between text-sm py-0.5">
                                  <span className="text-gray-600 dark:text-gray-300 truncate mr-3">{t.tema}</span>
                                  <span className="text-gray-500 dark:text-gray-400 shrink-0">
                                    {t.correct}/{t.total} · {t.accuracy}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {canPractice && (
                            <button
                              onClick={() => handlePractice(e.eje)}
                              disabled={launchingEje !== null}
                              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {launchingEje === e.eje
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Play className="w-4 h-4" />}
                              Practicar este eje (15 preguntas)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!canPractice && (
                    <p className="text-xs text-gray-400 text-center">
                      En Lenguaje la práctica va por textos completos — usa este mapa para saber qué habilidad mirar con más atención.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
