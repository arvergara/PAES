import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, ChevronDown, Calculator, Languages, FlaskConical, Landmark, Atom, Leaf, TestTube } from 'lucide-react';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubjectKey = 'M1' | 'M2' | 'L' | 'C' | 'H';

interface SubjectContent {
  name: string;
  icon: React.ReactNode;
  color: string;
  areas: {
    name: string;
    temas: {
      name: string;
      subtemas: string[];
    }[];
  }[];
}

const subjectContents: Record<SubjectKey, SubjectContent> = {
  M1: {
    name: 'Competencia Matemática 1 (M1)',
    icon: <Calculator className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    areas: [
      {
        name: 'Números',
        temas: [
          {
            name: 'Conjunto de los números enteros',
            subtemas: [
              'Operaciones y orden en los números enteros',
              'Problemas que involucren números enteros'
            ]
          },
          {
            name: 'Conjunto de los números racionales',
            subtemas: [
              'Fracciones y decimales',
              'Operaciones con números racionales',
              'Razones, proporciones y porcentajes',
              'Potencias de base racional y exponente entero'
            ]
          },
          {
            name: 'Conjunto de los números reales',
            subtemas: [
              'Raíces n-ésimas',
              'Potencias de exponente racional',
              'Logaritmos'
            ]
          }
        ]
      },
      {
        name: 'Álgebra y Funciones',
        temas: [
          {
            name: 'Expresiones algebraicas',
            subtemas: [
              'Lenguaje algebraico',
              'Productos notables y factorización',
              'Operaciones con expresiones algebraicas'
            ]
          },
          {
            name: 'Ecuaciones',
            subtemas: [
              'Ecuaciones de primer grado',
              'Sistemas de ecuaciones lineales (2x2)',
              'Ecuaciones de segundo grado',
              'Ecuaciones que involucren raíces y potencias'
            ]
          },
          {
            name: 'Funciones',
            subtemas: [
              'Concepto de función',
              'Función lineal y afín',
              'Función cuadrática',
              'Función potencia y raíz cuadrada',
              'Función exponencial y logarítmica'
            ]
          },
          {
            name: 'Inecuaciones',
            subtemas: [
              'Inecuaciones de primer grado',
              'Inecuaciones de segundo grado'
            ]
          }
        ]
      },
      {
        name: 'Geometría',
        temas: [
          {
            name: 'Geometría plana',
            subtemas: [
              'Ángulos y rectas',
              'Triángulos: propiedades y clasificación',
              'Cuadriláteros y polígonos',
              'Circunferencia y círculo',
              'Perímetros y áreas'
            ]
          },
          {
            name: 'Geometría en el espacio',
            subtemas: [
              'Cuerpos geométricos',
              'Áreas y volúmenes de prismas y cilindros',
              'Áreas y volúmenes de pirámides y conos',
              'Esfera'
            ]
          },
          {
            name: 'Transformaciones isométricas',
            subtemas: [
              'Traslación, rotación y reflexión',
              'Composición de transformaciones'
            ]
          },
          {
            name: 'Semejanza y homotecia',
            subtemas: [
              'Figuras semejantes',
              'Teorema de Thales',
              'Homotecia'
            ]
          }
        ]
      },
      {
        name: 'Probabilidad y Estadística',
        temas: [
          {
            name: 'Estadística descriptiva',
            subtemas: [
              'Tablas y gráficos estadísticos',
              'Medidas de tendencia central',
              'Medidas de posición (percentiles, cuartiles)',
              'Medidas de dispersión'
            ]
          },
          {
            name: 'Probabilidad',
            subtemas: [
              'Experimentos aleatorios',
              'Regla de Laplace',
              'Probabilidad condicional',
              'Eventos independientes'
            ]
          }
        ]
      }
    ]
  },
  M2: {
    name: 'Competencia Matemática 2 (M2)',
    icon: <Calculator className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    areas: [
      {
        name: 'Números',
        temas: [
          {
            name: 'Números complejos',
            subtemas: [
              'Definición y representación',
              'Operaciones con números complejos',
              'Forma polar y trigonométrica'
            ]
          }
        ]
      },
      {
        name: 'Álgebra y Funciones',
        temas: [
          {
            name: 'Sucesiones y series',
            subtemas: [
              'Sucesiones aritméticas',
              'Sucesiones geométricas',
              'Suma de términos'
            ]
          },
          {
            name: 'Funciones avanzadas',
            subtemas: [
              'Composición de funciones',
              'Función inversa',
              'Funciones trigonométricas',
              'Ecuaciones trigonométricas'
            ]
          },
          {
            name: 'Geometría analítica',
            subtemas: [
              'Sistema de coordenadas cartesianas',
              'Ecuación de la recta',
              'Distancia y punto medio',
              'Circunferencia y parábola',
              'Elipse e hipérbola'
            ]
          }
        ]
      },
      {
        name: 'Geometría',
        temas: [
          {
            name: 'Trigonometría',
            subtemas: [
              'Razones trigonométricas en triángulos rectángulos',
              'Identidades trigonométricas',
              'Teorema del seno y del coseno',
              'Resolución de triángulos'
            ]
          },
          {
            name: 'Vectores',
            subtemas: [
              'Vectores en el plano',
              'Operaciones con vectores',
              'Producto punto y aplicaciones'
            ]
          }
        ]
      },
      {
        name: 'Probabilidad y Estadística',
        temas: [
          {
            name: 'Técnicas de conteo',
            subtemas: [
              'Principio multiplicativo',
              'Permutaciones',
              'Combinaciones'
            ]
          },
          {
            name: 'Variables aleatorias',
            subtemas: [
              'Variables aleatorias discretas',
              'Distribución binomial',
              'Variables aleatorias continuas',
              'Distribución normal'
            ]
          },
          {
            name: 'Inferencia estadística',
            subtemas: [
              'Muestreo',
              'Intervalos de confianza',
              'Pruebas de hipótesis'
            ]
          }
        ]
      }
    ]
  },
  L: {
    name: 'Competencia Lectora',
    icon: <Languages className="w-6 h-6" />,
    color: 'from-red-500 to-red-600',
    areas: [
      {
        name: 'Localizar',
        temas: [
          {
            name: 'Acceder y recuperar información',
            subtemas: [
              'Identificar información explícita',
              'Localizar datos específicos en el texto',
              'Reconocer información literal'
            ]
          }
        ]
      },
      {
        name: 'Interpretar',
        temas: [
          {
            name: 'Integrar e interpretar',
            subtemas: [
              'Inferir información implícita',
              'Interpretar lenguaje figurado',
              'Sintetizar información',
              'Establecer relaciones entre ideas',
              'Interpretar el significado de palabras en contexto'
            ]
          },
          {
            name: 'Comprender estructura textual',
            subtemas: [
              'Identificar tipo de texto',
              'Reconocer propósito comunicativo',
              'Analizar organización del texto'
            ]
          }
        ]
      },
      {
        name: 'Evaluar',
        temas: [
          {
            name: 'Reflexionar y evaluar',
            subtemas: [
              'Evaluar contenido del texto',
              'Evaluar forma y estructura',
              'Reflexionar sobre propósito del autor',
              'Evaluar uso de recursos lingüísticos',
              'Evaluar argumentación y evidencias'
            ]
          }
        ]
      }
    ]
  },
  C: {
    name: 'Ciencias',
    icon: <FlaskConical className="w-6 h-6" />,
    color: 'from-emerald-500 to-emerald-600',
    areas: [
      {
        name: 'Biología',
        temas: [
          {
            name: 'Organización, estructura y actividad celular',
            subtemas: [
              'Estructura y función celular',
              'Membrana celular y transporte',
              'Metabolismo celular',
              'Ciclo celular y división'
            ]
          },
          {
            name: 'Procesos y funciones biológicas',
            subtemas: [
              'Sistemas del cuerpo humano',
              'Regulación y homeostasis',
              'Sistema nervioso y endocrino',
              'Sistema inmunológico'
            ]
          },
          {
            name: 'Herencia y evolución',
            subtemas: [
              'Genética mendeliana',
              'Bases moleculares de la herencia',
              'Mutaciones y variabilidad',
              'Evolución y selección natural'
            ]
          },
          {
            name: 'Organismo y ambiente',
            subtemas: [
              'Ecología y ecosistemas',
              'Flujo de materia y energía',
              'Ciclos biogeoquímicos',
              'Impacto ambiental'
            ]
          }
        ]
      },
      {
        name: 'Física',
        temas: [
          {
            name: 'Ondas',
            subtemas: [
              'Movimiento ondulatorio',
              'Ondas mecánicas y electromagnéticas',
              'Sonido y luz',
              'Óptica geométrica'
            ]
          },
          {
            name: 'Mecánica',
            subtemas: [
              'Cinemática',
              'Dinámica y leyes de Newton',
              'Trabajo, energía y potencia',
              'Momentum y colisiones'
            ]
          },
          {
            name: 'Electricidad y magnetismo',
            subtemas: [
              'Carga eléctrica y ley de Coulomb',
              'Circuitos eléctricos',
              'Magnetismo',
              'Electromagnetismo'
            ]
          },
          {
            name: 'Energía',
            subtemas: [
              'Formas de energía',
              'Transformación y conservación',
              'Termodinámica',
              'Energías renovables'
            ]
          }
        ]
      },
      {
        name: 'Química',
        temas: [
          {
            name: 'Estructura atómica',
            subtemas: [
              'Modelos atómicos',
              'Configuración electrónica',
              'Tabla periódica',
              'Propiedades periódicas'
            ]
          },
          {
            name: 'Química orgánica',
            subtemas: [
              'Hidrocarburos',
              'Grupos funcionales',
              'Isomería',
              'Reacciones orgánicas'
            ]
          },
          {
            name: 'Reacciones químicas',
            subtemas: [
              'Tipos de reacciones',
              'Estequiometría',
              'Equilibrio químico',
              'Cinética química'
            ]
          },
          {
            name: 'Disoluciones',
            subtemas: [
              'Propiedades de las disoluciones',
              'Concentración',
              'Propiedades coligativas',
              'Ácidos, bases y pH'
            ]
          }
        ]
      }
    ]
  },
  H: {
    name: 'Historia y Ciencias Sociales',
    icon: <Landmark className="w-6 h-6" />,
    color: 'from-amber-500 to-amber-600',
    areas: [
      {
        name: 'Historia Universal',
        temas: [
          {
            name: 'Antigüedad clásica',
            subtemas: [
              'Grecia: democracia y filosofía',
              'Roma: república e imperio',
              'Legado cultural clásico'
            ]
          },
          {
            name: 'Edad Media',
            subtemas: [
              'Feudalismo',
              'Iglesia y cultura medieval',
              'Expansión del Islam'
            ]
          },
          {
            name: 'Edad Moderna',
            subtemas: [
              'Renacimiento y Humanismo',
              'Reforma y Contrarreforma',
              'Expansión europea',
              'Ilustración y revoluciones'
            ]
          },
          {
            name: 'Edad Contemporánea',
            subtemas: [
              'Revolución Industrial',
              'Guerras mundiales',
              'Guerra Fría',
              'Globalización'
            ]
          }
        ]
      },
      {
        name: 'Historia de Chile',
        temas: [
          {
            name: 'Chile colonial',
            subtemas: [
              'Conquista y resistencia mapuche',
              'Sociedad colonial',
              'Economía colonial'
            ]
          },
          {
            name: 'Independencia y República',
            subtemas: [
              'Proceso de independencia',
              'Organización de la República',
              'Expansión territorial'
            ]
          },
          {
            name: 'Siglo XX',
            subtemas: [
              'Crisis y transformaciones',
              'Gobiernos radicales',
              'Reformas estructurales',
              'Dictadura y transición'
            ]
          },
          {
            name: 'Chile contemporáneo',
            subtemas: [
              'Transición a la democracia',
              'Desarrollo económico y social',
              'Desafíos actuales'
            ]
          }
        ]
      },
      {
        name: 'Formación Ciudadana',
        temas: [
          {
            name: 'Estado y democracia',
            subtemas: [
              'Constitución y derechos',
              'Poderes del Estado',
              'Participación ciudadana',
              'Sistema electoral'
            ]
          },
          {
            name: 'Economía y sociedad',
            subtemas: [
              'Sistemas económicos',
              'Mercado y Estado',
              'Desigualdad y políticas públicas'
            ]
          }
        ]
      },
      {
        name: 'Geografía',
        temas: [
          {
            name: 'Geografía física',
            subtemas: [
              'Relieve y clima de Chile',
              'Regiones naturales',
              'Recursos naturales',
              'Riesgos naturales'
            ]
          },
          {
            name: 'Geografía humana',
            subtemas: [
              'Población y demografía',
              'Urbanización',
              'Actividades económicas',
              'Desarrollo sustentable'
            ]
          }
        ]
      }
    ]
  }
};

function SubjectSection({ subject, content }: { subject: SubjectKey; content: SubjectContent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const [expandedTemas, setExpandedTemas] = useState<Record<string, boolean>>({});

  const toggleArea = (areaName: string) => {
    setExpandedAreas(prev => ({ ...prev, [areaName]: !prev[areaName] }));
  };

  const toggleTema = (temaKey: string) => {
    setExpandedTemas(prev => ({ ...prev, [temaKey]: !prev[temaKey] }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between bg-gradient-to-r ${content.color} text-white`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {content.icon}
          </div>
          <span className="font-bold text-lg">{content.name}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <ChevronRight className="w-6 h-6" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {content.areas.map((area, areaIdx) => (
            <div key={areaIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleArea(area.name)}
                className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-100">{area.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {area.temas.length} temas
                  </span>
                  {expandedAreas[area.name] ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedAreas[area.name] && (
                <div className="p-3 space-y-3">
                  {area.temas.map((tema, temaIdx) => {
                    const temaKey = `${area.name}-${tema.name}`;
                    return (
                      <div key={temaIdx} className="ml-2">
                        <button
                          onClick={() => toggleTema(temaKey)}
                          className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{tema.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {tema.subtemas.length} subtemas
                            </span>
                            {expandedTemas[temaKey] ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {expandedTemas[temaKey] && (
                          <ul className="ml-6 mt-2 space-y-1">
                            {tema.subtemas.map((subtema, subIdx) => (
                              <li
                                key={subIdx}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-1"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {subtema}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContentModal({ isOpen, onClose }: ContentModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subjects: SubjectKey[] = ['M1', 'M2', 'L', 'C', 'H'];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Contenidos PAES</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Temario oficial por materia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>💡 Tip:</strong> Haz clic en cada materia para ver sus áreas temáticas, temas y subtemas. 
              Usa esta guía para planificar tu estudio y conocer qué contenidos puedes encontrar en la PAES.
            </p>
          </div>

          {subjects.map((subject) => (
            <SubjectSection
              key={subject}
              subject={subject}
              content={subjectContents[subject]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
