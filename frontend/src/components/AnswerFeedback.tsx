import { CheckCircle2, XCircle } from 'lucide-react';

interface AnswerFeedbackProps {
  isCorrect: boolean;
  correctAnswer?: string;
}

export function AnswerFeedback({ isCorrect, correctAnswer }: AnswerFeedbackProps) {
  return (
    <div 
      className={`mt-6 p-5 rounded-xl text-center transform transition-all duration-300 ${
        isCorrect 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-center justify-center gap-3">
        {isCorrect ? (
          <>
            <div className="animate-bounce">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">¡Excelente! 🎉</p>
              <p className="text-sm text-green-600 dark:text-green-400">Respuesta correcta</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">Incorrecto</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                La respuesta correcta es: <span className="font-bold">{correctAnswer?.toUpperCase()}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
