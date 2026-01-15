import { useState, useEffect } from 'react';
import { Play, X, Clock, BookOpen } from 'lucide-react';
import type { Subject, PracticeMode } from '../types';

interface LastSession {
  subject: Subject;
  mode: PracticeMode;
  questionIndex: number;
  timeRemaining: number;
  totalQuestions: number;
  timestamp: number;
  userId?: string;
}

interface ContinueButtonProps {
  onContinue: (subject: Subject, mode: PracticeMode, questionIndex?: number, timeRemaining?: number) => void;
  userId: string;
}

const subjectNames: Record<string, string> = {
  M1: 'Matemática 1',
  M2: 'Matemática 2',
  L: 'Lenguaje',
  H: 'Historia',
  C: 'Ciencias',
  CF: 'Física',
  CQ: 'Química',
  CB: 'Biología',
};

const modeNames: Record<string, string> = {
  TEST: 'Modo Test',
  PAES: 'Simulacro PAES',
  REVIEW: 'Modo Repaso',
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ContinueButton({ onContinue, userId }: ContinueButtonProps) {
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem('lastPracticeSession');
    if (sessionData) {
      try {
        const session: LastSession = JSON.parse(sessionData);
        const hoursSinceSession = (Date.now() - session.timestamp) / (1000 * 60 * 60);
        
        // Verificar que la sesión pertenece al usuario actual
        if (session.userId && session.userId !== userId) {
          setLastSession(null);
          return;
        }
        
        // Para REVIEW no hay límite de tiempo, solo verificar expiración de 72h
        if (session.mode === 'REVIEW') {
          if (hoursSinceSession < 72) {
            setLastSession(session);
          } else {
            localStorage.removeItem('lastPracticeSession');
          }
        } else {
          // Para otros modos, verificar tiempo restante
          if (hoursSinceSession < 72 && session.timeRemaining > 0) {
            setLastSession(session);
          } else {
            localStorage.removeItem('lastPracticeSession');
          }
        }
      } catch (e) {
        localStorage.removeItem('lastPracticeSession');
      }
    }
  }, [userId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.removeItem('lastPracticeSession');
  };

  const handleContinue = () => {
    if (lastSession) {
      onContinue(
        lastSession.subject, 
        lastSession.mode, 
        lastSession.questionIndex,
        lastSession.timeRemaining
      );
    }
  };

  if (!lastSession || isDismissed) return null;

  const isReviewMode = lastSession.mode === 'REVIEW';
  const showTime = !isReviewMode && lastSession.timeRemaining > 0;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm h-full">
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isReviewMode ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
              {isReviewMode ? (
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Continuar práctica</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subjectNames[lastSession.subject]} · Pregunta {lastSession.questionIndex}
                {lastSession.totalQuestions && ` de ${lastSession.totalQuestions}`}
              </p>
              {showTime ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(lastSession.timeRemaining)} restantes
                </p>
              ) : isReviewMode ? (
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                  <BookOpen className="w-3 h-3" />
                  {modeNames[lastSession.mode]}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleContinue}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                isReviewMode 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Continuar
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}