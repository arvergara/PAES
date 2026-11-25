import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Question } from '../types';
import { QuestionContent } from './QuestionContent';
import { QuestionReport } from './QuestionReport';
import { getVisibleOptionLetters } from '../lib/optionLetters';

const SUPABASE_STORAGE_URL = 'https://bmsmmlymsjpydpealmcw.supabase.co/storage/v1/object/public/questions-images';

interface QuestionViewProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  selectedAnswer?: string | null;
  currentAnswer?: string | null;
  showExplanation?: boolean;
}

export function QuestionView({ question, onAnswer, showResult = false, selectedAnswer, currentAnswer, showExplanation }: QuestionViewProps) {
  const [imageError, setImageError] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const answer = currentAnswer ?? selectedAnswer ?? null;
  const shouldShowResult = showResult || showExplanation;

  useEffect(() => {
    setImageError(false);
  }, [question.id]);

  const optionsToShow = getVisibleOptionLetters({
    options: question.options,
    subject: question.subject,
  });

  // Si hay imagen, las alternativas ya se ven en el recorte: solo botones de letra
  const useCircleButtons = !!question.image_url;

  // Check if last option is visible; if not, show scroll hint
  useEffect(() => {
    if (shouldShowResult) { setShowScrollHint(false); return; }
    const checkVisibility = () => {
      const container = optionsRef.current;
      if (!container) return;
      const lastOption = container.lastElementChild as HTMLElement;
      if (!lastOption) return;
      const rect = lastOption.getBoundingClientRect();
      setShowScrollHint(rect.bottom > window.innerHeight - 80);
    };
    // Small delay to let layout settle
    const timer = setTimeout(checkVisibility, 100);
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [question.id, shouldShowResult]);

  const getCircleButtonClass = (option: string) => {
    const baseClass = "w-16 h-16 rounded-full border-2 transition-all duration-200 flex items-center justify-center font-bold text-xl";
    
    if (!shouldShowResult) {
      if (answer === option) {
        return `${baseClass} ${colors.selected} text-white ring-4 ${colors.selectedRing} scale-110`;
      }
      return `${baseClass} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${colors.hover} text-gray-700 dark:text-gray-200 cursor-pointer shadow-sm hover:shadow-md`;
    }
    
    if (option === question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-green-500 bg-green-500 text-white`;
    }
    if (answer === option && option !== question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-red-500 bg-red-500 text-white`;
    }
    return `${baseClass} border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed`;
  };

  const getOptionButtonClass = (option: string) => {
    const baseClass = "w-full px-3 py-2.5 rounded-lg border transition-all duration-200 text-left flex items-center gap-3";
    
    if (!shouldShowResult) {
      if (answer === option) {
        return `${baseClass} ${colors.optionBg} ring-2`;
      }
      return `${baseClass} border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 ${colors.hover} cursor-pointer shadow-sm hover:shadow-md`;
    }
    
    if (option === question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-green-400 bg-green-50 dark:bg-green-900/30`;
    }
    if (answer === option && option !== question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-red-400 bg-red-50 dark:bg-red-900/30`;
    }
    return `${baseClass} border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Imagen de la pregunta */}
      {(question.image_url || (question as any).imagen_url) && !imageError ? (
        <div className="mb-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 overflow-y-auto max-h-[60vh] p-2">
          <img
           src={question.image_url ? `${SUPABASE_STORAGE_URL}/${question.image_url}` : (question as any).imagen_url}
            alt={`Pregunta ${question.question_number}`}
            className="w-full h-auto rounded bg-white"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <QuestionContent content={question.content} imagenUrl={(question as any).imagen_url} />
        </div>
      )}

      {/* Opciones de respuesta */}
      {useCircleButtons ? (
        <div className="flex justify-center gap-4 flex-wrap">
          {optionsToShow.map((option) => (
            <button
              key={option}
              onClick={() => !shouldShowResult && onAnswer(option)}
              disabled={shouldShowResult}
              className={getCircleButtonClass(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      ) : (
        <div ref={optionsRef} className="space-y-2">
          {optionsToShow.map((option) => (
            <button
              key={option}
              onClick={() => !shouldShowResult && onAnswer(option)}
              disabled={shouldShowResult}
              className={getOptionButtonClass(option)}
            >
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                answer === option 
                  ? `${colors.badge} text-white`
                  : shouldShowResult && option === question.correctAnswer.toLowerCase()
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}>
                {option.toUpperCase()}
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex-1">
                {question.options?.[option] || `Opción ${option.toUpperCase()}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Scroll hint */}
      {showScrollHint && !shouldShowResult && (
        <div className="flex items-center justify-center py-1.5 text-gray-400 dark:text-gray-500 animate-bounce">
          <ChevronDown className="w-4 h-4" />
        </div>
      )}

      {/* Resultado */}
      {shouldShowResult && (
        <div className={`mt-4 p-3 rounded-lg text-center font-medium text-sm ${
          answer === question.correctAnswer.toLowerCase() 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {answer === question.correctAnswer.toLowerCase() 
            ? '¡Correcto! 🎉' 
            : `Incorrecto. La respuesta correcta es ${question.correctAnswer.toUpperCase()}`
          }
        </div>
      )}

      {/* Explicación removida - cada modo (TestMode, ReviewMode) maneja su propia explicación */}

      {/* Ref code (siempre visible) y reportar problema (solo después de contestar) */}
      <div className="flex justify-between items-center mt-2">
        {question.ref_code && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{question.ref_code}</span>
        )}
        {shouldShowResult && (
          <QuestionReport questionId={question.id} refCode={question.ref_code} />
        )}
      </div>
    </div>
  );
}
