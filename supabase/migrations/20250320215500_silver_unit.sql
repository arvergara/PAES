/*
  # Add initial questions for M2

  1. New Data
    - Add initial set of questions for M2 subject
    - Questions cover geometry and probability topics
    - Each question includes content, options, correct answer, and explanation

  2. Security
    - Questions are set as active by default
    - Follows existing RLS policies
*/

INSERT INTO questions (subject, content, options, correct_answer, explanation, topic, difficulty, active)
VALUES
  (
    'M2',
    'En un triángulo rectángulo, si un cateto mide 3 y la hipotenusa mide 5, ¿cuánto mide el otro cateto?',
    '{"a": "2", "b": "3", "c": "4", "d": "5"}',
    'c',
    'Por el teorema de Pitágoras: 3² + x² = 5². Por lo tanto, x² = 25 - 9 = 16, entonces x = 4',
    'Geometría',
    2,
    true
  ),
  (
    'M2',
    'Si se lanza un dado justo, ¿cuál es la probabilidad de obtener un número par?',
    '{"a": "1/2", "b": "1/3", "c": "2/3", "d": "1/6"}',
    'a',
    'Los números pares en un dado son 2, 4 y 6 (3 casos favorables) de un total de 6 posibilidades. Por lo tanto, P(par) = 3/6 = 1/2',
    'Probabilidad',
    1,
    true
  ),
  (
    'M2',
    '¿Cuál es el área de un círculo de radio 3 unidades?',
    '{"a": "6π", "b": "9π", "c": "12π", "d": "18π"}',
    'b',
    'El área de un círculo es A = πr². Por lo tanto, A = π(3)² = 9π',
    'Geometría',
    1,
    true
  ),
  (
    'M2',
    'En una urna hay 3 bolas rojas y 2 azules. Si se extraen dos bolas sin reposición, ¿cuál es la probabilidad de que ambas sean rojas?',
    '{"a": "3/10", "b": "1/5", "c": "3/5", "d": "2/5"}',
    'a',
    'P(RR) = (3/5)(2/4) = 6/20 = 3/10',
    'Probabilidad',
    3,
    true
  ),
  (
    'M2',
    'En un polígono regular de 8 lados, ¿cuánto mide cada ángulo interior?',
    '{"a": "135°", "b": "140°", "c": "145°", "d": "150°"}',
    'a',
    'Para un polígono de n lados, cada ángulo interior mide ((n-2)×180°)/n. Para n=8: ((8-2)×180°)/8 = (6×180°)/8 = 1080°/8 = 135°',
    'Geometría',
    2,
    true
  );