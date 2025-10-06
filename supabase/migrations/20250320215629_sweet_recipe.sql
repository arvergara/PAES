/*
  # Add initial questions for Science

  1. New Data
    - Add initial set of questions for Science (C) subject
    - Questions cover biology, chemistry, and physics topics
    - Each question includes content, options, correct answer, and explanation

  2. Security
    - Questions are set as active by default
    - Follows existing RLS policies
*/

INSERT INTO questions (subject, content, options, correct_answer, explanation, topic, difficulty, active)
VALUES
  (
    'C',
    '¿Cuál es la unidad básica de la vida?',
    '{"a": "Átomo", "b": "Célula", "c": "Molécula", "d": "Tejido"}',
    'b',
    'La célula es la unidad básica estructural y funcional de todos los seres vivos',
    'Biología',
    1,
    true
  ),
  (
    'C',
    '¿Qué gas es el más abundante en la atmósfera terrestre?',
    '{"a": "Oxígeno", "b": "Dióxido de carbono", "c": "Nitrógeno", "d": "Hidrógeno"}',
    'c',
    'El nitrógeno constituye aproximadamente el 78% de la atmósfera terrestre',
    'Química',
    1,
    true
  ),
  (
    'C',
    '¿Cuál es la función principal del ADN?',
    '{"a": "Almacenar información genética", "b": "Producir energía", "c": "Transportar oxígeno", "d": "Digerir alimentos"}',
    'a',
    'El ADN almacena la información genética necesaria para el desarrollo y funcionamiento de los seres vivos',
    'Biología',
    2,
    true
  ),
  (
    'C',
    '¿Qué tipo de energía tiene un objeto en movimiento?',
    '{"a": "Potencial", "b": "Cinética", "c": "Térmica", "d": "Nuclear"}',
    'b',
    'La energía cinética es la energía que posee un cuerpo debido a su movimiento',
    'Física',
    1,
    true
  ),
  (
    'C',
    '¿Cuál es el proceso por el cual las plantas producen su propio alimento?',
    '{"a": "Respiración", "b": "Fotosíntesis", "c": "Digestión", "d": "Fermentación"}',
    'b',
    'La fotosíntesis es el proceso mediante el cual las plantas producen glucosa utilizando luz solar, agua y dióxido de carbono',
    'Biología',
    1,
    true
  ),
  (
    'C',
    '¿Qué órgano del cuerpo humano produce la insulina?',
    '{"a": "Hígado", "b": "Riñón", "c": "Páncreas", "d": "Estómago"}',
    'c',
    'El páncreas produce insulina, una hormona que regula los niveles de glucosa en la sangre',
    'Biología',
    2,
    true
  ),
  (
    'C',
    '¿Cuál es la ley de Newton que establece que "a toda acción le corresponde una reacción igual y opuesta"?',
    '{"a": "Primera ley", "b": "Segunda ley", "c": "Tercera ley", "d": "Cuarta ley"}',
    'c',
    'La tercera ley de Newton establece que por cada fuerza de acción existe una fuerza de reacción igual y opuesta',
    'Física',
    2,
    true
  ),
  (
    'C',
    '¿Qué tipo de enlace químico se forma cuando los átomos comparten electrones?',
    '{"a": "Iónico", "b": "Covalente", "c": "Metálico", "d": "Van der Waals"}',
    'b',
    'El enlace covalente se forma cuando los átomos comparten pares de electrones',
    'Química',
    3,
    true
  );