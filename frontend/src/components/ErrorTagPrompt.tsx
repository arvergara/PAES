import { useState } from 'react';
import { HelpCircle, Calculator, Eye, MousePointerClick, Timer, Check } from 'lucide-react';

export type ErrorTag = 'no_sabia' | 'calculo' | 'lectura' | 'marcado' | 'apuro';

const OPTIONS: { tag: ErrorTag; label: string; icon: typeof Eye; evitable: boolean }[] = [
  { tag: 'no_sabia', label: 'No lo sabía', icon: HelpCircle, evitable: false },
  { tag: 'lectura', label: 'Leí mal', icon: Eye, evitable: true },
  { tag: 'calculo', label: 'Error de cálculo', icon: Calculator, evitable: true },
  { tag: 'marcado', label: 'Marqué otra', icon: MousePointerClick, evitable: true },
  { tag: 'apuro', label: 'Me apuré', icon: Timer, evitable: true },
];

interface ErrorTagPromptProps {
  onTag: (tag: ErrorTag) => void;
}

/**
 * Micro-encuesta de 1 toque que aparece SOLO tras una respuesta incorrecta.
 * No bloquea: es opcional. Alimenta el tracking de "errores tontos".
 */
export function ErrorTagPrompt({ onTag }: ErrorTagPromptProps) {
  const [selected, setSelected] = useState<ErrorTag | null>(null);

  const handle = (tag: ErrorTag) => {
    if (selected) return;
    setSelected(tag);
    onTag(tag);
  };

  if (selected) {
    const opt = OPTIONS.find((o) => o.tag === selected)!;
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Check className="w-4 h-4 text-emerald-500" />
        {opt.evitable ? (
          <span>Anotado. Este tipo de error se recupera con práctica.</span>
        ) : (
          <span>Anotado. Lo repasamos como contenido a reforzar.</span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        ¿Qué pasó? <span className="font-normal text-gray-400">(opcional, te ayuda a mejorar)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ tag, label, icon: Icon }) => (
          <button
            key={tag}
            onClick={() => handle(tag)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-colors"
          >
            <Icon className="w-4 h-4 text-gray-400" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
