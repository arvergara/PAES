import { useState, useEffect } from 'react';
import type { Question } from '../types';

const SUPABASE_STORAGE_URL = 'https://bmsmmlymsjpydpealmcw.supabase.co/storage/v1/object/public/questions-images';

interface QuestionViewProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult: boolean;
  selectedAnswer: string | null;
}

export default function QuestionView({ question, onAnswer, showResult, selectedAnswer }: QuestionViewProps) {
  const [imageError, setImageError] = useState(false);
  const [optionImageErrors, setOptionImageErrors] = useState<Record<string, boolean>>({});
  
  // Reset errors when question changes
  useEffect(() => {
    setImageError(false);
    setOptionImageErrors({});
  }, [question.id]);

  const options = ['a', 'b', 'c', 'd', 'e'];
  
  // Get option images if available
  const optionImages = question.option_images as Record<string, string> | null;
  const hasOptionImages = optionImages && Object.keys(optionImages).length >= 4;
  
  const getButtonClass = (option: string) => {
    const baseClass = "w-full p-3 text-left rounded-lg border-2 transition-all flex items-center gap-3";
    
    if (!showResult) {
      if (selectedAnswer === option) {
        return `${baseClass} border-blue-500 bg-blue-50`;
      }
      return `${baseClass} border-gray-200 hover:border-blue-300 hover:bg-gray-50`;
    }
    
    // Show results
    if (option === question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-green-500 bg-green-50`;
    }
    if (selectedAnswer === option && option !== question.correctAnswer.toLowerCase()) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    return `${baseClass} border-gray-200 bg-gray-50 opacity-60`;
  };

  const handleOptionImageError = (option: string) => {
    setOptionImageErrors(prev => ({ ...prev, [option]: true }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Question Image */}
      {question.image_url && !imageError ? (
        <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <img
            src={`${SUPABASE_STORAGE_URL}/${question.image_url}`}
            alt={`Pregunta ${question.question_number}`}
            className="w-full h-auto"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-lg">{question.content}</p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const optionText = question.options?.[option];
          if (!optionText) return null;
          
          const optionImagePath = optionImages?.[option];
          const showOptionImage = hasOptionImages && optionImagePath && !optionImageErrors[option];
          
          return (
            <button
              key={option}
              onClick={() => !showResult && onAnswer(option)}
              disabled={showResult}
              className={getButtonClass(option)}
            >
              {/* Option letter badge */}
              <span className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${selectedAnswer === option 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'}
                ${showResult && option === question.correctAnswer.toLowerCase() 
                  ? 'bg-green-500 text-white' 
                  : ''}
                ${showResult && selectedAnswer === option && option !== question.correctAnswer.toLowerCase() 
                  ? 'bg-red-500 text-white' 
                  : ''}
              `}>
                {option.toUpperCase()}
              </span>
              
              {/* Option content - image or text */}
              <div className="flex-1 min-h-[2rem] flex items-center">
                {showOptionImage ? (
                  <img
                    src={`${SUPABASE_STORAGE_URL}/${optionImagePath}`}
                    alt={`Opcion ${option.toUpperCase()}`}
                    className="max-h-16 w-auto"
                    onError={() => handleOptionImageError(option)}
                  />
                ) : (
                  <span className="text-gray-700">{optionText}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result message */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          selectedAnswer === question.correctAnswer.toLowerCase() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {selectedAnswer === question.correctAnswer.toLowerCase() 
            ? '¡Correcto! 🎉' 
            : `Incorrecto. La respuesta correcta es ${question.correctAnswer.toUpperCase()}`
          }
        </div>
      )}
    </div>
  );
}
