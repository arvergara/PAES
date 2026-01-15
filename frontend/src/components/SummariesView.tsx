import { useState } from 'react';
import { X, BookOpen, Calculator, Brain, FlaskRound as Flask, History, FileText, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SummariesViewProps {
  onClose: () => void;
}

const subjects = [
  { code: 'M1', name: 'Matemática 1', icon: Calculator, color: 'from-blue-500 to-blue-700', topics: ['Álgebra', 'Funciones', 'Ecuaciones', 'Inecuaciones'] },
  { code: 'M2', name: 'Matemática 2', icon: Brain, color: 'from-purple-500 to-purple-700', topics: ['Geometría', 'Probabilidad', 'Estadística', 'Trigonometría'] },
  { code: 'L', name: 'Lenguaje', icon: BookOpen, color: 'from-rose-500 to-rose-700', topics: ['Comprensión Lectora', 'Vocabulario', 'Conectores', 'Plan de Redacción'] },
  { code: 'C', name: 'Ciencias', icon: Flask, color: 'from-emerald-500 to-emerald-700', topics: ['Física', 'Química', 'Biología'] },
  { code: 'H', name: 'Historia', icon: History, color: 'from-amber-500 to-amber-700', topics: ['Historia de Chile', 'Historia Universal', 'Geografía', 'Educación Cívica'] },
];

export function SummariesView({ onClose }: SummariesViewProps) {
  const { isDark } = useTheme();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const selected = subjects.find(s => s.code === selectedSubject);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Resúmenes PAES</h1>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {!selectedSubject ? (
          <>
            <p className={`text-center mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Selecciona una materia para ver los resúmenes disponibles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <button
                    key={subject.code}
                    onClick={() => setSelectedSubject(subject.code)}
                    className={`p-6 rounded-2xl text-white text-left transition-all hover:scale-[1.02] hover:-translate-y-1 bg-gradient-to-br ${subject.color}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold">{subject.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subject.topics.slice(0, 3).map(topic => (
                        <span key={topic} className="px-2 py-1 bg-white/20 rounded text-xs">{topic}</span>
                      ))}
                      {subject.topics.length > 3 && (
                        <span className="px-2 py-1 bg-white/20 rounded text-xs">+{subject.topics.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedSubject(null)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>
              Volver a materias
            </button>

            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selected?.name}
            </h2>

            <div className="space-y-3 max-w-2xl">
              {selected?.topics.map((topic, index) => (
                <div
                  key={topic}
                  className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                      {index + 1}
                    </span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Próximamente</span>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-8 p-6 rounded-xl text-center ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                📚 Los resúmenes detallados estarán disponibles próximamente
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
