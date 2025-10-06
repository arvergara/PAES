/*
  # Add initial questions for Language

  1. New Data
    - Add initial set of questions for Language (L) subject
    - Questions cover grammar, literature, and reading comprehension
    - Each question includes content, options, correct answer, and explanation

  2. Security
    - Questions are set as active by default
    - Follows existing RLS policies
*/

INSERT INTO questions (subject, content, options, correct_answer, explanation, topic, difficulty, active)
VALUES
  (
    'L',
    '¿Cuál de las siguientes oraciones contiene un verbo en modo subjuntivo?',
    '{"a": "Juan come manzanas", "b": "Espero que llueva mañana", "c": "Vendré a tu casa", "d": "He terminado el trabajo"}',
    'b',
    '"Que llueva" está en modo subjuntivo, expresando un deseo o posibilidad',
    'Gramática',
    2,
    true
  ),
  (
    'L',
    '¿Qué figura literaria se utiliza en la frase "Sus cabellos son de oro"?',
    '{"a": "Hipérbole", "b": "Metáfora", "c": "Símil", "d": "Personificación"}',
    'b',
    'Es una metáfora porque establece una identificación directa entre el cabello y el oro, sin usar "como" o "parece"',
    'Figuras literarias',
    1,
    true
  ),
  (
    'L',
    '¿Cuál es el núcleo del sujeto en la oración "Los estudiantes de la universidad protestaron"?',
    '{"a": "Los", "b": "Estudiantes", "c": "Universidad", "d": "Protestaron"}',
    'b',
    '"Estudiantes" es el núcleo del sujeto porque es el sustantivo principal del que se habla en la oración',
    'Análisis sintáctico',
    2,
    true
  ),
  (
    'L',
    '¿Qué tipo de narrador aparece en el fragmento "Pedro pensaba que nadie lo entendía"?',
    '{"a": "Narrador protagonista", "b": "Narrador testigo", "c": "Narrador omnisciente", "d": "Narrador objetivo"}',
    'c',
    'Es un narrador omnisciente porque conoce los pensamientos del personaje',
    'Narrativa',
    2,
    true
  ),
  (
    'L',
    '¿Cuál es el complemento directo en la oración "María compró un libro en la tienda"?',
    '{"a": "María", "b": "Un libro", "c": "En la tienda", "d": "Compró"}',
    'b',
    '"Un libro" es el complemento directo porque recibe directamente la acción del verbo comprar',
    'Análisis sintáctico',
    2,
    true
  ),
  (
    'L',
    '¿Qué tipo de texto es aquel que busca convencer al lector sobre una idea?',
    '{"a": "Narrativo", "b": "Descriptivo", "c": "Argumentativo", "d": "Expositivo"}',
    'c',
    'El texto argumentativo tiene como objetivo principal persuadir al lector sobre una idea o punto de vista',
    'Tipos de texto',
    1,
    true
  ),
  (
    'L',
    '¿Cuál de las siguientes palabras es esdrújula?',
    '{"a": "Camion", "b": "Telefono", "c": "Médico", "d": "Reloj"}',
    'c',
    '"Médico" es una palabra esdrújula porque el acento está en la antepenúltima sílaba',
    'Acentuación',
    1,
    true
  ),
  (
    'L',
    '¿Qué recurso literario se utiliza en "El viento susurra entre los árboles"?',
    '{"a": "Hipérbole", "b": "Metáfora", "c": "Personificación", "d": "Símil"}',
    'c',
    'Es una personificación porque atribuye una acción humana (susurrar) a algo no humano (el viento)',
    'Figuras literarias',
    2,
    true
  ),
  (
    'L',
    '¿Cuál es el modo verbal en la oración "¡Cierra la puerta!"?',
    '{"a": "Indicativo", "b": "Subjuntivo", "c": "Imperativo", "d": "Condicional"}',
    'c',
    'El modo imperativo se usa para dar órdenes o hacer peticiones directas',
    'Gramática',
    2,
    true
  ),
  (
    'L',
    '¿Qué tipo de palabra es "rápidamente" en función de su morfología?',
    '{"a": "Adjetivo", "b": "Adverbio", "c": "Sustantivo", "d": "Verbo"}',
    'b',
    '"Rápidamente" es un adverbio porque modifica la acción del verbo, indicando modo o manera',
    'Morfología',
    1,
    true
  );