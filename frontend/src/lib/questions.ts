import { supabase } from './supabase';
import type {
  Question,
  QuestionOptions,
  QuestionOptionKey,
  QuestionTable,
  Subject,
} from '../types';

const VIEW_SELECT = `
  id,
  subject,
  content,
  options,
  correct_answer,
  explanation,
  area_tematica,
  tema,
  subtema,
  difficulty,
  habilidad,
  has_visual_content,
  images,
  metadata,
  reading_text_id,
  question_number,
  image_url
`;

const TABLE_SELECT = `
  id,
  subject,
  content,
  options,
  correct_answer,
  explanation,
  area_tematica,
  tema,
  subtema,
  difficulty,
  habilidad,
  has_visual_content,
  images,
  metadata,
  reading_text_id,
  question_number,
  image_url
`;

const OPTION_LABELS = ['a', 'b', 'c', 'd', 'e'];
const FOOTNOTE_PATTERNS = [
  /^forma\b/i,
  /^-?\s*\d{5,}\s*$/,
  /^-?\s*\d{4,}\s*-\s*\d{4,}\s*-?$/,
  /^pagina\b/i,
  /^https?:\/\//i,
  /^\(?\d{6,}\)?$/,
  /^-+$/,
  /^trv$/i,
];

const INLINE_FOOTNOTE_PATTERNS = [
  /MODELO DE PRUEBA DE HISTORIA[^.]*$/i,
  /FORMA\s+\d+\s*-\s*\d+[^.]*$/i,
  /\bTRV\b.*$/i,
];

function isFootnote(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed === '0') return true;
  if (trimmed.toLowerCase() === '[object object]') return true;
  return FOOTNOTE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function stripInlineFootnotes(text: string): string {
  return INLINE_FOOTNOTE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '').trim(), text);
}

function preprocessOptionValue(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .replace(/([A-E])\)\s*\1\)\s*/gi, '$1) ')
    .trim();
}

function splitOptionSegments(raw: string): string[] {
  const cleaned = preprocessOptionValue(raw);
  return cleaned
    .split(/(?=[A-E]\))/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normaliseOptionText(raw: string, fallbackIndex: number): [string, string] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([A-E])\)\s*(.*)$/i);
  if (match) {
    const label = match[1].toLowerCase();
    const text = match[2].replace(/^([A-E])\)\s*/i, '').trim();
    if (isFootnote(text)) return null;
    return [label, text || trimmed];
  }

  const fallbackLabel = OPTION_LABELS[fallbackIndex] ?? String.fromCharCode(97 + fallbackIndex);
  if (isFootnote(trimmed)) return null;
  return [fallbackLabel, trimmed];
}

function normalizeOptions(options: unknown): QuestionOptions {
  if (!options) {
    return {};
  }

  const mapped: QuestionOptions = {};
  let fallbackIndex = 0;

  const assignOption = (label: string, text: string) => {
    if (isFootnote(text)) return;
    const cleanedText = stripInlineFootnotes(text).trim();
    if (!cleanedText) return;
    const cleanLabel = label.toLowerCase();
    let finalLabel = cleanLabel;

    while (mapped[finalLabel]) {
      fallbackIndex += 1;
      finalLabel = OPTION_LABELS[fallbackIndex] ?? String.fromCharCode(97 + fallbackIndex);
    }

    mapped[finalLabel] = cleanedText;
    fallbackIndex += 1;
  };

  const processString = (value: string) => {
    const segments = splitOptionSegments(value);
    if (segments.length === 0) {
      const parsed = normaliseOptionText(value, fallbackIndex);
      if (!parsed) return;
      const [label, text] = parsed;
      assignOption(label, stripInlineFootnotes(text));
      return;
    }

    segments.forEach((segment) => {
      const parsed = normaliseOptionText(segment, fallbackIndex);
      if (!parsed) return;
      const [label, text] = parsed;
      assignOption(label, stripInlineFootnotes(text));
    });
  };

  if (Array.isArray(options)) {
    options.forEach((entry) => {
      if (typeof entry === 'string') {
        processString(stripInlineFootnotes(entry));
        return;
      }

      if (entry && typeof entry === 'object') {
        const maybeText = (entry as { text?: unknown }).text;
        if (typeof maybeText === 'string') {
          processString(stripInlineFootnotes(maybeText));
          return;
        }

        const maybeValue = (entry as { value?: unknown }).value;
        if (typeof maybeValue === 'string') {
          processString(stripInlineFootnotes(maybeValue));
          return;
        }

        const maybeDescription = (entry as { description?: unknown }).description;
        if (typeof maybeDescription === 'string') {
          processString(stripInlineFootnotes(maybeDescription));
        }
      }
    });
    return mapped;
  }

  if (typeof options === 'object') {
    Object.entries(options as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const parsed = normaliseOptionText(value, fallbackIndex);
        if (!parsed) return;
        const [label, text] = parsed;
        assignOption(label || key.toLowerCase(), stripInlineFootnotes(text));
        return;
      }

      if (value && typeof value === 'object' && 'text' in (value as Record<string, unknown>)) {
        const text = (value as { text?: unknown }).text;
        if (typeof text === 'string') {
          assignOption(key, stripInlineFootnotes(text));
        }
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === 'string') {
            processString(stripInlineFootnotes(entry));
          }
        });
      }
    });
    return mapped;
  }

  return {};
}

function pickCorrectAnswer(options: QuestionOptions, candidate?: string | null): QuestionOptionKey {
  if (candidate && candidate in options) {
    return candidate as QuestionOptionKey;
  }
  const firstKey = Object.keys(options)[0];
  return (firstKey || 'a') as QuestionOptionKey;
}

function mapQuestion(row: any): Question {
  const options = normalizeOptions(row.options);
  const images = (row.image_details ?? row.images ?? []) as Question['images'];

  return {
    id: row.id,
    subject: row.subject as Subject,
    content: sanitizeContent(row.content),
    options,
    correctAnswer: pickCorrectAnswer(options, row.correct_answer),
    explanation: row.explanation,
    areaTematica: row.area_tematica || undefined,
    area_tematica: row.area_tematica || undefined,
    tema: row.tema || undefined,
    subtema: row.subtema || undefined,
    difficulty: row.difficulty || undefined,
    habilidad: row.habilidad || undefined,
    has_visual_content: row.has_visual_content || false,
    images,
    image_details: images,
    imageCount: row.image_count ?? images?.length ?? 0,
    tableCount: row.table_count ?? 0,
    metadata: row.metadata || undefined,
    reading_text_id: row.reading_text_id || undefined,
    question_number: row.question_number || undefined,
    image_url: row.image_url || undefined,  // NUEVO: campo para imágenes de Storage
  };
}

export async function getQuestionsBySubject(subject: Subject): Promise<Question[]> {
  try {
    const buildQuery = (source: string, select: string) => {
      let query = supabase
        .from(source as any)
        .select(select)
        .eq('active', true);

      if (subject !== 'ALL') {
        query = query.eq('subject', subject);
      }

      return query;
    };

    let { data, error } = await buildQuery('questions_with_visuals', VIEW_SELECT);
    console.log('RAW DATA FROM SUPABASE:', data?.[0]);

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('Falling back to questions table due to view error:', error);
      } else {
        console.warn(`No questions found in view for subject ${subject}, falling back to base table`);
      }

      const fallback = await buildQuery('questions', TABLE_SELECT);
      ({ data, error } = await fallback);
    }

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`No questions found for subject: ${subject}`);
      return [];
    }

    return data.map(mapQuestion).sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

export async function getTablesForQuestion(questionId: string): Promise<QuestionTable[]> {
  const { data, error } = await supabase
    .from('question_tables')
    .select('id, table_content, page_number, rows, cols')
    .eq('question_id', questionId);

  if (error) {
    console.error('Error fetching tables for question:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    table_content: row.table_content,
    page_number: row.page_number || undefined,
    rows: row.rows || undefined,
    cols: row.cols || undefined,
  }));
}
function sanitizeContent(raw: string | null | undefined): string {
  if (!raw) return '';
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => stripInlineFootnotes(line.trim()));

  const filtered = lines
    .filter((line) => line.length > 0)
    .filter((line) => !isFootnote(line))
    .filter((line) => !/^0$/.test(line))
    .filter((line) => !/^\s*[A-E]\)$/.test(line));

    return filtered.join('\n').trim();
  }