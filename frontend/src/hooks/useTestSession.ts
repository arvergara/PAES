import { useState, useEffect, useCallback } from 'react';
import type { Subject, PracticeMode } from '../types';

// Estructura de la sesión pausada
export interface PausedSession {
  subject: Subject;
  mode: PracticeMode;
  currentQuestionIndex: number;
  timeRemaining: number;
  answers: Record<string, string>;
  questionIds: string[];
  startTime: number;
  pausedAt: number;
  totalQuestions: number;
  subjectLabel: string;
  currentTopic?: string;
}

const STORAGE_KEY = 'tutorpaes_paused_session';

const subjectLabels: Record<string, string> = {
  'M1': 'Matemática 1',
  'M2': 'Matemática 2',
  'L': 'Lenguaje',
  'C': 'Ciencias',
  'CB': 'Biología',
  'CF': 'Física',
  'CQ': 'Química',
  'H': 'Historia',
};

const modeLabels: Record<string, string> = {
  'TEST': 'Práctica',
  'PAES': 'Simulacro PAES',
  'REVIEW': 'Repaso',
};

export function useTestSession() {
  const [pausedSession, setPausedSession] = useState<PausedSession | null>(() => {
    // Inicializar desde localStorage de forma síncrona
    console.log('[useTestSession] Inicializando...');
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('[useTestSession] Stored:', stored);
    
    if (stored) {
      try {
        const session = JSON.parse(stored) as PausedSession;
        const hoursOld = (Date.now() - session.pausedAt) / (1000 * 60 * 60);
        console.log('[useTestSession] Hours old:', hoursOld);
        
        if (hoursOld < 24) {
          console.log('[useTestSession] Sesión válida, retornando:', session);
          return session;
        } else {
          console.log('[useTestSession] Sesión expirada, limpiando');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('[useTestSession] Error parsing:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    console.log('[useTestSession] No hay sesión válida');
    return null;
  });

  const saveSession = useCallback((session: Omit<PausedSession, 'pausedAt' | 'subjectLabel'>) => {
    const fullSession: PausedSession = {
      ...session,
      pausedAt: Date.now(),
      subjectLabel: subjectLabels[session.subject] || session.subject,
    };
    console.log('[useTestSession] Guardando sesión:', fullSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSession));
    setPausedSession(fullSession);
  }, []);

  const clearSession = useCallback(() => {
    console.log('[useTestSession] Limpiando sesión');
    localStorage.removeItem(STORAGE_KEY);
    setPausedSession(null);
  }, []);

  const getSession = useCallback((): PausedSession | null => {
    return pausedSession;
  }, [pausedSession]);

  const hasSessionFor = useCallback((subject: Subject, mode: PracticeMode): boolean => {
    return pausedSession?.subject === subject && pausedSession?.mode === mode;
  }, [pausedSession]);

  const formatTimeRemaining = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getContinueButtonInfo = useCallback(() => {
    console.log('[useTestSession] getContinueButtonInfo, pausedSession:', pausedSession);
    if (!pausedSession) return null;
    
    return {
      subject: pausedSession.subject,
      mode: pausedSession.mode,
      subjectLabel: pausedSession.subjectLabel,
      modeLabel: modeLabels[pausedSession.mode] || pausedSession.mode,
      questionProgress: `Pregunta ${pausedSession.currentQuestionIndex + 1}/${pausedSession.totalQuestions}`,
      timeRemaining: formatTimeRemaining(pausedSession.timeRemaining),
      currentTopic: pausedSession.currentTopic,
    };
  }, [pausedSession, formatTimeRemaining]);

  return {
    pausedSession,
    saveSession,
    clearSession,
    getSession,
    hasSessionFor,
    getContinueButtonInfo,
  };
}

export function useSessionPersistence(
  subject: Subject,
  mode: PracticeMode,
  onRestore?: (session: PausedSession) => void
) {
  const { saveSession, clearSession, getSession } = useTestSession();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session && session.subject === subject && session.mode === mode && !restored) {
      if (onRestore) {
        onRestore(session);
      }
      setRestored(true);
    }
  }, [subject, mode, getSession, onRestore, restored]);

  return {
    saveSession,
    clearSession,
    wasRestored: restored,
  };
}
