import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Question } from '../types';

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
  const colors = useThemeColors();
  
  const answer = currentAnswer ?? selectedAnswer ?? null;
  const shouldShowResult = showResult || showExplanation;
  
  useEffect(() => {
    setImageError(false);
  }, [question.id]);

  // Para M2: usar formato simple con botones circulares
  const isM2 = question.subject === 'M2';
  
  // Obtener opciones disponibles
  const allOptions = ['a', 'b', 'c', 'd', 'e'];
  const availableOptions = allOptions.filter(option => {
    const optionValue = question.options?.[option];
    return optionValue && optionValue.trim() !== '';
  });

  // Si no hay opciones con contenido, mostrar A-D por defecto para M2
  const optionsToShow = isM2 
    ? (availableOptions.length > 0 ? availableOptions : ['a', 'b', 'c', 'd'])
    : availableOptions;
  
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
    const baseClass = "w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-start gap-4";
    
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
      {/* Imagen de la pregunta (principalmente para M2) */}
      {question.image_url && !imageError ? (
        <div className="mb-6 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 overflow-hidden p-3">
          <img
            src={`${SUPABASE_STORAGE_URL}/${question.image_url}`}
            alt={`Pregunta ${question.question_number}`}
            className="w-full h-auto rounded bg-white"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-lg text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{question.content}</p>
        </div>
      )}

      {/* Opciones de respuesta */}
      {isM2 ? (
        // M2: Botones circulares simples
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
        // Otras materias: Opciones con texto completo
        <div className="space-y-3">
          {optionsToShow.map((option) => (
            <button
              key={option}
              onClick={() => !shouldShowResult && onAnswer(option)}
              disabled={shouldShowResult}
              className={getOptionButtonClass(option)}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                answer === option 
                  ? `${colors.badge} text-white`
                  : shouldShowResult && option === question.correctAnswer.toLowerCase()
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}>
                {option.toUpperCase()}
              </span>
              <span className="text-gray-800 dark:text-gray-200 flex-1">
                {question.options?.[option] || ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Resultado */}
      {shouldShowResult && (
        <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
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

      {/* Explicación */}
      {showExplanation && question.explanation && (
        <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Explicación</h4>
              <p className="text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
