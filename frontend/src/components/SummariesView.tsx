import { useState, useMemo, useRef, useEffect } from 'react';
import { X, BookOpen, Calculator, Brain, FlaskRound as Flask, History, FileText, ChevronRight, ChevronLeft, Search, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SummariesViewProps {
  onClose: () => void;
}

interface SubjectDef {
  code: string;
  name: string;
  icon: typeof Calculator;
  color: string;
  chipColor: string;
  topics: string[];
}

const subjects: SubjectDef[] = [
  {
    code: 'M1', name: 'Matemática M1', icon: Calculator,
    color: 'from-blue-500 to-blue-700', chipColor: 'bg-blue-600',
    topics: [
      'Números enteros', 'Números racionales', 'Potencias y raíces', 'Porcentajes',
      'Expresiones algebraicas', 'Ecuaciones de primer grado', 'Inecuaciones',
      'Sistemas de ecuaciones', 'Funciones', 'Función cuadrática', 'Proporcionalidad',
      'Geometría', 'Cuerpos geométricos', 'Transformaciones isométricas', 'Probabilidad y estadística'
    ]
  },
  {
    code: 'M2', name: 'Matemática M2', icon: Brain,
    color: 'from-indigo-500 to-indigo-700', chipColor: 'bg-indigo-600',
    topics: [
      'Números complejos', 'Funciones avanzadas', 'Geometría analítica', 'Trigonometría',
      'Logaritmos', 'Homotecia', 'Combinatoria', 'Medidas de dispersión',
      'Matemática financiera', 'Vectores', 'Cónicas', 'Probabilidad condicional'
    ]
  },
  {
    code: 'L', name: 'Lenguaje', icon: BookOpen,
    color: 'from-green-500 to-green-700', chipColor: 'bg-green-600',
    topics: [
      'Géneros literarios', 'Figuras literarias', 'Comprensión lectora',
      'Tipos de narrador', 'Argumentación'
    ]
  },
  {
    code: 'H', name: 'Historia', icon: History,
    color: 'from-amber-500 to-amber-700', chipColor: 'bg-amber-600',
    topics: [
      'Paleolítico y Neolítico', 'Civilizaciones antiguas', 'Grecia y Roma', 'Edad Media',
      'Renacimiento y Humanismo', 'Civilizaciones precolombinas', 'Pueblos originarios',
      'Colonia chilena', 'Independencia de Chile', 'República siglo XIX',
      'Revolución Industrial', 'Imperialismo', 'Primera Guerra Mundial', 'Revolución Rusa',
      'Totalitarismos', 'Segunda Guerra Mundial', 'Chile siglo XX', 'Régimen militar',
      'Guerra Fría', 'Globalización', 'Cuestión social', 'Derechos humanos',
      'Democracia y ciudadanía', 'Sistema económico'
    ]
  },
  {
    code: 'CB', name: 'Biología', icon: Flask,
    color: 'from-emerald-500 to-emerald-700', chipColor: 'bg-emerald-600',
    topics: [
      'Estructura celular', 'ADN y ARN', 'Sistema nervioso', 'Sistema endocrino',
      'Sistema circulatorio', 'Sistema digestivo', 'Sistema respiratorio', 'Sistema excretor',
      'Sistema reproductor', 'Ecología', 'Genética mendeliana', 'Evolución',
      'Fotosíntesis y respiración', 'Mitosis y meiosis', 'Barreras defensivas'
    ]
  },
  {
    code: 'CF', name: 'Física', icon: Brain,
    color: 'from-purple-500 to-purple-700', chipColor: 'bg-purple-600',
    topics: [
      'Cinemática', 'Leyes de Newton', 'Trabajo y energía', 'Momentum y colisiones',
      'Movimiento circular', 'Electricidad', 'Electrostática', 'Óptica',
      'Ondas y sonido', 'Espectro electromagnético', 'Tectónica de placas'
    ]
  },
  {
    code: 'CQ', name: 'Química', icon: Flask,
    color: 'from-rose-500 to-rose-700', chipColor: 'bg-rose-600',
    topics: [
      'Estructura atómica', 'Enlace químico', 'Reacciones químicas', 'Estequiometría',
      'Soluciones químicas', 'Ácidos y bases', 'Química orgánica', 'Sustancias y mezclas'
    ]
  },
];

// Total topics
const TOTAL_TOPICS = subjects.reduce((sum, s) => sum + s.topics.length, 0);

// Build reverse index: topic -> subject code
const topicToSubject: Record<string, string> = {};
subjects.forEach(s => s.topics.forEach(t => { topicToSubject[t] = s.code; }));

// Normalize for accent-insensitive search
const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function SummariesView({ onClose }: SummariesViewProps) {
  const { isDark } = useTheme();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const selected = subjects.find(s => s.code === selectedSubject);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Filter + search logic
  const filteredResults = useMemo(() => {
    const query = normalize(searchQuery.trim());
    const terms = query.split(/\s+/).filter(t => t.length > 0);
    const hasSearch = terms.length > 0;
    const hasFilter = activeFilter !== null;

    if (!hasSearch && !hasFilter) return null;

    const results: { subject: SubjectDef; matchedTopics: string[]; scores: Record<string, number> }[] = [];

    subjects.forEach(subject => {
      // Apply materia filter
      if (hasFilter && subject.code !== activeFilter) return;

      if (!hasSearch) {
        // Filter only, no search: show all topics of this materia
        results.push({ subject, matchedTopics: subject.topics, scores: {} });
        return;
      }

      const subjectNorm = normalize(subject.name);
      const subjectMatch = terms.some(t => subjectNorm.includes(t));

      const matchedTopics: string[] = [];
      const scores: Record<string, number> = {};

      subject.topics.forEach(topic => {
        const topicNorm = normalize(topic);
        const allInTopic = terms.every(t => topicNorm.includes(t));
        const someInTopic = terms.some(t => topicNorm.includes(t));

        if (allInTopic) {
          matchedTopics.push(topic);
          scores[topic] = 100;
        } else if (someInTopic) {
          matchedTopics.push(topic);
          scores[topic] = 70;
        } else if (subjectMatch) {
          matchedTopics.push(topic);
          scores[topic] = 30;
        }
      });

      if (matchedTopics.length > 0) {
        results.push({ subject, matchedTopics, scores });
      }
    });

    // Sort results: highest score subjects first
    results.sort((a, b) => {
      const maxA = Math.max(...Object.values(a.scores), 0);
      const maxB = Math.max(...Object.values(b.scores), 0);
      return maxB - maxA;
    });

    return results;
  }, [searchQuery, activeFilter]);

  const handleSelectSubject = (code: string) => {
    setSelectedSubject(code);
    setSelectedTopic(null);
    setSearchQuery('');
    setActiveFilter(null);
  };

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else {
      setSelectedSubject(null);
    }
  };

  const toggleFilter = (code: string | null) => {
    setActiveFilter(prev => prev === code ? null : code);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const openExternalSummary = (topic: string) => {
    // Open the standalone HTML resumenes page
    window.open('/resumenes.html', '_blank');
  };

  // Check if we're in search/filter mode
  const isSearchMode = filteredResults !== null;
  const totalResults = filteredResults
    ? filteredResults.reduce((sum, r) => sum + r.matchedTopics.length, 0)
    : 0;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Resúmenes PAES
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {TOTAL_TOPICS} temas · {subjects.length} materias
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto mb-3">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema... (ej: Newton, fotosíntesis, Guerra Fría)"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500 focus:bg-white/10'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-gray-50'
              } outline-none`}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div
            ref={chipsRef}
            className="flex gap-2 max-w-lg mx-auto overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style>{`.chips-scroll::-webkit-scrollbar { display: none; }`}</style>
            <button
              onClick={() => toggleFilter(null)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                activeFilter === null
                  ? isDark
                    ? 'bg-white/20 text-white ring-2 ring-white/30'
                    : 'bg-gray-800 text-white ring-2 ring-gray-400'
                  : isDark
                    ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {subjects.map(s => {
              const isActive = activeFilter === s.code;
              return (
                <button
                  key={s.code}
                  onClick={() => toggleFilter(s.code)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `${s.chipColor} text-white ring-2 ring-white/40 shadow-lg`
                      : isDark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* ====================== SEARCH / FILTER RESULTS ====================== */}
        {isSearchMode ? (
          filteredResults.length > 0 ? (
            <>
              <p className={`text-center mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalResults} tema{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                {searchQuery && <> para "<span className="font-medium">{searchQuery}</span>"</>}
                {activeFilter && <> en <span className="font-medium">{subjects.find(s => s.code === activeFilter)?.name}</span></>}
              </p>
              <div className="space-y-5 max-w-2xl mx-auto">
                {filteredResults.map(({ subject, matchedTopics, scores }) => {
                  const Icon = subject.icon;
                  return (
                    <div
                      key={subject.code}
                      className={`rounded-2xl overflow-hidden ${
                        isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                      }`}
                    >
                      {/* Subject header */}
                      <button
                        onClick={() => handleSelectSubject(subject.code)}
                        className={`w-full p-4 flex items-center gap-3 transition-colors ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${subject.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {subject.name}
                          </span>
                          <span className={`block text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {matchedTopics.length} de {subject.topics.length} temas
                          </span>
                        </div>
                        <ChevronRight className={`w-5 h-5 ml-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      </button>

                      {/* Matched topics */}
                      <div className={`px-4 pb-4 ${isDark ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {matchedTopics.map(topic => {
                            const score = scores[topic] || 0;
                            const isStrong = score >= 70;
                            return (
                              <button
                                key={topic}
                                onClick={() => {
                                  handleSelectSubject(subject.code);
                                  // Small delay to let subject render, then we could scroll to topic
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                  isStrong
                                    ? isDark
                                      ? 'bg-indigo-500/25 text-indigo-300 hover:bg-indigo-500/35'
                                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    : isDark
                                      ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                {topic}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Search className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No se encontraron resultados
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Intenta con otros términos como "álgebra", "Newton" o "Guerra Fría"
              </p>
            </div>
          )

        /* ====================== SUBJECT LIST (home) ====================== */
        ) : !selectedSubject ? (
          <>
            <p className={`text-center mb-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Selecciona una materia para explorar los resúmenes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <button
                    key={subject.code}
                    onClick={() => handleSelectSubject(subject.code)}
                    className={`p-5 rounded-2xl text-white text-left transition-all hover:scale-[1.02] hover:-translate-y-1 bg-gradient-to-br ${subject.color} shadow-lg`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/20 rounded-xl">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold">{subject.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subject.topics.slice(0, 3).map(topic => (
                        <span key={topic} className="px-2 py-0.5 bg-white/20 rounded text-xs">{topic}</span>
                      ))}
                      {subject.topics.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                          +{subject.topics.length - 3} más
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-xs mt-3">{subject.topics.length} temas</p>
                  </button>
                );
              })}
            </div>

            {/* Link to full HTML summaries */}
            <div className="mt-10 text-center">
              <a
                href="/resumenes.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Ver resúmenes completos
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </>

        /* ====================== TOPIC LIST (inside a subject) ====================== */
        ) : (
          <>
            <button
              onClick={handleBack}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 transition-colors ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a materias
            </button>

            {/* Subject banner */}
            {selected && (
              <div className={`bg-gradient-to-r ${selected.color} p-5 rounded-2xl mb-6 flex items-center gap-4`}>
                <div className="p-3 bg-white/20 rounded-xl">
                  <selected.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-white/60 text-sm">{selected.topics.length} temas con resúmenes</p>
                </div>
              </div>
            )}

            {/* Topics grid */}
            <div className="space-y-2.5 max-w-2xl">
              {selected?.topics.map((topic, index) => (
                <button
                  key={topic}
                  onClick={() => openExternalSummary(topic)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`font-medium text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      Ver resumen
                    </span>
                    <ExternalLink className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* CTA to full summaries page */}
            <div className="mt-8 text-center">
              <a
                href="/resumenes.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Abrir resúmenes completos
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}