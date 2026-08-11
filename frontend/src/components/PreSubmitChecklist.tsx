import { useState } from 'react';
import { ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import type { AvoidableType } from '../lib/errorAnalysis';

interface ChecklistItem {
  text: string;
  types: AvoidableType[];
}

// Checklist para Matemática (M1/M2)
const ITEMS: ChecklistItem[] = [
  { text: '¿Leíste las 5 alternativas antes de marcar?', types: ['marcado', 'apuro'] },
  { text: '¿Hay un "NO", "EXCEPTO" o "nunca" en el enunciado?', types: ['lectura'] },
  { text: '¿Revisaste el signo (+/−) y las unidades?', types: ['calculo'] },
  { text: '¿Rehiciste el cálculo clave una vez?', types: ['calculo', 'apuro', 'inferido'] },
];

interface PreSubmitChecklistProps {
  topType: AvoidableType | null;
}

/**
 * Recordatorio anti-error para Matemática, mostrado antes de contestar.
 * Colapsable y no bloqueante. Resalta el ítem del tipo de error más frecuente del alumno.
 */
export function PreSubmitChecklist({ topType }: PreSubmitChecklistProps) {
  const [open, setOpen] = useState(false);

  const highlighted = topType ? ITEMS.find((i) => i.types.includes(topType)) : null;

  return (
    <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <ListChecks className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200 flex-1">
          {highlighted ? (
            <>Antes de marcar: <span className="font-normal">{highlighted.text}</span></>
          ) : (
            'Revisa antes de marcar'
          )}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </button>
      {open && (
        <ul className="px-3 pb-3 pt-0 space-y-1.5">
          {ITEMS.map((item, i) => {
            const isTop = topType != null && item.types.includes(topType);
            return (
              <li
                key={i}
                className={`text-sm flex items-start gap-2 ${
                  isTop
                    ? 'text-amber-900 dark:text-amber-100 font-medium'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="mt-0.5">☐</span>
                <span>{item.text}{isTop && ' ← tu error más común'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
