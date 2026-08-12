import { supabase } from './supabase';

/**
 * Mapa de dominio por eje temático.
 * El banco tiene area_tematica escrita de formas distintas según la generación
 * del loader ("Numeros", "Números", "Álgebra"...), así que normalizamos aquí a
 * los ejes oficiales PAES — esto también corrige los intentos históricos, que
 * copiaron los valores sucios.
 */

export type MasteryStatus = 'domina' | 'casi' | 'debil' | 'sin_datos';

export interface TemaMastery {
  tema: string;
  total: number;
  correct: number;
  accuracy: number; // 0-100
}

export interface EjeMastery {
  eje: string;
  total: number;
  correct: number;
  accuracy: number; // 0-100
  status: MasteryStatus;
  temas: TemaMastery[];
}

export interface SubjectMastery {
  subject: string;
  totalAttempts: number;
  ejes: EjeMastery[];
}

export const MASTERY_SUBJECTS = ['M1', 'M2', 'L', 'H', 'CF', 'CQ', 'CB'] as const;

/** Materias donde se puede lanzar práctica dirigida por eje (L usa textos, va aparte). */
export const PRACTICE_SUBJECTS = new Set(['M1', 'M2', 'H', 'CF', 'CQ', 'CB']);

const MIN_ATTEMPTS = 3;

function strip(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Normaliza un area_tematica sucia al eje oficial PAES de la materia. */
export function normalizeEje(subject: string, area: string | null): string {
  const a = strip(area ?? '');
  if (!a) return 'Sin clasificar';

  if (subject === 'M1' || subject === 'M2') {
    if (/numer|proporcionalidad/.test(a)) return 'Números';
    if (/algebra|funcion/.test(a)) return 'Álgebra y Funciones';
    if (/geometr|trigonometr/.test(a)) return 'Geometría';
    if (/probabilidad|estadist|azar/.test(a)) return 'Probabilidad y Estadística';
  } else if (subject === 'L') {
    if (/localizar/.test(a)) return 'Localizar';
    if (/interpretar/.test(a)) return 'Interpretar';
    if (/evaluar/.test(a)) return 'Evaluar';
  } else if (subject === 'H') {
    if (/ciudadan|civic/.test(a)) return 'Formación Ciudadana';
    if (/econom/.test(a)) return 'Sistema Económico';
    if (/geograf/.test(a)) return 'Geografía';
    if (/histor|chile/.test(a)) return 'Historia';
  }
  // CF/CQ/CB: el banco reprocesado ya trae los ejes canónicos DEMRE, pasan directo
  return area!.trim();
}

function classify(total: number, accuracy: number): MasteryStatus {
  if (total < MIN_ATTEMPTS) return 'sin_datos';
  if (accuracy >= 80) return 'domina';
  if (accuracy >= 50) return 'casi';
  return 'debil';
}

/** Orden de prioridad para estudiar: donde el retorno por hora es mayor. */
const STATUS_PRIORITY: Record<MasteryStatus, number> = {
  casi: 0, debil: 1, sin_datos: 2, domina: 3,
};

interface AttemptRow {
  subject: string;
  area_tematica: string | null;
  tema: string | null;
  is_correct: boolean;
}

export async function getMasteryMap(userId: string): Promise<SubjectMastery[]> {
  const { data, error } = await supabase
    .from('question_attempts')
    .select('subject, area_tematica, tema, is_correct')
    .eq('user_id', userId)
    .in('subject', [...MASTERY_SUBJECTS]);

  if (error || !data) return [];
  const rows = data as AttemptRow[];

  // subject -> eje -> stats + temas (dedupe de temas por clave sin acentos)
  const map = new Map<string, Map<string, {
    total: number; correct: number;
    temas: Map<string, { label: string; total: number; correct: number }>;
  }>>();

  for (const r of rows) {
    const eje = normalizeEje(r.subject, r.area_tematica);
    if (!map.has(r.subject)) map.set(r.subject, new Map());
    const ejes = map.get(r.subject)!;
    if (!ejes.has(eje)) ejes.set(eje, { total: 0, correct: 0, temas: new Map() });
    const e = ejes.get(eje)!;
    e.total++;
    if (r.is_correct) e.correct++;
    const temaLabel = (r.tema ?? '').trim();
    if (temaLabel) {
      const key = strip(temaLabel);
      if (!e.temas.has(key)) e.temas.set(key, { label: temaLabel, total: 0, correct: 0 });
      const t = e.temas.get(key)!;
      t.total++;
      if (r.is_correct) t.correct++;
    }
  }

  return MASTERY_SUBJECTS
    .filter((s) => map.has(s))
    .map((subject) => {
      const ejes: EjeMastery[] = Array.from(map.get(subject)!.entries()).map(([eje, e]) => {
        const accuracy = Math.round((e.correct / e.total) * 100);
        return {
          eje,
          total: e.total,
          correct: e.correct,
          accuracy,
          status: classify(e.total, accuracy),
          temas: Array.from(e.temas.values())
            .map((t) => ({ tema: t.label, total: t.total, correct: t.correct, accuracy: Math.round((t.correct / t.total) * 100) }))
            .sort((a, b) => a.accuracy - b.accuracy),
        };
      });
      ejes.sort((a, b) =>
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || b.total - a.total
      );
      return { subject, totalAttempts: ejes.reduce((n, e) => n + e.total, 0), ejes };
    });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selecciona preguntas del banco activo para práctica dirigida de un eje.
 * Prioridad: nunca vistas → falladas la última vez → ya correctas.
 */
export async function getEjeQuestionIds(
  userId: string,
  subject: string,
  eje: string,
  limit = 15
): Promise<string[]> {
  const [{ data: qData }, { data: aData }] = await Promise.all([
    supabase.from('questions').select('id, area_tematica').eq('subject', subject).eq('active', true),
    supabase.from('question_attempts').select('question_id, is_correct, created_at')
      .eq('user_id', userId).eq('subject', subject).order('created_at', { ascending: true }),
  ]);
  if (!qData) return [];

  const pool = (qData as { id: string; area_tematica: string | null }[])
    .filter((q) => normalizeEje(subject, q.area_tematica) === eje);

  const latest = new Map<string, boolean>(); // question_id -> is_correct del último intento
  for (const a of (aData ?? []) as { question_id: string; is_correct: boolean }[]) {
    latest.set(a.question_id, a.is_correct);
  }

  const unseen: string[] = [], wrong: string[] = [], done: string[] = [];
  for (const q of pool) {
    if (!latest.has(q.id)) unseen.push(q.id);
    else if (!latest.get(q.id)) wrong.push(q.id);
    else done.push(q.id);
  }

  return [...shuffle(unseen), ...shuffle(wrong), ...shuffle(done)].slice(0, limit);
}
