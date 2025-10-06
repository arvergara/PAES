/*
  # Add initial questions for Mathematics 1

  1. New Data
    - Add initial set of questions for Mathematics 1 (M1) subject
    - Questions cover algebra, functions, and basic mathematics
    - Each question includes content, options, correct answer, and explanation

  2. Security
    - Questions are set as active by default
    - Follows existing RLS policies
*/

INSERT INTO questions (subject, content, options, correct_answer, explanation, topic, difficulty, active)
VALUES
  (
    'M1',
    'Si 2x + 3 = 11, ¿cuál es el valor de x?',
    '{"a": "2", "b": "4", "c": "6", "d": "8"}',
    'b',
    'Para resolver, restamos 3 de ambos lados: 2x = 8. Luego dividimos por 2: x = 4.',
    'Álgebra',
    1,
    true
  ),
  (
    'M1',
    'Si f(x) = 2x² - 3x + 1, ¿cuál es el valor de f(2)?',
    '{"a": "3", "b": "5", "c": "7", "d": "9"}',
    'a',
    'Reemplazamos x por 2: f(2) = 2(2)² - 3(2) + 1 = 2(4) - 6 + 1 = 8 - 6 + 1 = 3',
    'Funciones',
    2,
    true
  ),
  (
    'M1',
    '¿Cuál es la pendiente de la recta que pasa por los puntos (1,2) y (3,6)?',
    '{"a": "1", "b": "2", "c": "3", "d": "4"}',
    'b',
    'La pendiente se calcula como (y₂-y₁)/(x₂-x₁) = (6-2)/(3-1) = 4/2 = 2',
    'Funciones lineales',
    2,
    true
  ),
  (
    'M1',
    'Si (x + 2)(x - 3) = 0, ¿cuáles son los valores de x?',
    '{"a": "x = 2 y x = 3", "b": "x = -2 y x = 3", "c": "x = 2 y x = -3", "d": "x = -2 y x = -3"}',
    'b',
    'Por propiedad del producto nulo, si (x + 2)(x - 3) = 0, entonces x + 2 = 0 o x - 3 = 0. Por lo tanto, x = -2 o x = 3',
    'Álgebra',
    2,
    true
  ),
  (
    'M1',
    '¿Cuál es el dominio de la función f(x) = √(x + 4)?',
    '{"a": "x ≥ -4", "b": "x > -4", "c": "x ≤ -4", "d": "x < -4"}',
    'a',
    'Para que exista la raíz cuadrada, el radicando debe ser mayor o igual a cero: x + 4 ≥ 0, por lo tanto x ≥ -4',
    'Funciones',
    3,
    true
  ),
  (
    'M1',
    'Si log₂(x) = 3, ¿cuál es el valor de x?',
    '{"a": "6", "b": "8", "c": "9", "d": "12"}',
    'b',
    'Si log₂(x) = 3, entonces 2³ = x. Por lo tanto, x = 8',
    'Logaritmos',
    2,
    true
  ),
  (
    'M1',
    '¿Cuál es la solución de la ecuación |x - 2| = 3?',
    '{"a": "x = -1 o x = 5", "b": "x = -1 o x = 1", "c": "x = 1 o x = 5", "d": "x = -5 o x = -1"}',
    'a',
    '|x - 2| = 3 significa que x - 2 = 3 o x - 2 = -3. Resolviendo: x = 5 o x = -1',
    'Valor absoluto',
    3,
    true
  ),
  (
    'M1',
    'Si f(x) = x² + 2x + 1, ¿cuál es el vértice de la parábola?',
    '{"a": "(-1, 0)", "b": "(0, 1)", "c": "(-1, 1)", "d": "(1, 4)"}',
    'a',
    'Para encontrar el vértice, calculamos x = -b/(2a) = -2/(2(1)) = -1, y luego f(-1) = (-1)² + 2(-1) + 1 = 1 - 2 + 1 = 0',
    'Funciones cuadráticas',
    3,
    true
  );