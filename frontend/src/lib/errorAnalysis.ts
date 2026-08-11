import { supabase } from './supabase';

/** Un intento tal como viene de la BD (subconjunto que usamos). */
interface AttemptRow {
  is_correct: boolean;
  time_spent: number | null;
  error_tag: string | null;
  subject: string;
  tema: string | null;
  created_at: string;
}

export type AvoidableType = 'lectura' | 'calculo' | 'marcado' | 'apuro' | 'inferido';

export interface ErrorAnalysis {
  totalAttempts: number;
  totalWrong: number;
  avoidable: number;          // errores evitables (tontos)
  conceptual: number;         // brechas de conocimiento
  byType: Record<AvoidableType, number>;
  bySubject: { subject: string; avoidable: number; wrong: number }[];
  accuracyNow: number;        // 0-100
  accuracyIfFixed: number;    // 0-100, si eliminara los evitables
  recoverablePoints: number;  // = avoidable
  /** Mensaje de ánimo basado en datos reales. null si no hay señal suficiente. */
  encouragement: string | null;
}

const AVOIDABLE_TAGS = new Set(['lectura', 'calculo', 'marcado', 'apuro']);

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function weekKey(iso: string): number {
  // días desde epoch / 7 (semana absoluta)
  return Math.floor(new Date(iso).getTime() / (1000 * 60 * 60 * 24 * 7));
}

/**
 * Clasifica un intento incorrecto como 'evitable' (tonto), 'conceptual', o null.
 * Usa auto-reporte si existe; si no, infiere por tiempo + dominio del tema.
 */
function classifyWrong(
  a: AttemptRow,
  subjectMedianTime: Map<string, number>,
  temaMastery: Map<string, number>
): { avoidable: boolean; type: AvoidableType | null } {
  if (a.error_tag) {
    if (a.error_tag === 'no_sabia') return { avoidable: false, type: null };
    if (AVOIDABLE_TAGS.has(a.error_tag)) return { avoidable: true, type: a.error_tag as AvoidableType };
  }
  // Inferencia: falló rápido en un tema que domina => probable error tonto
  const med = subjectMedianTime.get(a.subject) ?? 0;
  const mastery = a.tema ? temaMastery.get(a.tema) ?? 0 : 0;
  const fast = a.time_spent != null && med > 0 && a.time_spent <= med * 0.6;
  if (fast && mastery >= 0.7) return { avoidable: true, type: 'inferido' };
  return { avoidable: false, type: null };
}

export async function getErrorAnalysis(userId: string): Promise<ErrorAnalysis | null> {
  const { data, error } = await supabase
    .from('question_attempts')
    .select('is_correct, time_spent, error_tag, subject, tema, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) return null;
  const rows = data as AttemptRow[];
  if (rows.length === 0) {
    return {
      totalAttempts: 0, totalWrong: 0, avoidable: 0, conceptual: 0,
      byType: { lectura: 0, calculo: 0, marcado: 0, apuro: 0, inferido: 0 },
      bySubject: [], accuracyNow: 0, accuracyIfFixed: 0, recoverablePoints: 0,
      encouragement: null,
    };
  }

  // Mediana de tiempo por materia (solo correctas, como referencia de ritmo normal)
  const timesBySubject = new Map<string, number[]>();
  const temaStats = new Map<string, { correct: number; total: number }>();
  for (const r of rows) {
    if (r.time_spent != null && r.is_correct) {
      if (!timesBySubject.has(r.subject)) timesBySubject.set(r.subject, []);
      timesBySubject.get(r.subject)!.push(r.time_spent);
    }
    if (r.tema) {
      const t = temaStats.get(r.tema) ?? { correct: 0, total: 0 };
      t.total++; if (r.is_correct) t.correct++;
      temaStats.set(r.tema, t);
    }
  }
  const subjectMedianTime = new Map<string, number>();
  timesBySubject.forEach((v, k) => subjectMedianTime.set(k, median(v)));
  const temaMastery = new Map<string, number>();
  temaStats.forEach((v, k) => temaMastery.set(k, v.total >= 3 ? v.correct / v.total : 0));

  const byType: Record<AvoidableType, number> = { lectura: 0, calculo: 0, marcado: 0, apuro: 0, inferido: 0 };
  const subjAgg = new Map<string, { avoidable: number; wrong: number }>();
  let totalWrong = 0, avoidable = 0, conceptual = 0, correct = 0;

  // para tendencia semanal
  const byWeek = new Map<number, { avoidable: number; wrong: number }>();

  for (const r of rows) {
    if (r.is_correct) { correct++; continue; }
    totalWrong++;
    const s = subjAgg.get(r.subject) ?? { avoidable: 0, wrong: 0 };
    s.wrong++;
    const cls = classifyWrong(r, subjectMedianTime, temaMastery);
    const wk = weekKey(r.created_at);
    const w = byWeek.get(wk) ?? { avoidable: 0, wrong: 0 };
    w.wrong++;
    if (cls.avoidable) {
      avoidable++; s.avoidable++; w.avoidable++;
      if (cls.type) byType[cls.type]++;
    } else {
      conceptual++;
    }
    byWeek.set(wk, w);
    subjAgg.set(r.subject, s);
  }

  const totalAttempts = rows.length;
  const accuracyNow = Math.round((correct / totalAttempts) * 100);
  const accuracyIfFixed = Math.round(((correct + avoidable) / totalAttempts) * 100);

  const bySubject = Array.from(subjAgg.entries())
    .map(([subject, v]) => ({ subject, ...v }))
    .sort((a, b) => b.avoidable - a.avoidable);

  return {
    totalAttempts, totalWrong, avoidable, conceptual, byType, bySubject,
    accuracyNow, accuracyIfFixed, recoverablePoints: avoidable,
    encouragement: buildEncouragement(byWeek, byType),
  };
}

/**
 * Motor "Momentos de confianza": devuelve UN mensaje basado en datos reales,
 * o null si no hay señal suficiente. Nunca elogio vacío; siempre con un número.
 */
function buildEncouragement(
  byWeek: Map<number, { avoidable: number; wrong: number }>,
  _byType: Record<AvoidableType, number>
): string | null {
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b);
  if (weeks.length < 2) return null;
  const thisWk = byWeek.get(weeks[weeks.length - 1])!;
  const lastWk = byWeek.get(weeks[weeks.length - 2])!;

  // Volumen mínimo para que no sea ruido
  if (thisWk.wrong < 8 || lastWk.wrong < 8) return null;

  const rateNow = thisWk.avoidable / thisWk.wrong;
  const ratePrev = lastWk.avoidable / lastWk.wrong;
  if (ratePrev > 0 && rateNow <= ratePrev * 0.75) {
    const pctNow = Math.round(rateNow * 100);
    const pctPrev = Math.round(ratePrev * 100);
    return `Tus errores evitables bajaron de ${pctPrev}% a ${pctNow}% de tus fallos esta semana. Eso es concentración, no suerte.`;
  }
  return null;
}
