import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, ChevronDown, Calculator, Languages, Landmark, Clock, FileText, Sparkles } from 'lucide-react';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubjectKey = 'M1' | 'M2' | 'L' | 'C' | 'H';

interface SubjectContent {
  name: string;
  shortName: string;
  fullName: string;
  icon: React.ReactNode;
  gradient: string;
  bgGlow: string;
  borderColor: string;
  description: string;
  reference: string;
  duration: string;
  questions: string;
  areas: {
    name: string;
    temas: {
      name: string;
      subtemas: string[];
    }[];
  }[];
}

// Temarios oficiales PAES 2026 - Fuente: DEMRE
const subjectContents: Record<SubjectKey, SubjectContent> = {
  M1: {
    name: 'Competencia Matemática 1',
    shortName: 'M1',
    fullName: 'PAES de Competencia Matemática 1',
    icon: <Calculator className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30 hover:border-blue-500/50',
    description: 'Prueba obligatoria que evalúa habilidades matemáticas para la vida cotidiana.',
    reference: '7° básico a 2° medio',
    duration: '2h 20min',
    questions: '65 preguntas',
    areas: [
      {
        name: 'Números',
        temas: [
          {
            name: 'Conjunto de los números enteros y racionales',
            subtemas: [
              'Operaciones y orden en el conjunto de los números enteros',
              'Operaciones y comparación entre números en el conjunto de los números racionales',
              'Problemas que involucren el conjunto de los números enteros y racionales en diversos contextos'
            ]
          },
          {
            name: 'Porcentaje',
            subtemas: [
              'Concepto y cálculo de porcentaje',
              'Problemas que involucren porcentaje en diversos contextos'
            ]
          },
          {
            name: 'Potencias y raíces enésimas',
            subtemas: [
              'Propiedades de las potencias de base racional y exponente racional',
              'Descomposición y propiedades de las raíces enésimas en los números reales',
              'Problemas que involucren potencias y raíces enésimas en los números reales en diversos contextos'
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
              'Productos notables',
              'Factorizaciones y desarrollo de expresiones algebraicas',
              'Operatoria con expresiones algebraicas',
              'Problemas que involucren expresiones algebraicas en diversos contextos'
            ]
          },
          {
            name: 'Proporcionalidad',
            subtemas: [
              'Concepto de proporción directa e inversa con sus diferentes representaciones',
              'Problemas que involucren proporción directa e inversa en diversos contextos'
            ]
          },
          {
            name: 'Ecuaciones e inecuaciones de primer grado',
            subtemas: [
              'Resolución de ecuaciones lineales',
              'Problemas que involucren ecuaciones lineales en diversos contextos',
              'Resolución de inecuaciones lineales',
              'Problemas que involucren inecuaciones lineales en diversos contextos'
            ]
          },
          {
            name: 'Sistemas de ecuaciones lineales (2x2)',
            subtemas: [
              'Resolución de sistemas de ecuaciones lineales',
              'Problemas que involucren sistemas de ecuaciones lineales en diversos contextos'
            ]
          },
          {
            name: 'Función lineal y afín',
            subtemas: [
              'Concepto de función lineal y función afín',
              'Tablas y gráficos de función lineal y función afín',
              'Problemas que involucren función lineal y función afín en diversos contextos'
            ]
          },
          {
            name: 'Función cuadrática',
            subtemas: [
              'Resolución y problemas de ecuaciones de segundo grado en diversos contextos',
              'Tablas y gráficos de la función cuadrática, considerando la variación de sus parámetros',
              'Puntos especiales de la gráfica de la función cuadrática: vértice, ceros de la función e intersección con los ejes',
              'Problemas que involucren la función cuadrática en diversos contextos'
            ]
          }
        ]
      },
      {
        name: 'Geometría',
        temas: [
          {
            name: 'Figuras geométricas',
            subtemas: [
              'Problemas que involucren el Teorema de Pitágoras en diversos contextos',
              'Perímetro y áreas de triángulos, paralelogramos, trapecios y círculos',
              'Problemas que involucren perímetro y áreas de triángulos, paralelogramos, trapecios y círculos en diversos contextos'
            ]
          },
          {
            name: 'Cuerpos geométricos',
            subtemas: [
              'Área de superficies de paralelepípedos y cubos',
              'Volumen de paralelepípedos y cubos',
              'Problemas que involucren área y volumen de paralelepípedos y cubos en diversos contextos'
            ]
          },
          {
            name: 'Transformaciones isométricas',
            subtemas: [
              'Puntos y vectores en el plano cartesiano',
              'Rotación, traslación y reflexión de figuras geométricas',
              'Problemas que involucren rotación, traslación y reflexión en diversos contextos'
            ]
          }
        ]
      },
      {
        name: 'Probabilidad y Estadística',
        temas: [
          {
            name: 'Representación de datos a través de tablas y gráficos',
            subtemas: [
              'Tablas de frecuencia absoluta y relativa',
              'Tipos de gráficos que permitan representar datos',
              'Promedio de un conjunto de datos',
              'Problemas que involucren tablas y gráficos en diversos contextos'
            ]
          },
          {
            name: 'Medidas de posición',
            subtemas: [
              'Cuartiles y percentiles de uno o más grupos de datos',
              'Diagrama de cajón para representar distribución de datos',
              'Problemas que involucren medidas de posición en diversos contextos'
            ]
          },
          {
            name: 'Reglas de las probabilidades',
            subtemas: [
              'Problemas que involucren probabilidad de un evento en diversos contextos',
              'Problemas que involucren la regla aditiva y multiplicativa de probabilidades en diversos contextos'
            ]
          }
        ]
      }
    ]
  },
  M2: {
    name: 'Competencia Matemática 2',
    shortName: 'M2',
    fullName: 'PAES de Competencia Matemática 2',
    icon: <Calculator className="w-5 h-5" />,
    gradient: 'from-purple-500 to-pink-500',
    bgGlow: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    description: 'Prueba electiva para carreras científicas. Incluye todo M1 + contenidos adicionales.',
    reference: '7° básico a 4° medio',
    duration: '2h 20min',
    questions: '55 preguntas',
    areas: [
      {
        name: 'Números (adicional a M1)',
        temas: [
          {
            name: 'Conjunto de los números reales',
            subtemas: [
              'Operaciones en el conjunto de los números reales',
              'Problemas que involucren el conjunto de los números reales en diversos contextos'
            ]
          },
          {
            name: 'Matemática financiera',
            subtemas: [
              'Problemas relacionados con el ámbito de las finanzas (AFP y jubilación, créditos hipotecarios, crédito de consumo)'
            ]
          },
          {
            name: 'Logaritmos',
            subtemas: [
              'Relación entre potencias, raíces y logaritmos, y sus propiedades',
              'Problemas que involucren logaritmos en diversos contextos'
            ]
          }
        ]
      },
      {
        name: 'Álgebra y Funciones (adicional a M1)',
        temas: [
          {
            name: 'Sistemas de ecuaciones lineales (2x2) - casos',
            subtemas: [
              'Casos en los cuales un sistema tiene una única solución, infinitas soluciones o no tiene solución'
            ]
          },
          {
            name: 'Función potencia, exponencial y logarítmica',
            subtemas: [
              'Gráfico de la función potencia, exponencial y logarítmica',
              'Problemas que involucren la función potencia, exponencial y logarítmica en diversos contextos'
            ]
          },
          {
            name: 'Funciones trigonométricas',
            subtemas: [
              'Gráfico de las funciones trigonométricas seno y coseno',
              'Problemas que involucren las funciones trigonométricas seno y coseno en diversos contextos'
            ]
          }
        ]
      },
      {
        name: 'Geometría (adicional a M1)',
        temas: [
          {
            name: 'Homotecia de figuras planas',
            subtemas: [
              'Problemas que involucren homotecia en diversos contextos'
            ]
          },
          {
            name: 'Razones trigonométricas en triángulos rectángulos',
            subtemas: [
              'Razones trigonométricas: seno, coseno y tangente',
              'Problemas que involucren razones trigonométricas en diversos contextos'
            ]
          },
          {
            name: 'Relaciones métricas en la circunferencia',
            subtemas: [
              'Ángulos y arcos en la circunferencia',
              'Cuerdas y secantes en la circunferencia',
              'Problemas que involucren las relaciones métricas en la circunferencia en diversos contextos'
            ]
          }
        ]
      },
      {
        name: 'Probabilidad y Estadística (adicional a M1)',
        temas: [
          {
            name: 'Medidas de dispersión',
            subtemas: [
              'Medidas de dispersión de uno o más grupos de datos',
              'Problemas que involucren medidas de dispersión en diversos contextos'
            ]
          },
          {
            name: 'Probabilidad condicional',
            subtemas: [
              'Problemas que involucren probabilidad condicional y sus propiedades en diversos contextos'
            ]
          },
          {
            name: 'Permutación y combinatoria',
            subtemas: [
              'Permutación y combinatoria',
              'Problemas que involucren permutación y combinatoria en diversos contextos'
            ]
          },
          {
            name: 'Modelos probabilísticos',
            subtemas: [
              'Problemas que involucren modelos binomiales en diversos contextos',
              'Problemas que involucren la distribución normal en diversos contextos'
            ]
          }
        ]
      }
    ]
  },
  L: {
    name: 'Competencia Lectora',
    shortName: 'Lectora',
    fullName: 'PAES de Competencia Lectora',
    icon: <Languages className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
    description: 'Prueba obligatoria que evalúa comprensión de textos diversos.',
    reference: '7° básico a 2° medio',
    duration: '2h 30min',
    questions: '65 preguntas',
    areas: [
      {
        name: 'Habilidades evaluadas',
        temas: [
          {
            name: 'Localizar',
            subtemas: [
              'Extraer información explícita del texto',
              'Identificar información explícita formulada a través de sinónimos y de paráfrasis'
            ]
          },
          {
            name: 'Interpretar',
            subtemas: [
              'Establecer la relación (problema/solución, categoría/ejemplo, causa/consecuencia, etc.) entre distintas partes o entre distintas informaciones de un texto',
              'Elaborar inferencias sobre el significado local y global del texto a partir de marcas textuales',
              'Determinar el significado de una parte, párrafo, sección o de la globalidad del texto',
              'Sintetizar las ideas centrales de una sección o del texto',
              'Identificar la jerarquía de las ideas de una parte del texto',
              'Reconocer la función de un elemento textual (ejemplos, citas, figuras retóricas, etc.)'
            ]
          },
          {
            name: 'Evaluar',
            subtemas: [
              'Determinar la intención comunicativa del emisor(a) o narrador(a) en función del destinatario',
              'Juzgar la información presente en el texto (calidad, pertinencia, suficiencia o consistencia)',
              'Juzgar la forma en relación con la información del texto (registro, estructura, propósito, pertinencia o calidad)',
              'Calificar la posición, actitud o tono del emisor(a) o narrador(a) respecto de un elemento, idea o del texto completo',
              'Valorar la pertinencia de los recursos lingüísticos y no lingüísticos (imagen, color, tipografía, disposición gráfica)',
              'Valorar la información textual en relación con nuevos contextos'
            ]
          }
        ]
      },
      {
        name: 'Textos no literarios (expositivos y argumentativos)',
        temas: [
          {
            name: 'Conocimientos evaluados',
            subtemas: [
              'La información relevante para el sentido de la lectura',
              'El o los temas e ideas principales presentes en la lectura',
              'Las ideas que se entregan para apoyar una información de la lectura',
              'La tesis y la manera en que se presenta en la lectura',
              'Los argumentos que sostienen la tesis de la lectura',
              'Las ideologías, creencias y puntos de vista, o la manera en que se abordan',
              'La organización de las ideas en la lectura',
              'Las relaciones entre las ideas para construir razonamientos',
              'La distinción entre hechos y opiniones presentados en la lectura',
              'Los propósitos e intenciones de la lectura',
              'Los recursos lingüísticos y retóricos (imperativo, figuras literarias, modalizaciones, citas, intertextualidad, preguntas retóricas, etc.)',
              'Los recursos no lingüísticos (negritas, cursivas, imágenes, tablas, mapas, diagramas, etc.)',
              'Las estrategias utilizadas (humor, estereotipos, prejuicios, apelación a sentimientos, etc.)',
              'Las fallas en la argumentación (exageración, generalizaciones, descalificaciones personales, etc.)',
              'La perspectiva adoptada sobre el tema de la lectura',
              'La suficiencia, validez y confiabilidad de la información'
            ]
          }
        ]
      },
      {
        name: 'Textos literarios (narraciones)',
        temas: [
          {
            name: 'Conocimientos evaluados',
            subtemas: [
              'La información relevante para el sentido del relato',
              'La evolución, acciones, características, motivaciones, convicciones y dilemas de los personajes',
              'Las relaciones que establecen los personajes entre ellos',
              'Las características del tiempo y el espacio para la construcción del sentido del relato',
              'Las creencias o prejuicios presentes en el relato',
              'El o los temas presentes en el relato',
              'El conflicto o problema humano que se expresa a través del relato',
              'La relación de una parte del relato con su totalidad',
              'Los recursos literarios (orden de los acontecimientos, narración en primera/segunda/tercera persona, historias paralelas, saltos temporales, caja china, etc.)',
              'Los símbolos y tópicos literarios presentes en el relato',
              'Los personajes tipo (pícaro, avaro, seductor, madrastra, etc.) y estereotipos',
              'La influencia de la visión o perspectiva del narrador en el relato',
              'La relación del relato con otros textos y contextos'
            ]
          }
        ]
      }
    ]
  },
  C: {
    name: 'Ciencias',
    shortName: 'Ciencias',
    fullName: 'PAES de Ciencias',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-red-500 to-orange-500',
    bgGlow: 'bg-red-500/10',
    borderColor: 'border-red-500/30 hover:border-red-500/50',
    description: 'Prueba electiva. Módulo común + módulo electivo (Biología, Física o Química).',
    reference: '7° básico a 2° medio (común) + 3° y 4° medio (electivo)',
    duration: '2h 40min',
    questions: '80 preguntas',
    areas: [
      {
        name: 'Módulo Común',
        temas: [
          {
            name: 'Biología',
            subtemas: [
              'Célula: estructura y función',
              'Genética y herencia',
              'Evolución y biodiversidad',
              'Ecología y medio ambiente'
            ]
          },
          {
            name: 'Física',
            subtemas: [
              'Movimiento y fuerzas',
              'Energía y trabajo',
              'Ondas y sonido',
              'Electricidad y magnetismo'
            ]
          },
          {
            name: 'Química',
            subtemas: [
              'Estructura atómica',
              'Tabla periódica y propiedades',
              'Enlaces químicos',
              'Reacciones químicas'
            ]
          }
        ]
      },
      {
        name: 'Módulo Electivo (elige 1)',
        temas: [
          {
            name: 'Biología electivo',
            subtemas: [
              'Contenidos avanzados de biología celular y molecular',
              'Fisiología humana',
              'Biotecnología'
            ]
          },
          {
            name: 'Física electivo',
            subtemas: [
              'Mecánica avanzada',
              'Termodinámica',
              'Física moderna'
            ]
          },
          {
            name: 'Química electivo',
            subtemas: [
              'Química orgánica',
              'Termoquímica',
              'Equilibrio químico'
            ]
          }
        ]
      }
    ]
  },
  H: {
    name: 'Historia y Ciencias Sociales',
    shortName: 'Historia',
    fullName: 'PAES de Historia y Ciencias Sociales',
    icon: <Landmark className="w-5 h-5" />,
    gradient: 'from-amber-500 to-yellow-500',
    bgGlow: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    description: 'Prueba electiva que evalúa conocimientos históricos y formación ciudadana.',
    reference: '1° a 4° medio',
    duration: '2 horas',
    questions: '65 preguntas',
    areas: [
      {
        name: 'Habilidades evaluadas',
        temas: [
          {
            name: 'Pensamiento temporal y espacial',
            subtemas: [
              'Interpretar periodizaciones históricas',
              'Aplicar nociones temporales de duración, sucesión y simultaneidad a acontecimientos históricos',
              'Distinguir los diferentes ritmos o velocidades que presentan los procesos históricos y sociales',
              'Interpretar la distribución geográfica usando mapas, gráficos, cartogramas',
              'Analizar continuidad y cambio entre periodos y procesos históricos y sociales'
            ]
          },
          {
            name: 'Análisis de fuentes de información',
            subtemas: [
              'Distinguir las características de las fuentes de información históricas',
              'Comparar distintas interpretaciones sobre procesos y fenómenos históricos',
              'Comparar y clasificar información de diversas fuentes',
              'Analizar la información aportada por diversas fuentes como evidencia',
              'Utilizar mapas, tablas y otras fuentes de información'
            ]
          },
          {
            name: 'Pensamiento crítico',
            subtemas: [
              'Evaluar distintas interpretaciones sobre fenómenos y procesos históricos',
              'Aplicar conceptos de Historia y Ciencias Sociales a situaciones de la realidad social',
              'Inferir conclusiones sobre temas históricos, geográficos y sociales',
              'Analizar y evaluar la multicausalidad de los fenómenos históricos',
              'Analizar y evaluar datos geográficos para identificar tendencias y patrones territoriales'
            ]
          }
        ]
      },
      {
        name: 'Eje: Historia (Mundo, América y Chile)',
        temas: [
          {
            name: 'Cambios políticos, económicos, sociales y culturales del siglo XIX',
            subtemas: [
              'Las ideas republicanas y liberales y su relación con las transformaciones en América y Europa durante el siglo XIX',
              'Los impactos del surgimiento del Estado-nación en América y Europa en el siglo XIX'
            ]
          },
          {
            name: 'Chile durante el siglo XIX',
            subtemas: [
              'Características políticas y culturales de la formación de la República en Chile (primera mitad del siglo XIX)',
              'La inserción de la economía chilena en los procesos de industrialización del mundo atlántico y en los mercados internacionales',
              'Transformaciones de la sociedad chilena en el tránsito del siglo XIX al siglo XX'
            ]
          },
          {
            name: 'Europa, América y Chile durante la primera mitad del siglo XX',
            subtemas: [
              'Nuevos modelos políticos y económicos derivados de la crisis del Estado liberal durante la primera mitad del siglo XX',
              'Totalitarismos europeos',
              'Populismo en América Latina',
              'Inicios del Estado de bienestar'
            ]
          },
          {
            name: 'Segunda mitad del siglo XX y nuevo orden internacional',
            subtemas: [
              'La configuración de un nuevo orden mundial de posguerra',
              'Inicio de procesos de descolonización',
              'Creación de un nuevo marco regulador de las relaciones internacionales (ONU y Declaración Universal de los Derechos Humanos)'
            ]
          },
          {
            name: 'La sociedad chilena a mediados del siglo XX',
            subtemas: [
              'Caracterización de la sociedad chilena de mediados del siglo XX',
              'La extendida pobreza y su precariedad',
              'Los impactos de la migración del campo a la ciudad'
            ]
          },
          {
            name: 'La Dictadura Militar (1973-1990) y el retorno a la democracia',
            subtemas: [
              'Distintas interpretaciones historiográficas del Golpe de Estado de 1973 y el quiebre de la democracia',
              'Características del modelo económico neoliberal implementado durante la Dictadura Militar',
              'Violaciones sistemáticas a los Derechos Humanos y la supresión del Estado de derecho',
              'Factores que incidieron en el proceso de recuperación de la democracia durante la década de 1980'
            ]
          }
        ]
      },
      {
        name: 'Eje: Formación Ciudadana',
        temas: [
          {
            name: 'Estado, democracia y ciudadanía',
            subtemas: [
              'La democracia considerando sus fundamentos, atributos y dimensiones',
              'Problemáticas de la democracia y su relación con libertad, igualdad y solidaridad'
            ]
          },
          {
            name: 'Institucionalidad democrática en Chile',
            subtemas: [
              'Características y funcionamiento de la institucionalidad democrática en Chile'
            ]
          },
          {
            name: 'La democracia en la sociedad de la información',
            subtemas: [
              'Oportunidades y riesgos de los medios de comunicación masiva',
              'Uso de las nuevas tecnologías de la información en el marco de una sociedad democrática'
            ]
          },
          {
            name: 'El acceso a la justicia y el resguardo de los derechos',
            subtemas: [
              'Las principales características del sistema judicial chileno'
            ]
          }
        ]
      },
      {
        name: 'Eje: Sistema Económico',
        temas: [
          {
            name: 'Funcionamiento del mercado',
            subtemas: [
              'Funcionamiento del mercado y los factores que pueden alterarlo',
              'Relaciones entre el Estado y el mercado'
            ]
          },
          {
            name: 'Modelos de desarrollo y política económica',
            subtemas: [
              'Impactos sociales y medioambientales de diversos modelos de desarrollo'
            ]
          },
          {
            name: 'Derechos laborales',
            subtemas: [
              'Los derechos laborales y la evolución de los mecanismos institucionales que los resguardan',
              'El aporte de los movimientos y organizaciones sociales a la defensa y promoción de los derechos laborales',
              'El impacto de las principales tendencias globales y nacionales del mundo del trabajo en los derechos laborales en Chile'
            ]
          }
        ]
      }
    ]
  }
};

function SubjectCard({ subject, content, onSelect }: { 
  subject: SubjectKey; 
  content: SubjectContent;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border ${content.borderColor} ${content.bgGlow} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${content.gradient} text-white shadow-lg`}>
            {content.icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors">
              {content.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {content.duration}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {content.questions}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}

function SubjectDetail({ content, onBack }: { 
  content: SubjectContent;
  onBack: () => void;
}) {
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const [expandedTemas, setExpandedTemas] = useState<Record<string, boolean>>({});

  const toggleArea = (areaName: string) => {
    setExpandedAreas(prev => ({ ...prev, [areaName]: !prev[areaName] }));
  };

  const toggleTema = (temaKey: string) => {
    setExpandedTemas(prev => ({ ...prev, [temaKey]: !prev[temaKey] }));
  };

  return (
    <div className="space-y-4">
      {/* Header con botón de volver */}
      <div className={`p-4 rounded-xl ${content.bgGlow} border ${content.borderColor}`}>
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
          </button>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${content.gradient} text-white shadow-lg`}>
            {content.icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{content.name}</h3>
            <p className="text-sm text-gray-400">{content.reference}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 mb-3">{content.description}</p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {content.duration}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" />
            {content.questions}
          </span>
        </div>
      </div>

      {/* Nota para M2 */}
      {content.shortName === 'M2' && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300">
          <strong>⚠️ Importante:</strong> M2 incluye todos los conocimientos de M1, más los contenidos adicionales listados aquí.
        </div>
      )}

      {/* Áreas temáticas */}
      <div className="space-y-3">
        {content.areas.map((area, areaIdx) => (
          <div key={areaIdx} className="rounded-xl border border-gray-700/50 overflow-hidden bg-gray-800/30">
            <button
              onClick={() => toggleArea(area.name)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-medium text-gray-200">{area.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">
                  {area.temas.length} {area.temas.length === 1 ? 'tema' : 'temas'}
                </span>
                {expandedAreas[area.name] ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>

            {expandedAreas[area.name] && (
              <div className="px-3 pb-3 space-y-2">
                {area.temas.map((tema, temaIdx) => {
                  const temaKey = `${area.name}-${tema.name}`;
                  return (
                    <div key={temaIdx} className="rounded-lg bg-gray-800/50 overflow-hidden">
                      <button
                        onClick={() => toggleTema(temaKey)}
                        className="w-full flex items-center justify-between text-left p-3 hover:bg-white/5 transition-colors"
                      >
                        <span className="text-sm text-gray-300">{tema.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {tema.subtemas.length}
                          </span>
                          {expandedTemas[temaKey] ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {expandedTemas[temaKey] && (
                        <ul className="px-3 pb-3 space-y-1.5">
                          {tema.subtemas.map((subtema, subIdx) => (
                            <li
                              key={subIdx}
                              className="flex items-start gap-2 text-sm text-gray-400 py-1 pl-2"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${content.gradient} mt-1.5 flex-shrink-0`} />
                              <span>{subtema}</span>
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
    </div>
  );
}

export function ContentModal({ isOpen, onClose }: ContentModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSubject) {
          setSelectedSubject(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, selectedSubject]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSelectedSubject(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subjects: SubjectKey[] = ['M1', 'M2', 'L', 'C', 'H'];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl relative my-8 border border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 p-5 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Contenidos PAES 2026</h2>
              <p className="text-xs text-gray-400">Temario oficial DEMRE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {!selectedSubject ? (
            // Lista de materias
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Selecciona una prueba para ver su temario completo:
              </p>
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject}
                  subject={subject}
                  content={subjectContents[subject]}
                  onSelect={() => setSelectedSubject(subject)}
                />
              ))}
              <p className="text-xs text-gray-500 text-center pt-4">
                Fuente: Temarios oficiales DEMRE - Proceso de Admisión 2026
              </p>
            </div>
          ) : (
            // Detalle de materia
            <SubjectDetail
              content={subjectContents[selectedSubject]}
              onBack={() => setSelectedSubject(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}