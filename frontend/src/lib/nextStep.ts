import { getMasteryMap, PRACTICE_SUBJECTS, type EjeMastery } from './masteryMap';
import { getAvoidableProfile } from './errorAnalysis';

/**
 * Calcula LA acción recomendada del día para el panel "Tu próximo paso".
 * Prioridad: 1) re-test de errores evitables vencidos (cierra el ciclo del error),
 * 2) eje "a un paso" de dominar (máximo retorno por hora), 3) eje débil,
 * 4) sin datos → partir con un test diagnóstico de M1.
 */

export type NextStep =
  | { kind: 'retest'; ids: string[]; count: number }
  | { kind: 'eje'; subject: string; eje: string; accuracy: number; status: 'casi' | 'debil'; retestIds: string[]; retestCount: number }
  | { kind: 'start'; retestIds: string[]; retestCount: number };

/** Materias base primero: el orden define el desempate entre ejes equivalentes. */
const SUBJECT_PRIORITY = ['M1', 'M2', 'CF', 'CQ', 'CB', 'H'];

export async function getNextStep(userId: string): Promise<NextStep> {
  const [map, profile] = await Promise.all([
    getMasteryMap(userId),
    getAvoidableProfile(userId, ['M1', 'M2']),
  ]);

  if (profile.retestIds.length >= 3) {
    return { kind: 'retest', ids: profile.retestIds, count: profile.count };
  }

  const candidates: { subject: string; eje: EjeMastery }[] = [];
  for (const s of map) {
    if (!PRACTICE_SUBJECTS.has(s.subject)) continue;
    for (const eje of s.ejes) {
      if (eje.status === 'casi' || eje.status === 'debil') {
        candidates.push({ subject: s.subject, eje });
      }
    }
  }
  candidates.sort((a, b) => {
    // 'casi' antes que 'debil'; luego materias base; luego más intentos (señal más firme)
    if (a.eje.status !== b.eje.status) return a.eje.status === 'casi' ? -1 : 1;
    const pa = SUBJECT_PRIORITY.indexOf(a.subject);
    const pb = SUBJECT_PRIORITY.indexOf(b.subject);
    if (pa !== pb) return pa - pb;
    return b.eje.total - a.eje.total;
  });

  const best = candidates[0];
  if (best) {
    return {
      kind: 'eje',
      subject: best.subject,
      eje: best.eje.eje,
      accuracy: best.eje.accuracy,
      status: best.eje.status as 'casi' | 'debil',
      retestIds: profile.retestIds,
      retestCount: profile.count,
    };
  }
  return { kind: 'start', retestIds: profile.retestIds, retestCount: profile.count };
}
