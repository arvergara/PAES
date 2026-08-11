import { useEffect, useState } from 'react';
import { X, TrendingUp, Sparkles, Loader2, Target, Dumbbell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getErrorAnalysis, getAvoidableProfile,
  type ErrorAnalysis, type AvoidableType,
} from '../lib/errorAnalysis';

interface RecuperablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetest?: (ids: string[]) => void;
}

const TYPE_LABEL: Record<AvoidableType, string> = {
  lectura: 'Leí mal el enunciado',
  calculo: 'Error de cálculo',
  marcado: 'Marqué otra alternativa',
  apuro: 'Me apuré / sin tiempo',
  inferido: 'Fallos rápidos en temas que dominas',
};

const SUBJECT_LABEL: Record<string, string> = {
  M1: 'Matemática 1', M2: 'Matemática 2', L: 'Lenguaje', H: 'Historia',
  C: 'Ciencias', CF: 'Física', CQ: 'Química', CB: 'Biología',
};

export function RecuperablesModal({ isOpen, onClose, onRetest }: RecuperablesModalProps) {
  const { user } = useAuth();
  const [data, setData] = useState<ErrorAnalysis | null>(null);
  const [mathRetest, setMathRetest] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    Promise.all([
      getErrorAnalysis(user.id).then(setData),
      getAvoidableProfile(user.id, ['M1', 'M2']).then((p) => setMathRetest(p.retestIds)),
    ]).finally(() => setLoading(false));
  }, [isOpen, user]);

  if (!isOpen) return null;

  const maxType = data ? Math.max(1, ...Object.values(data.byType)) : 1;
  const hasData = data && data.totalAttempts >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Puntos recuperables</h2>
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
          ) : !hasData ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Practica un poco más y aquí verás cuántos puntos puedes recuperar corrigiendo errores evitables.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Número protagonista */}
              <div className="text-center">
                <div className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {data!.recoverablePoints}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  preguntas que sabías pero se te escaparon
                </p>
              </div>

              {/* Proyección */}
              <div className="flex items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-3 px-4">
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{data!.accuracyNow}%</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data!.accuracyIfFixed}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">tu precisión si los eliminas</span>
              </div>

              {/* Mensaje de ánimo (solo si hay señal real) */}
              {data!.encouragement && (
                <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">{data!.encouragement}</p>
                </div>
              )}

              {/* Desglose por tipo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">¿De qué tipo son?</h3>
                <div className="space-y-2">
                  {(Object.keys(data!.byType) as AvoidableType[])
                    .filter((t) => data!.byType[t] > 0)
                    .sort((a, b) => data!.byType[b] - data!.byType[a])
                    .map((t) => (
                      <div key={t}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-600 dark:text-gray-300">{TYPE_LABEL[t]}</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{data!.byType[t]}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data!.byType[t] / maxType) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Por materia */}
              {data!.bySubject.filter((s) => s.avoidable > 0).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Por materia</h3>
                  <div className="space-y-1">
                    {data!.bySubject.filter((s) => s.avoidable > 0).map((s) => (
                      <div key={s.subject} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-gray-600 dark:text-gray-300">{SUBJECT_LABEL[s.subject] ?? s.subject}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{s.avoidable}</span> de {s.wrong} errores
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onRetest && mathRetest.length > 0 && (
                <button
                  onClick={() => onRetest(mathRetest)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Dumbbell className="w-5 h-5" />
                  Repasar mis {mathRetest.length} {mathRetest.length === 1 ? 'error' : 'errores'} de Matemática
                </button>
              )}

              <p className="text-xs text-gray-400 text-center pt-2">
                Los errores evitables son los más fáciles de recuperar: ya sabes el contenido, solo hay que afinar la ejecución.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
