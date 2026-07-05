import { useState, useEffect, FormEvent } from 'react';
import { X, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportQuestion, type QuestionReportReason } from '../lib/questions';

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  userAnswer?: string | null;
}

const REASONS: { value: QuestionReportReason; label: string; description: string }[] = [
  {
    value: 'clave_incorrecta',
    label: 'La respuesta correcta está mala',
    description: 'Creo que la alternativa marcada como correcta no lo es',
  },
  {
    value: 'opciones_incorrectas',
    label: 'Hay más de una respuesta correcta',
    description: 'O ninguna alternativa es correcta',
  },
  {
    value: 'enunciado_confuso',
    label: 'El enunciado es confuso o ambiguo',
    description: 'La pregunta no se entiende bien',
  },
  {
    value: 'error_tipografico',
    label: 'Error tipográfico o de redacción',
    description: 'Faltan palabras, tildes, números, etc.',
  },
  {
    value: 'imagen_no_carga',
    label: 'La imagen no carga o no se ve bien',
    description: 'Imagen rota, borrosa o faltante',
  },
  {
    value: 'otro',
    label: 'Otro problema',
    description: 'Describe el problema abajo',
  },
];

export function ReportQuestionModal({
  isOpen,
  onClose,
  questionId,
  userAnswer,
}: ReportQuestionModalProps) {
  const [reason, setReason] = useState<QuestionReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(null);
      setDetails('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Selecciona un motivo');
      return;
    }
    setLoading(true);
    try {
      await reportQuestion({
        questionId,
        reason,
        details,
        userAnswer,
      });
      toast.success('¡Gracias! Revisaremos tu reporte pronto.');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al enviar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reportar problema
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Qué problema encontraste con esta pregunta?
          </p>

          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {r.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {r.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos más sobre el problema..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none"
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {details.length}/500
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
