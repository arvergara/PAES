import { useState } from 'react';
import { Flag, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import toast from 'react-hot-toast';

interface QuestionReportProps {
  questionId: string;
  refCode?: string;
}

const REPORT_CATEGORIES = [
  { value: 'respuesta_incorrecta', label: 'La respuesta correcta está mal' },
  { value: 'enunciado_confuso', label: 'El enunciado no se entiende' },
  { value: 'opciones_repetidas', label: 'Opciones duplicadas o muy similares' },
  { value: 'contenido_erroneo', label: 'Información incorrecta' },
  { value: 'imagen_no_carga', label: 'Problema con la imagen' },
  { value: 'otro', label: 'Otro problema' },
] as const;

export function QuestionReport({ questionId, refCode }: QuestionReportProps) {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!category || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('question_reports').insert({
        question_id: questionId,
        user_id: user.id,
        category,
        description: (refCode ? `[${refCode}] ` : '') + (description.trim() || ''),
      });

      if (error) throw error;

      setSent(true);
      toast.success('Reporte enviado. ¡Gracias por ayudarnos a mejorar!');
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        setCategory('');
        setDescription('');
      }, 2000);
    } catch {
      toast.error('Error al enviar el reporte. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-3"
        title="Reportar problema con esta pregunta"
      >
        <Flag size={14} />
        <span>Reportar problema</span>
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Reportar problema
        </h4>
        <button
          onClick={() => { setIsOpen(false); setCategory(''); setDescription(''); }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-2">
          <CheckCircle2 size={18} />
          <span className="text-sm">¡Reporte enviado!</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`text-xs p-2 rounded-lg border transition-all text-left ${
                  category === cat.value
                    ? `${colors.optionBg} ring-1 font-medium`
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema (opcional)..."
            className="w-full text-sm p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={2}
          />

          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!category || sending}
              className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                category && !sending
                  ? `${colors.badge} text-white hover:opacity-90`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
