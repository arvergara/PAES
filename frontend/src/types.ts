// Tipos base para la aplicación PAES

export type Subject = 'M1' | 'M2' | 'L' | 'C' | 'CB' | 'CF' | 'CQ' | 'H' | 'ALL';

export type PracticeMode = 'PAES' | 'TEST' | 'REVIEW';

export type QuestionOptionKey = 'a' | 'b' | 'c' | 'd' | 'e';

export type QuestionOptions = Partial<Record<QuestionOptionKey, string>>;

export interface QuestionImage {
  id?: string;
  url: string;
  alt?: string;
  type: 'diagram' | 'graph' | 'table' | 'icon' | 'image';
}

export interface QuestionTable {
  id: string;
  table_content: string[][];
  page_number?: number;
  rows?: number;
  cols?: number;
}

export interface Question {
  id: string;
  subject: Subject;
  content: string;
  options: QuestionOptions;
  correctAnswer: QuestionOptionKey;
  explanation?: string;
  areaTematica?: string;
  area_tematica?: string;
  tema?: string;
  subtema?: string;
  difficulty?: number | string;
  habilidad?: string;
  has_visual_content?: boolean;
  images?: QuestionImage[];
  image_details?: QuestionImage[];
  imageCount?: number;
  tableCount?: number;
  tables?: QuestionTable[];
  metadata?: Record<string, unknown>;
  reading_id?: number;
  question_number?: number;
  topic?: string;
  classification_confidence?: number;
  ai_classification?: {
    overall_confidence?: number;
  };
  image_url?: string;  // NUEVO: URL de imagen en Supabase Storage
  option_images?: Record<string, string>;
}

export interface ReadingText {
  id: number;
  title: string;
  source: string;
  pdf_url?: string;
  page_start?: number;
  page_end?: number;
}

export interface UserSession {
  id: string;
  user_id: string;
  subject: Subject;
  mode: PracticeMode;
  questions_total: number;
  questions_correct: number;
  time_spent: number;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  session_id: string;
  question_id: string;
  subject: Subject;
  mode: PracticeMode;
  area_tematica?: string;
  tema?: string;
  subtema?: string;
  answer: string;
  is_correct: boolean;
  time_spent: number;
  created_at: string;
}
