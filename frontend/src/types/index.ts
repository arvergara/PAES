export type Subject = 'M1' | 'M2' | 'L' | 'C' | 'CB' | 'CQ' | 'CF' | 'H' | 'ALL';
export type PracticeMode = 'PAES' | 'TEST' | 'REVIEW';

export interface User {
  id: string;
  name: string;
  email: string;
  grade?: string;
}

export interface QuestionImage {
  id: string;
  url: string;
  type: 'diagram' | 'graph' | 'table' | 'icon' | 'other';
  width?: number;
  height?: number;
  coordinates?: Record<string, number>;
  page_number?: number;
  alt?: string;
}

export interface QuestionTable {
  id: string;
  table_content: string[][];
  page_number?: number;
  rows?: number;
  cols?: number;
}

export type QuestionOptions = Record<string, string>;
export type QuestionOptionKey = keyof QuestionOptions & string;

export interface Question {
  id: string;
  subject: Subject;
  content: string;
  options: QuestionOptions;
  correctAnswer: QuestionOptionKey;
  explanation: string;
  areaTematica?: string;
  area_tematica?: string;
  tema?: string;
  subtema?: string;
  habilidad?: string;
  difficulty?: number;
  has_visual_content?: boolean;
  images?: QuestionImage[];
  image_details?: QuestionImage[];
  imageCount?: number;
  tableCount?: number;
  reading_text_id?: number;
  question_number?: number;
  origen?: string;
  ai_classification?: {
    area_tematica: string;
    tema: string;
    habilidad: string;
    overall_confidence: number;
    [key: string]: any;
  };
  classification_confidence?: number;
  metadata?: Record<string, unknown>;
  tables?: QuestionTable[];
}

// Nuevo tipo para lecturas
export interface ReadingText {
  id: number;
  title: string;
  source: string;
  pdf_url: string | null;
  page_start: number;
  page_end: number;
  question_start: number;
  question_end: number;
  subject: string;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  sessionId: string;
  questionId: string;
  subject: Subject;
  mode: PracticeMode;
  areaTematica?: string;
  tema?: string;
  subtema?: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}
