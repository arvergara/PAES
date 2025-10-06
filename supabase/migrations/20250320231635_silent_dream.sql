/*
  # Add History questions

  1. Changes
    - Insert initial set of History questions into the database
    - Ensure proper categorization with area_tematica, tema, and subtema
*/

-- Insert History questions
INSERT INTO questions (
  subject,
  content,
  options,
  correct_answer,
  explanation,
  area_tematica,
  tema,
  subtema,
  difficulty,
  active
) VALUES
  (
    'H',
    '¿Qué acontecimiento marca el inicio de la Edad Contemporánea?',
    '{"a": "La caída de Constantinopla", "b": "La Revolución Francesa", "c": "El descubrimiento de América", "d": "La Primera Guerra Mundial"}',
    'b',
    'La Revolución Francesa (1789) marca convencionalmente el inicio de la Edad Contemporánea por sus profundas transformaciones políticas y sociales',
    'Historia Universal',
    'Edad Contemporánea',
    'Revoluciones y transformaciones políticas',
    1,
    true
  ),
  (
    'H',
    '¿Cuál fue el primer pueblo originario que encontraron los españoles al llegar a Chile?',
    '{"a": "Mapuche", "b": "Aymara", "c": "Atacameños", "d": "Diaguitas"}',
    'c',
    'Los atacameños fueron el primer pueblo que encontraron los españoles al ingresar a Chile por el norte a través del desierto de Atacama',
    'Historia de Chile',
    'Chile en el siglo XIX',
    'Pueblos originarios y conquista',
    2,
    true
  ),
  (
    'H',
    '¿Qué característica principal tuvo el período de la República Conservadora en Chile?',
    '{"a": "Sufragio universal", "b": "Autoritarismo presidencial", "c": "Reforma agraria", "d": "Industrialización masiva"}',
    'b',
    'La República Conservadora (1831-1861) se caracterizó por un fuerte autoritarismo presidencial y el predominio del partido conservador',
    'Historia de Chile',
    'Chile en el siglo XIX',
    'Organización de la República',
    3,
    true
  ),
  (
    'H',
    '¿Qué fenómeno geográfico caracteriza principalmente a la Zona Central de Chile?',
    '{"a": "La Depresión Intermedia", "b": "El Altiplano", "c": "Los campos de hielo", "d": "Las pampas"}',
    'a',
    'La Depresión Intermedia o Valle Central es la característica geográfica más distintiva de la Zona Central de Chile',
    'Geografía',
    'Geografía física de Chile',
    'Relieve y regiones naturales',
    1,
    true
  ),
  (
    'H',
    '¿Cuál fue la principal consecuencia económica de la Guerra del Pacífico para Chile?',
    '{"a": "La obtención del monopolio del salitre", "b": "El desarrollo de la industria textil", "c": "La pérdida de territorios mineros", "d": "La crisis económica"}',
    'a',
    'La Guerra del Pacífico permitió a Chile obtener el control de los territorios salitreros, convirtiéndose en el principal productor mundial',
    'Historia de Chile',
    'Chile en el siglo XIX',
    'Expansión territorial y económica',
    2,
    true
  ),
  (
    'H',
    '¿Qué proceso histórico dio origen a la Primera Guerra Mundial?',
    '{"a": "La Revolución Industrial", "b": "El imperialismo europeo", "c": "La Revolución Rusa", "d": "La Gran Depresión"}',
    'b',
    'El imperialismo europeo y la competencia entre potencias por territorios y recursos fue la causa fundamental de la Primera Guerra Mundial',
    'Historia Universal',
    'Edad Contemporánea',
    'Conflictos mundiales',
    3,
    true
  ),
  (
    'H',
    '¿Qué reforma constitucional estableció la separación de la Iglesia y el Estado en Chile?',
    '{"a": "Constitución de 1833", "b": "Reforma de 1874", "c": "Constitución de 1925", "d": "Reforma de 1967"}',
    'c',
    'La Constitución de 1925 estableció formalmente la separación de la Iglesia y el Estado en Chile, terminando con el Estado confesional',
    'Historia de Chile',
    'Chile en el siglo XIX',
    'Reformas constitucionales',
    2,
    true
  ),
  (
    'H',
    '¿Qué característica define al clima mediterráneo presente en la Zona Central de Chile?',
    '{"a": "Lluvias todo el año", "b": "Veranos lluviosos", "c": "Estaciones muy marcadas", "d": "Temperaturas extremas"}',
    'c',
    'El clima mediterráneo se caracteriza por tener estaciones muy marcadas, con veranos secos y calurosos e inviernos húmedos y templados',
    'Geografía',
    'Geografía física de Chile',
    'Clima y vegetación',
    2,
    true
  ),
  (
    'H',
    '¿Cuál fue el principal efecto social de la Revolución Industrial?',
    '{"a": "El surgimiento de la clase obrera", "b": "La abolición de la esclavitud", "c": "El fin del feudalismo", "d": "La igualdad de género"}',
    'a',
    'La Revolución Industrial provocó el surgimiento de la clase obrera o proletariado industrial, transformando radicalmente la estructura social',
    'Historia Universal',
    'Edad Contemporánea',
    'Revoluciones industriales',
    2,
    true
  ),
  (
    'H',
    '¿Qué factor geográfico ha influido más en el desarrollo económico de Chile?',
    '{"a": "La Cordillera de los Andes", "b": "El Océano Pacífico", "c": "El Desierto de Atacama", "d": "Los recursos minerales"}',
    'd',
    'Los recursos minerales, especialmente el cobre, han sido históricamente el principal motor del desarrollo económico chileno',
    'Geografía',
    'Geografía física de Chile',
    'Recursos naturales',
    3,
    true
  );