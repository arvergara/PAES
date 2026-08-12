import { useEffect, useState } from 'react';
import { Play, Dumbbell, Compass, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getNextStep, type NextStep } from '../lib/nextStep';
import { getEjeQuestionIds } from '../lib/masteryMap';
import type { Subject } from '../types';

interface NextStepPanelProps {
  onPractice: (ids: string[], subject: Subject) => void;
  onSelectSubject: (subject: Subject) => void;
  onOpenMastery: () => void;
  onOpenRecuperables: () => void;
  onOpenStrengths: () => void;
}

const SUBJECT_LABEL: Record<string, string> = {
  M1: 'Matemática 1', M2: 'Matemática 2', L: 'Lenguaje', H: 'Historia',
  CF: 'Física', CQ: 'Química', CB: 'Biología',
};

export function NextStepPanel({
  onPractice, onSelectSubject, onOpenMastery, onOpenRecuperables, onOpenStrengths,
}: NextStepPanelProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<NextStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!user) return;
    getNextStep(user.id).then(setStep).finally(() => setLoading(false));
  }, [user]);

  const handleCta = async () => {
    if (!user || !step || launching) return;
    if (step.kind === 'retest') {
      onPractice(step.ids, 'M1');
      return;
    }
    if (step.kind === 'start') {
      onSelectSubject('M1');
      return;
    }
    setLaunching(true);
    try {
      const ids = await getEjeQuestionIds(user.id, step.subject, step.eje, 15);
      if (ids.length > 0) onPractice(ids, step.subject as Subject);
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex items-center justify-center text-gray-300 dark:text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!step) return null;

  let headline = '';
  let sub = '';
  let ctaLabel = '';
  let CtaIcon = Play;

  if (step.kind === 'retest') {
    headline = `Repasa tus ${step.count} errores de Matemática`;
    sub = 'Preguntas que fallaste por errores evitables. Ya sabes el contenido — hoy toca asegurarlo.';
    ctaLabel = 'Empezar repaso';
    CtaIcon = Dumbbell;
  } else if (step.kind === 'eje') {
    headline = `${step.eje} · ${SUBJECT_LABEL[step.subject] ?? step.subject}`;
    sub = step.status === 'casi'
      ? `Vas al ${step.accuracy}% — estás a un paso de dominarlo. Aquí cada hora de estudio rinde más.`
      : `Vas al ${step.accuracy}% — es tu eje más débil con datos. Práctica dirigida para levantarlo.`;
    ctaLabel = 'Practicar 15 preguntas';
  } else {
    headline = 'Parte con Matemática 1';
    sub = 'Haz tu primer test para que armemos tu mapa de dominio y te digamos qué estudiar cada día.';
    ctaLabel = 'Hacer un test';
  }

  const showRetestHint = step.kind === 'eje' && step.retestIds.length > 0;

  return (
    <div className="max-w-5xl mx-auto mb-8 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-gray-800 p-6 shadow-sm">
      <p className="text-xs font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mb-2">
        Tu próximo paso
      </p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{headline}</h2>
      <p className="text-gray-600 dark:text-gray-300 mt-1 mb-4">{sub}</p>

      <button
        onClick={handleCta}
        disabled={launching}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-md"
      >
        {launching ? <Loader2 className="w-5 h-5 animate-spin" /> : <CtaIcon className="w-5 h-5" />}
        {ctaLabel}
      </button>

      {showRetestHint && (
        <button
          onClick={() => onPractice(step.retestIds, 'M1')}
          className="block mt-3 text-sm text-indigo-600 dark:text-indigo-300 hover:underline"
        >
          También pendiente: {step.retestIds.length} {step.retestIds.length === 1 ? 'error' : 'errores'} de Matemática listos para repaso
        </button>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-4 border-t border-indigo-100 dark:border-indigo-500/20 text-sm">
        <button onClick={onOpenMastery} className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
          <Compass className="w-4 h-4" /> Mapa de dominio
        </button>
        <button onClick={onOpenRecuperables} className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
          <TrendingUp className="w-4 h-4" /> Puntos recuperables
        </button>
        <button onClick={onOpenStrengths} className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">
          <Target className="w-4 h-4" /> Materias a reforzar
        </button>
      </div>
    </div>
  );
}
