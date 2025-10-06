/*
  # Update questions with new structure

  1. Changes
    - Updates existing questions with proper area_tematica, tema and subtema values
    - Ensures all questions follow the curriculum structure
    - Maintains data integrity by using conditional updates

  2. Structure
    - Each question will have:
      - area_tematica (main subject area)
      - tema (specific topic)
      - subtema (detailed subtopic)
*/

-- Update M1 questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%entero%' OR content LIKE '%racional%' OR content LIKE '%número%' THEN 'Números'
    WHEN content LIKE '%porcentaje%' OR content LIKE '%descuento%' THEN 'Números'
    WHEN content LIKE '%potencia%' OR content LIKE '%raíz%' THEN 'Números'
    WHEN content LIKE '%función%' OR content LIKE '%ecuación%' OR content LIKE '%algebraic%' THEN 'Álgebra y Funciones'
    WHEN content LIKE '%proporción%' OR content LIKE '%escala%' THEN 'Álgebra y Funciones'
    WHEN content LIKE '%triángulo%' OR content LIKE '%área%' OR content LIKE '%perímetro%' THEN 'Geometría'
    WHEN content LIKE '%probabilidad%' OR content LIKE '%estadística%' OR content LIKE '%frecuencia%' THEN 'Probabilidad y Estadística'
    ELSE 'Álgebra y Funciones'
  END,
  tema = CASE
    WHEN content LIKE '%entero%' OR content LIKE '%racional%' THEN 'Conjunto de los números enteros y racionales'
    WHEN content LIKE '%porcentaje%' THEN 'Porcentaje'
    WHEN content LIKE '%potencia%' OR content LIKE '%raíz%' THEN 'Potencias y raíces enésimas'
    WHEN content LIKE '%algebraic%' OR content LIKE '%factorización%' THEN 'Expresiones algebraicas'
    WHEN content LIKE '%proporción%' THEN 'Proporcionalidad'
    WHEN content LIKE '%ecuación%' THEN 'Ecuaciones e inecuaciones de primer grado'
    WHEN content LIKE '%triángulo%' OR content LIKE '%Pitágoras%' THEN 'Figuras geométricas'
    WHEN content LIKE '%frecuencia%' THEN 'Representación de datos'
    WHEN content LIKE '%media%' OR content LIKE '%mediana%' OR content LIKE '%moda%' THEN 'Medidas de tendencia central'
    ELSE 'Expresiones algebraicas'
  END,
  subtema = CASE
    WHEN content LIKE '%operación%' OR content LIKE '%orden%' THEN 'Operaciones y orden en el conjunto de los números enteros y racionales'
    WHEN content LIKE '%porcentaje%' THEN 'Concepto y cálculo de porcentaje'
    WHEN content LIKE '%potencia%' THEN 'Propiedades de las potencias de base racional y exponente racional'
    WHEN content LIKE '%factorización%' THEN 'Productos notables, factorizaciones y operatoria'
    WHEN content LIKE '%proporción%' THEN 'Concepto de proporción directa e inversa'
    WHEN content LIKE '%ecuación%' THEN 'Resolución de ecuaciones lineales e inecuaciones'
    WHEN content LIKE '%Pitágoras%' THEN 'Teorema de Pitágoras y perímetro y áreas'
    WHEN content LIKE '%frecuencia%' THEN 'Tablas de frecuencia absoluta y relativa'
    WHEN content LIKE '%media%' OR content LIKE '%mediana%' OR content LIKE '%moda%' THEN 'Media, mediana y moda'
    ELSE NULL
  END
WHERE subject = 'M1';

-- Update M2 questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%real%' OR content LIKE '%logaritmo%' THEN 'Números'
    WHEN content LIKE '%interés%' OR content LIKE '%financier%' THEN 'Números'
    WHEN content LIKE '%sistema%' OR content LIKE '%ecuación%' THEN 'Álgebra y Funciones'
    WHEN content LIKE '%homotecia%' OR content LIKE '%trigonometría%' THEN 'Geometría'
    WHEN content LIKE '%probabilidad%' OR content LIKE '%dispersión%' THEN 'Probabilidad y Estadística'
    ELSE 'Álgebra y Funciones'
  END,
  tema = CASE
    WHEN content LIKE '%real%' THEN 'Conjunto de los números reales'
    WHEN content LIKE '%interés%' OR content LIKE '%financier%' THEN 'Matemática financiera'
    WHEN content LIKE '%logaritmo%' THEN 'Logaritmos'
    WHEN content LIKE '%sistema%' THEN 'Sistemas de ecuaciones lineales'
    WHEN content LIKE '%cuadrática%' OR content LIKE '%segundo grado%' THEN 'Ecuaciones de segundo grado'
    WHEN content LIKE '%homotecia%' THEN 'Homotecia de figuras'
    WHEN content LIKE '%trigonometría%' OR content LIKE '%seno%' OR content LIKE '%coseno%' THEN 'Razones trigonométricas'
    WHEN content LIKE '%dispersión%' THEN 'Medidas de dispersión'
    WHEN content LIKE '%probabilidad%' AND content LIKE '%condicion%' THEN 'Probabilidad condicional'
    ELSE NULL
  END,
  subtema = CASE
    WHEN content LIKE '%real%' THEN 'Operaciones y problemas con números reales'
    WHEN content LIKE '%interés%' THEN 'Cálculo de intereses y créditos financieros'
    WHEN content LIKE '%logaritmo%' THEN 'Concepto y propiedades de los logaritmos'
    WHEN content LIKE '%sistema%' THEN 'Casos con una o múltiples soluciones'
    WHEN content LIKE '%cuadrática%' THEN 'Resolución y gráficos de ecuaciones cuadráticas'
    WHEN content LIKE '%homotecia%' THEN 'Aplicaciones de homotecia en diversos contextos'
    WHEN content LIKE '%trigonometría%' THEN 'Seno, coseno y tangente en triángulos rectángulos'
    WHEN content LIKE '%dispersión%' THEN 'Análisis de variabilidad de datos'
    WHEN content LIKE '%probabilidad%' AND content LIKE '%condicion%' THEN 'Aplicaciones de probabilidad condicional'
    ELSE NULL
  END
WHERE subject = 'M2';

-- Update L questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%explícit%' OR content LIKE '%identificar%' OR content LIKE '%extraer%' THEN 'Localizar'
    WHEN content LIKE '%relación%' OR content LIKE '%significado%' OR content LIKE '%comprensión%' THEN 'Interpretar'
    ELSE 'Evaluar'
  END,
  tema = CASE
    WHEN content LIKE '%explícit%' OR content LIKE '%identificar%' THEN 'Identificación de información'
    WHEN content LIKE '%relación%' THEN 'Relaciones textuales'
    WHEN content LIKE '%significado%' THEN 'Significado del texto'
    WHEN content LIKE '%valoración%' THEN 'Valoración del texto'
    WHEN content LIKE '%crítica%' THEN 'Crítica del contenido'
    WHEN content LIKE '%comprensión%' THEN 'Comprensión global'
    WHEN content LIKE '%juicio%' THEN 'Juicio crítico'
    ELSE 'Identificación de información'
  END,
  subtema = CASE
    WHEN content LIKE '%explícit%' THEN 'Extraer información explícita de textos'
    WHEN content LIKE '%sinónimo%' OR content LIKE '%paráfrasis%' THEN 'Reconocer sinónimos y paráfrasis en textos'
    WHEN content LIKE '%causa%' OR content LIKE '%efecto%' THEN 'Establecer relaciones causa-efecto y problema-solución'
    WHEN content LIKE '%significado%' THEN 'Determinar el significado de un párrafo o sección'
    WHEN content LIKE '%intención%' THEN 'Determinar la intención del emisor'
    WHEN content LIKE '%calidad%' OR content LIKE '%pertinencia%' THEN 'Juzgar la calidad y pertinencia de la información textual'
    WHEN content LIKE '%central%' THEN 'Sintetizar las ideas centrales del texto'
    WHEN content LIKE '%contexto%' THEN 'Valorar la información textual en relación con nuevos contextos'
    ELSE NULL
  END
WHERE subject = 'L';

-- Update C questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%célula%' OR content LIKE '%ADN%' OR content LIKE '%organismo%' THEN 'Biología'
    WHEN content LIKE '%átomo%' OR content LIKE '%molécula%' OR content LIKE '%enlace%' THEN 'Química'
    ELSE 'Física'
  END,
  tema = CASE
    WHEN content LIKE '%célula%' OR content LIKE '%ADN%' THEN 'Sistemas biológicos'
    WHEN content LIKE '%átomo%' OR content LIKE '%enlace%' THEN 'Estructura atómica'
    WHEN content LIKE '%energía%' OR content LIKE '%movimiento%' OR content LIKE '%fuerza%' THEN 'Mecánica'
    ELSE NULL
  END,
  subtema = NULL
WHERE subject = 'C';

-- Update H questions
UPDATE questions 
SET 
  area_tematica = CASE
    WHEN content LIKE '%mundial%' OR content LIKE '%guerra%' OR content LIKE '%revolución%' THEN 'Historia Universal'
    WHEN content LIKE '%Chile%' OR content LIKE '%nacional%' THEN 'Historia de Chile'
    ELSE 'Geografía'
  END,
  tema = CASE
    WHEN content LIKE '%contemporánea%' OR content LIKE '%siglo XX%' THEN 'Edad Contemporánea'
    WHEN content LIKE '%Chile%' AND content LIKE '%XIX%' THEN 'Chile en el siglo XIX'
    WHEN content LIKE '%geografía%' OR content LIKE '%relieve%' OR content LIKE '%clima%' THEN 'Geografía física de Chile'
    ELSE NULL
  END,
  subtema = NULL
WHERE subject = 'H';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_area_tematica ON questions (area_tematica);
CREATE INDEX IF NOT EXISTS idx_questions_tema ON questions (tema);
CREATE INDEX IF NOT EXISTS idx_questions_subtema ON questions (subtema);