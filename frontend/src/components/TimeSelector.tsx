import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  selectedTime: number;
  onTimeChange: (minutes: number) => void;
}

const timeOptions = [
  { value: 1, label: '1 min' },
  { value: 1.5, label: '1.5 min' },
  { value: 2, label: '2 min' },
  { value: 2.5, label: '2.5 min' },
  { value: 3, label: '3 min' },
  { value: 5, label: '5 min' },
];

export function TimeSelector({ selectedTime, onTimeChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Clock className="w-5 h-5" />
        <span className="font-medium">Tiempo por pregunta:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {timeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTime === option.value
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
