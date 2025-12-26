-- PAES 2022 Questions - 91 preguntas para TutorPAES
-- Ejecutar en Supabase SQL Editor

INSERT INTO questions (id, subject, content, options, correct_answer, explanation, area_tematica, tema, subtema, difficulty, active) VALUES

-- ============================================
-- HISTORIA (H) - 15 preguntas
-- ============================================

('paes2022_h_001', 'H', 'Lee el siguiente texto:

"La transparencia es una recién llegada a la reflexión y a la práctica democrática. […] Nadie sensato, en nuestros días, podría diferir de la importancia que tiene el acceso de la información pública como una de las condiciones sustantivas para incrementar la calidad de la democracia" (Aguilar, 2008).

El texto alude a la importancia de la transparencia en la sociedad. ¿De qué forma contribuye la transparencia al proceso de fortalecimiento de la democracia en Chile?',
'{"a": "Establece el carácter independiente entre los distintos poderes del Estado.", "b": "Permite el acceso de la ciudadanía a la información reservada del Estado.", "c": "Permite un mayor control de la ciudadanía sobre las instituciones públicas.", "d": "Limita las atribuciones de los funcionarios públicos en el ejercicio de sus labores.", "e": "Garantiza la erradicación de los conflictos de interés al interior de las instituciones públicas."}',
'c', 'La transparencia permite que la ciudadanía pueda ejercer un mayor control sobre las instituciones públicas al tener acceso a información sobre cómo se gestionan los recursos y se toman las decisiones.', 'Formación Ciudadana', 'Democracia y participación', 'Transparencia y probidad', 3, true),

('paes2022_h_002', 'H', 'La tendencia del derecho internacional de establecer algunos parámetros globales en materia de derechos humanos, ha sido valorada por diversos actores sociales e institucionales. Sin embargo, existen algunos detractores. ¿Cuál es una de las críticas planteadas por estos detractores?',
'{"a": "La carencia de información detallada sobre la institucionalidad relativa a los derechos humanos.", "b": "La dificultad de promulgar leyes que sean comprensibles en los distintos países del mundo.", "c": "La amenaza de debilitamiento de la soberanía nacional de los Estados frente a los organismos internacionales.", "d": "La pérdida de las libertades individuales de las personas a causa de la aplicación de un marco internacional de derechos."}',
'c', 'Una de las principales críticas al sistema internacional de derechos humanos es que puede debilitar la soberanía nacional de los Estados.', 'Formación Ciudadana', 'Derechos humanos', 'Sistema internacional de DDHH', 3, true),

('paes2022_h_003', 'H', 'En el contexto de la organización del sistema democrático chileno actual, la legislación vigente define derechos y deberes a la ciudadanía. ¿Cuál es una de las atribuciones que tiene la ciudadanía?',
'{"a": "Designar a las personas que ocuparán los cargos de ministros de Estado.", "b": "Hacer cumplir las sentencias aplicadas a personas que hayan cometido un delito.", "c": "Conocer los presupuestos asignados a las instituciones del Estado.", "d": "Evaluar el desempeño de los jueces de la República."}',
'c', 'El derecho de acceso a la información pública permite a los ciudadanos conocer cómo se distribuyen y utilizan los recursos del Estado.', 'Formación Ciudadana', 'Democracia y participación', 'Derechos ciudadanos', 2, true),

('paes2022_h_004', 'H', 'Chile posee una economía abierta al comercio internacional. ¿Cuál es una de las principales ventajas de esta condición para el desarrollo económico del país?',
'{"a": "Garantiza la estabilidad de los precios internos de los productos.", "b": "Permite acceder a mercados más amplios para la exportación de productos.", "c": "Asegura la autosuficiencia en la producción de bienes de consumo.", "d": "Elimina la dependencia de las fluctuaciones de los mercados externos."}',
'b', 'Una economía abierta permite a Chile acceder a mercados internacionales más amplios para exportar sus productos.', 'Geografía', 'Economía chilena', 'Comercio internacional', 2, true),

('paes2022_h_005', 'H', 'La globalización ha generado importantes transformaciones en las sociedades contemporáneas. ¿Cuál de las siguientes situaciones representa una consecuencia cultural de este proceso?',
'{"a": "El aumento de las barreras arancelarias entre países.", "b": "La homogeneización de patrones de consumo a nivel mundial.", "c": "La disminución del flujo migratorio entre regiones.", "d": "El fortalecimiento de las economías autárquicas."}',
'b', 'La globalización ha producido una homogeneización de patrones de consumo a nivel mundial.', 'Historia Universal', 'Edad Contemporánea', 'Globalización', 2, true),

('paes2022_h_006', 'H', 'La Revolución Industrial iniciada en Inglaterra en el siglo XVIII provocó profundas transformaciones sociales. ¿Cuál fue una de las principales consecuencias demográficas de este proceso?',
'{"a": "La disminución de la población urbana.", "b": "El crecimiento acelerado de las ciudades industriales.", "c": "La migración masiva del campo hacia las zonas rurales.", "d": "El descenso de las tasas de natalidad."}',
'b', 'La Revolución Industrial provocó un crecimiento acelerado de las ciudades industriales debido a la migración rural.', 'Historia Universal', 'Edad Contemporánea', 'Revolución Industrial', 2, true),

('paes2022_h_007', 'H', 'Durante la Guerra Fría, el mundo se dividió en dos bloques antagónicos. ¿Qué característica definía principalmente al bloque occidental liderado por Estados Unidos?',
'{"a": "La economía planificada centralmente.", "b": "El sistema político de partido único.", "c": "La defensa del sistema capitalista y la democracia liberal.", "d": "La colectivización de los medios de producción."}',
'c', 'El bloque occidental se caracterizó por defender el sistema capitalista y la democracia liberal.', 'Historia Universal', 'Edad Contemporánea', 'Guerra Fría', 2, true),

('paes2022_h_008', 'H', 'A mediados del siglo XX, Chile experimentó un proceso de industrialización conocido como "Industrialización por Sustitución de Importaciones" (ISI). ¿Cuál fue uno de los objetivos principales de esta política económica?',
'{"a": "Aumentar las exportaciones de materias primas.", "b": "Reducir la dependencia de productos manufacturados extranjeros.", "c": "Eliminar la intervención del Estado en la economía.", "d": "Privatizar las empresas estatales existentes."}',
'b', 'El modelo ISI buscaba reducir la dependencia de productos manufacturados extranjeros.', 'Historia de Chile', 'Chile en el siglo XX', 'Desarrollo económico', 3, true),

('paes2022_h_009', 'H', 'Los pueblos originarios de Chile desarrollaron diversas estrategias de adaptación. ¿Qué característica económica distinguía principalmente al pueblo mapuche antes de la llegada de los españoles?',
'{"a": "La caza y recolección como únicas actividades de subsistencia.", "b": "El desarrollo de una agricultura intensiva y ganadería.", "c": "La dependencia exclusiva de la pesca marítima.", "d": "El comercio de larga distancia con el Imperio Inca."}',
'b', 'Los mapuches desarrollaron una economía basada en la agricultura y la ganadería de camélidos.', 'Historia de Chile', 'Pueblos originarios', 'Economía indígena', 2, true),

('paes2022_h_010', 'H', 'Chile presenta una gran diversidad de climas debido a su extensión latitudinal. ¿Qué tipo de clima predomina en la zona comprendida entre Copiapó y el norte de la Región de Coquimbo?',
'{"a": "Clima mediterráneo con lluvias invernales.", "b": "Clima desértico con nublados costeros.", "c": "Clima templado lluvioso.", "d": "Clima de tundra."}',
'b', 'La zona entre Copiapó y el norte de Coquimbo presenta un clima desértico costero con camanchaca.', 'Geografía', 'Geografía física de Chile', 'Climas de Chile', 2, true),

('paes2022_h_011', 'H', 'La Constitución Política de Chile establece que el país es una república democrática. ¿Cuál de las siguientes características es propia de este tipo de organización política?',
'{"a": "El poder se concentra en una sola persona.", "b": "Los cargos de gobierno son hereditarios.", "c": "Las autoridades son elegidas por los ciudadanos.", "d": "El Estado y la Iglesia están unidos."}',
'c', 'Una república democrática se caracteriza porque las autoridades son elegidas por los ciudadanos mediante elecciones.', 'Formación Ciudadana', 'Organización política', 'República democrática', 1, true),

('paes2022_h_012', 'H', 'Durante el siglo XIX, Chile experimentó un proceso de expansión territorial. ¿Cuál fue el principal territorio incorporado como resultado de la Guerra del Pacífico (1879-1884)?',
'{"a": "La Patagonia", "b": "La Araucanía", "c": "Antofagasta y Tarapacá", "d": "Chiloé"}',
'c', 'La Guerra del Pacífico permitió a Chile incorporar las provincias de Antofagasta y Tarapacá, ricas en salitre.', 'Historia de Chile', 'Chile en el siglo XIX', 'Guerra del Pacífico', 2, true),

('paes2022_h_013', 'H', 'El fenómeno de la migración campo-ciudad en Chile durante el siglo XX tuvo diversas consecuencias. ¿Cuál de las siguientes es una consecuencia directa de este proceso?',
'{"a": "El aumento de la población rural.", "b": "El crecimiento de las ciudades y la urbanización.", "c": "La disminución de la mano de obra industrial.", "d": "El fortalecimiento de la economía agrícola."}',
'b', 'La migración campo-ciudad provocó un crecimiento acelerado de las ciudades, especialmente Santiago.', 'Historia de Chile', 'Chile en el siglo XX', 'Transformaciones sociales', 2, true),

('paes2022_h_014', 'H', 'La Segunda Guerra Mundial (1939-1945) tuvo importantes consecuencias a nivel global. ¿Cuál de las siguientes fue una consecuencia directa de este conflicto?',
'{"a": "La formación de la Sociedad de Naciones.", "b": "El inicio de la Revolución Industrial.", "c": "La creación de la Organización de las Naciones Unidas (ONU).", "d": "El comienzo de la Primera Guerra Mundial."}',
'c', 'Tras la Segunda Guerra Mundial, se creó la ONU en 1945 con el objetivo de mantener la paz internacional.', 'Historia Universal', 'Edad Contemporánea', 'Segunda Guerra Mundial', 2, true),

('paes2022_h_015', 'H', 'El Tratado de Tordesillas (1494) dividió las tierras del "Nuevo Mundo" entre dos potencias europeas. ¿Cuáles fueron estas potencias?',
'{"a": "Inglaterra y Francia", "b": "España y Portugal", "c": "Holanda y España", "d": "Francia y Portugal"}',
'b', 'El Tratado de Tordesillas dividió las tierras descubiertas entre España y Portugal.', 'Historia Universal', 'Edad Moderna', 'Descubrimientos y conquista', 1, true),

-- ============================================
-- BIOLOGÍA (CB) - 14 preguntas
-- ============================================

('paes2022_cb_001', 'CB', 'Un gráfico muestra los niveles plasmáticos de la hormona luteinizante (LH) en tres grupos de mujeres sanas con ciclos ováricos de 28 días. Sabiendo que el grupo 1 corresponde a mujeres en el día 10 del ciclo (niveles bajos), el grupo 2 muestra un pico alto de LH, y el grupo 3 muestra niveles intermedios, ¿cuál de las siguientes opciones es una inferencia correcta?',
'{"a": "Las mujeres del grupo 1 están en sus días fértiles.", "b": "Las mujeres del grupo 2 están ovulando.", "c": "Las mujeres del grupo 1 están menstruando.", "d": "Las mujeres del grupo 2 están menstruando."}',
'b', 'El pico de LH ocurre justo antes de la ovulación y la desencadena.', 'Biología Humana', 'Sistema reproductor', 'Ciclo menstrual', 3, true),

('paes2022_cb_002', 'CB', 'Un investigador está realizando un estudio sobre diabetes tipo 1 y plantea preguntas para un cuestionario. ¿Cuál de las siguientes preguntas generaría datos que pueden ser analizados solo de manera cualitativa?',
'{"a": "¿Qué porcentaje de tus familiares presenta diabetes tipo 1?", "b": "¿Cuántas veces al día te inyectas insulina?", "c": "¿Cuáles son los valores de glicemia que registras en ayuno?", "d": "¿Cómo afecta la diabetes a tu estado de ánimo?"}',
'd', 'La pregunta sobre cómo afecta la diabetes al estado de ánimo genera datos cualitativos porque las respuestas son descripciones subjetivas.', 'Habilidades Científicas', 'Metodología científica', 'Tipos de datos', 2, true),

('paes2022_cb_003', 'CB', 'En un experimento se estudió el efecto de un análogo de la hormona GnRH sobre la liberación de gametos en peces. Los resultados mostraron que en machos el efecto máximo se alcanzó a las 12 horas, mientras que en hembras el máximo se alcanzó a las 24 horas. ¿Cuál de las siguientes afirmaciones es correcta?',
'{"a": "Triplica la liberación de gametos respecto de los controles en ambos sexos.", "b": "Produce su máximo efecto 24 horas después de su inyección en ambos sexos.", "c": "En machos, los efectos ocurren en menor tiempo que en hembras.", "d": "En hembras presenta un efecto inhibitorio en las primeras 12 horas."}',
'c', 'Según los datos, los machos alcanzan el efecto máximo a las 12 horas mientras las hembras lo alcanzan a las 24 horas.', 'Biología Humana', 'Sistema reproductor', 'Hormonas reproductivas', 3, true),

('paes2022_cb_004', 'CB', 'En una especie de planta, el color de las flores está determinado por un par de alelos con dominancia incompleta. Las plantas homocigotas RR tienen flores rojas, las heterocigotas Rr tienen flores rosadas, y las homocigotas rr tienen flores blancas. Si se cruzan dos plantas de flores rosadas, ¿qué proporción de la descendencia tendrá flores rosadas?',
'{"a": "100%", "b": "75%", "c": "50%", "d": "25%", "e": "0%"}',
'c', 'En un cruce Rr × Rr con dominancia incompleta, la proporción es 1 RR : 2 Rr : 1 rr. Solo los Rr (50%) tienen flores rosadas.', 'Genética', 'Herencia mendeliana', 'Dominancia incompleta', 3, true),

('paes2022_cb_005', 'CB', 'En un ecosistema, los organismos descomponedores cumplen una función esencial. ¿Cuál es el principal rol de estos organismos en el flujo de materia de un ecosistema?',
'{"a": "Producir materia orgánica a partir de sustancias inorgánicas.", "b": "Transformar la materia orgánica en sustancias inorgánicas.", "c": "Transferir energía desde los productores hacia los consumidores.", "d": "Fijar el nitrógeno atmosférico en el suelo."}',
'b', 'Los descomponedores degradan la materia orgánica de organismos muertos, transformándola en sustancias inorgánicas.', 'Ecología', 'Ecosistemas', 'Ciclos de materia', 2, true),

('paes2022_cb_006', 'CB', 'Las neuronas transmiten información mediante impulsos nerviosos. ¿Qué estructura neuronal es responsable de recibir los estímulos desde otras neuronas o desde el ambiente?',
'{"a": "El axón", "b": "El cuerpo celular", "c": "Las dendritas", "d": "El botón sináptico", "e": "La vaina de mielina"}',
'c', 'Las dendritas son prolongaciones especializadas en recibir los estímulos desde otras neuronas o desde receptores sensoriales.', 'Biología Humana', 'Sistema nervioso', 'Estructura neuronal', 1, true),

('paes2022_cb_007', 'CB', 'Las mitocondrias son organelos esenciales para el metabolismo celular. ¿Cuál es la principal función de las mitocondrias?',
'{"a": "Sintetizar proteínas.", "b": "Almacenar información genética.", "c": "Producir ATP mediante respiración celular.", "d": "Realizar la fotosíntesis.", "e": "Digerir materiales celulares."}',
'c', 'Las mitocondrias son los organelos donde ocurre la respiración celular aeróbica, produciendo ATP.', 'Biología Celular', 'Organelos celulares', 'Mitocondrias', 1, true),

('paes2022_cb_008', 'CB', 'Según la teoría de la evolución por selección natural, ¿qué condición es necesaria para que una característica se vuelva más frecuente en una población a lo largo de las generaciones?',
'{"a": "Que la característica sea adquirida durante la vida del individuo.", "b": "Que la característica confiera una ventaja reproductiva y sea heredable.", "c": "Que todos los individuos de la población presenten la característica.", "d": "Que la característica aparezca simultáneamente en todos los individuos."}',
'b', 'Para que una característica aumente su frecuencia por selección natural, debe conferir una ventaja reproductiva y ser heredable.', 'Evolución', 'Selección natural', 'Mecanismos evolutivos', 2, true),

('paes2022_cb_009', 'CB', 'La fotosíntesis es un proceso fundamental para la vida en la Tierra. ¿En qué organelo celular ocurre este proceso?',
'{"a": "En las mitocondrias", "b": "En los cloroplastos", "c": "En el núcleo", "d": "En los ribosomas", "e": "En el aparato de Golgi"}',
'b', 'La fotosíntesis ocurre en los cloroplastos, que contienen clorofila.', 'Biología Celular', 'Organelos celulares', 'Cloroplastos', 1, true),

('paes2022_cb_010', 'CB', 'En el sistema circulatorio humano, ¿cuál es la función principal de los glóbulos rojos (eritrocitos)?',
'{"a": "Defender al organismo de infecciones", "b": "Transportar oxígeno a los tejidos", "c": "Participar en la coagulación sanguínea", "d": "Producir anticuerpos", "e": "Transportar nutrientes"}',
'b', 'Los glóbulos rojos contienen hemoglobina, que transporta oxígeno desde los pulmones hacia todos los tejidos.', 'Biología Humana', 'Sistema circulatorio', 'Componentes de la sangre', 1, true),

('paes2022_cb_011', 'CB', 'En la meiosis, ¿cuántos cromosomas tendrá cada célula hija al finalizar el proceso, si la célula madre tiene 46 cromosomas?',
'{"a": "92 cromosomas", "b": "46 cromosomas", "c": "23 cromosomas", "d": "12 cromosomas"}',
'c', 'La meiosis es una división reduccional que produce células con la mitad del número de cromosomas de la célula madre.', 'Biología Celular', 'División celular', 'Meiosis', 2, true),

('paes2022_cb_012', 'CB', '¿Cuál de los siguientes procesos corresponde a un mecanismo de defensa específico del sistema inmune?',
'{"a": "La tos", "b": "La producción de anticuerpos", "c": "La barrera de la piel", "d": "El reflejo de estornudo"}',
'b', 'La producción de anticuerpos es un mecanismo de defensa específico porque actúa contra un patógeno particular.', 'Biología Humana', 'Sistema inmune', 'Inmunidad específica', 2, true),

('paes2022_cb_013', 'CB', 'En un ecosistema, los productores primarios son organismos capaces de:',
'{"a": "Descomponer la materia orgánica", "b": "Alimentarse de otros organismos", "c": "Producir su propio alimento mediante fotosíntesis", "d": "Parasitar a otros seres vivos"}',
'c', 'Los productores primarios son organismos autótrofos que producen materia orgánica mediante fotosíntesis o quimiosíntesis.', 'Ecología', 'Ecosistemas', 'Niveles tróficos', 1, true),

('paes2022_cb_014', 'CB', '¿Qué tipo de molécula es el ADN?',
'{"a": "Un lípido", "b": "Una proteína", "c": "Un carbohidrato", "d": "Un ácido nucleico", "e": "Una vitamina"}',
'd', 'El ADN (ácido desoxirribonucleico) es un ácido nucleico que contiene la información genética de los organismos.', 'Biología Molecular', 'Ácidos nucleicos', 'Estructura del ADN', 1, true),

-- ============================================
-- FÍSICA (CF) - 14 preguntas
-- ============================================

('paes2022_cf_001', 'CF', 'Una onda mecánica se representa mediante un perfil temporal que muestra 2 ciclos completos en 4 segundos. ¿Cuál es la frecuencia de la onda representada?',
'{"a": "1/8 Hz", "b": "1/4 Hz", "c": "1/2 Hz", "d": "2 Hz", "e": "4 Hz"}',
'c', 'Si hay 2 ciclos en 4 segundos, el período es T = 4s/2 = 2s. La frecuencia es f = 1/T = 1/2 Hz.', 'Ondas', 'Ondas mecánicas', 'Frecuencia y período', 2, true),

('paes2022_cf_002', 'CF', 'Una persona está a 400 m de una superficie reflectora y percibe el eco de un sonido de 800 Hz, 2 segundos después de la emisión. ¿Cuál es la longitud de onda asociada a este sonido?',
'{"a": "4,00 m", "b": "2,00 m", "c": "1,00 m", "d": "0,50 m", "e": "0,25 m"}',
'd', 'La velocidad del sonido es v = 2×400m/2s = 400 m/s. La longitud de onda es λ = v/f = 400/800 = 0,5 m.', 'Ondas', 'Ondas sonoras', 'Longitud de onda', 3, true),

('paes2022_cf_003', 'CF', 'Un rayo de luz que viaja paralelo al eje óptico de una lente convergente incide sobre ella. ¿Qué trayectoria seguirá el rayo después de atravesar la lente?',
'{"a": "Continuará paralelo al eje óptico.", "b": "Se desviará alejándose del eje óptico.", "c": "Pasará por el foco de la lente.", "d": "Se reflejará de vuelta."}',
'c', 'Un rayo paralelo al eje óptico de una lente convergente, al atravesarla, pasa por el foco.', 'Óptica', 'Lentes', 'Lentes convergentes', 2, true),

('paes2022_cf_004', 'CF', 'Un automóvil parte del reposo y acelera uniformemente durante 10 segundos hasta alcanzar una velocidad de 20 m/s. ¿Cuál es la aceleración del automóvil?',
'{"a": "0,5 m/s²", "b": "2 m/s²", "c": "10 m/s²", "d": "20 m/s²", "e": "200 m/s²"}',
'b', 'Usando v = v₀ + at: a = (v - v₀)/t = 20/10 = 2 m/s².', 'Mecánica', 'Cinemática', 'Movimiento uniformemente acelerado', 1, true),

('paes2022_cf_005', 'CF', 'Se aplica una fuerza neta de 50 N a un objeto de 10 kg que inicialmente está en reposo. ¿Cuál será la velocidad del objeto después de 4 segundos?',
'{"a": "5 m/s", "b": "10 m/s", "c": "20 m/s", "d": "40 m/s", "e": "200 m/s"}',
'c', 'La aceleración es a = F/m = 50/10 = 5 m/s². Usando v = at: v = 5 × 4 = 20 m/s.', 'Mecánica', 'Dinámica', 'Segunda ley de Newton', 2, true),

('paes2022_cf_006', 'CF', 'Una pelota de 0,5 kg se deja caer desde una altura de 20 m. Despreciando la resistencia del aire, ¿cuál es la energía cinética de la pelota justo antes de tocar el suelo? (g = 10 m/s²)',
'{"a": "10 J", "b": "50 J", "c": "100 J", "d": "200 J", "e": "500 J"}',
'c', 'Por conservación de la energía: Ec = Ep = mgh = 0,5 × 10 × 20 = 100 J.', 'Mecánica', 'Energía', 'Conservación de energía', 2, true),

('paes2022_cf_007', 'CF', 'Un circuito tiene una resistencia de 10 Ω conectada a una fuente de 20 V. ¿Cuál es la potencia disipada por la resistencia?',
'{"a": "2 W", "b": "20 W", "c": "40 W", "d": "200 W", "e": "400 W"}',
'c', 'La corriente es I = V/R = 20/10 = 2 A. La potencia es P = VI = 20 × 2 = 40 W.', 'Electricidad', 'Circuitos eléctricos', 'Potencia eléctrica', 2, true),

('paes2022_cf_008', 'CF', 'Se suministran 500 J de calor a un gas ideal en un proceso a presión constante. Si el gas realiza un trabajo de 200 J, ¿cuál es el cambio en la energía interna del gas?',
'{"a": "100 J", "b": "200 J", "c": "300 J", "d": "500 J", "e": "700 J"}',
'c', 'Por la primera ley de la termodinámica: ΔU = Q - W = 500 - 200 = 300 J.', 'Termodinámica', 'Primera ley', 'Energía interna', 3, true),

('paes2022_cf_009', 'CF', 'Un objeto se mueve con velocidad constante de 10 m/s. ¿Qué distancia recorrerá en 30 segundos?',
'{"a": "3 m", "b": "30 m", "c": "40 m", "d": "300 m", "e": "3000 m"}',
'd', 'En movimiento uniforme: d = v × t = 10 m/s × 30 s = 300 m.', 'Mecánica', 'Cinemática', 'Movimiento rectilíneo uniforme', 1, true),

('paes2022_cf_010', 'CF', '¿Cuál es la unidad de medida de la fuerza en el Sistema Internacional?',
'{"a": "Joule", "b": "Watt", "c": "Newton", "d": "Pascal", "e": "Kilogramo"}',
'c', 'El Newton (N) es la unidad de fuerza en el SI. 1 N = 1 kg × m/s².', 'Mecánica', 'Dinámica', 'Unidades de medida', 1, true),

('paes2022_cf_011', 'CF', 'Una carga eléctrica de 2 C se mueve a través de una diferencia de potencial de 12 V. ¿Cuánta energía se transfiere?',
'{"a": "6 J", "b": "14 J", "c": "24 J", "d": "72 J", "e": "144 J"}',
'c', 'La energía es E = q × V = 2 C × 12 V = 24 J.', 'Electricidad', 'Potencial eléctrico', 'Energía eléctrica', 2, true),

('paes2022_cf_012', 'CF', 'Un espejo plano produce una imagen de un objeto. ¿Qué características tiene esta imagen?',
'{"a": "Real e invertida", "b": "Virtual y del mismo tamaño", "c": "Real y del mismo tamaño", "d": "Virtual e invertida"}',
'b', 'Los espejos planos producen imágenes virtuales, derechas y del mismo tamaño que el objeto.', 'Óptica', 'Espejos', 'Espejos planos', 1, true),

('paes2022_cf_013', 'CF', '¿Qué tipo de energía tiene un objeto debido a su posición en un campo gravitatorio?',
'{"a": "Energía cinética", "b": "Energía potencial gravitatoria", "c": "Energía térmica", "d": "Energía elástica"}',
'b', 'La energía potencial gravitatoria es la energía que posee un objeto debido a su posición, dada por Ep = mgh.', 'Mecánica', 'Energía', 'Tipos de energía', 1, true),

('paes2022_cf_014', 'CF', 'Dos cargas eléctricas del mismo signo se acercan una a la otra. ¿Qué tipo de fuerza experimentan entre ellas?',
'{"a": "Fuerza de atracción", "b": "Fuerza de repulsión", "c": "No experimentan fuerza", "d": "Fuerza gravitacional"}',
'b', 'Las cargas del mismo signo se repelen entre sí, según la ley de Coulomb.', 'Electricidad', 'Electrostática', 'Ley de Coulomb', 1, true),

-- ============================================
-- QUÍMICA (CQ) - 14 preguntas
-- ============================================

('paes2022_cq_001', 'CQ', 'Se tienen cuatro elementos que forman compuestos: R₂Y (iónico), XY₂ (covalente apolar), XZ₄ (covalente apolar), YZ₂ (covalente polar). ¿Cuál de las siguientes afirmaciones es correcta?',
'{"a": "R debe ser un metal alcalino.", "b": "X debe ser un halógeno.", "c": "Y debe ser un gas noble.", "d": "Z debe ser un metal de transición."}',
'a', 'Si R₂Y es iónico y forma un compuesto del tipo R₂Y, R probablemente es un metal alcalino que forma cationes R⁺.', 'Química General', 'Tabla periódica', 'Propiedades periódicas', 3, true),

('paes2022_cq_002', 'CQ', 'Dos estudiantes discuten: "Si se reemplaza un átomo de hidrógeno en el metano por un átomo de cloro, entonces la molécula debería ser polar." ¿A qué corresponde este planteamiento?',
'{"a": "A un procedimiento", "b": "A una hipótesis", "c": "A una teoría", "d": "A una observación"}',
'b', 'El planteamiento es una hipótesis porque es una predicción basada en conocimientos previos que puede ser verificada.', 'Habilidades Científicas', 'Metodología científica', 'Hipótesis', 1, true),

('paes2022_cq_003', 'CQ', 'Una estructura molecular muestra un átomo de carbono unido a un grupo OH y a otros tres átomos de carbono. ¿A qué tipo de compuesto orgánico corresponde?',
'{"a": "Aldehído", "b": "Cetona", "c": "Alcohol", "d": "Éster", "e": "Ácido carboxílico"}',
'c', 'Un compuesto con un grupo OH unido a un carbono corresponde a un alcohol.', 'Química Orgánica', 'Grupos funcionales', 'Alcoholes', 2, true),

('paes2022_cq_004', 'CQ', 'En la reacción: 2H₂ + O₂ → 2H₂O, si se hacen reaccionar 4 moles de H₂ con 3 moles de O₂, ¿cuántos moles de H₂O se formarán y qué reactivo estará en exceso?',
'{"a": "4 moles de H₂O, O₂ en exceso", "b": "6 moles de H₂O, H₂ en exceso", "c": "4 moles de H₂O, H₂ en exceso", "d": "3 moles de H₂O, O₂ en exceso"}',
'a', 'Por estequiometría, 4 mol H₂ necesitan 2 mol O₂. Como hay 3 mol O₂, el H₂ es el limitante. Se forman 4 mol H₂O y sobra 1 mol de O₂.', 'Química General', 'Estequiometría', 'Reactivo limitante', 3, true),

('paes2022_cq_005', 'CQ', '¿Qué tipo de enlace se forma entre un átomo de sodio (Na) y un átomo de cloro (Cl)?',
'{"a": "Enlace covalente polar", "b": "Enlace covalente apolar", "c": "Enlace iónico", "d": "Enlace metálico", "e": "Enlace de hidrógeno"}',
'c', 'El sodio pierde un electrón formando Na⁺, mientras que el cloro gana un electrón formando Cl⁻. La atracción electrostática forma un enlace iónico.', 'Química General', 'Enlaces químicos', 'Enlace iónico', 1, true),

('paes2022_cq_006', 'CQ', 'Se prepara una solución disolviendo 10 g de NaCl en agua hasta completar 500 mL de solución. ¿Cuál es la concentración de la solución en g/L?',
'{"a": "5 g/L", "b": "10 g/L", "c": "20 g/L", "d": "50 g/L", "e": "100 g/L"}',
'c', 'Concentración = masa/volumen = 10 g / 0,5 L = 20 g/L.', 'Química General', 'Soluciones', 'Concentración', 1, true),

('paes2022_cq_007', 'CQ', 'En una reacción de neutralización entre un ácido fuerte y una base fuerte, ¿cuáles son los productos principales?',
'{"a": "Sal y agua", "b": "Sal y gas", "c": "Óxido y agua", "d": "Hidróxido y gas", "e": "Solo agua"}',
'a', 'La neutralización entre un ácido fuerte y una base fuerte produce una sal y agua.', 'Química General', 'Reacciones químicas', 'Neutralización', 1, true),

('paes2022_cq_008', 'CQ', 'Un gas ideal ocupa un volumen de 2 L a una presión de 1 atm y temperatura de 27°C. Si la presión se duplica y la temperatura se mantiene constante, ¿cuál será el nuevo volumen del gas?',
'{"a": "0,5 L", "b": "1 L", "c": "2 L", "d": "4 L", "e": "8 L"}',
'b', 'A temperatura constante, según la ley de Boyle: P₁V₁ = P₂V₂. Por lo tanto: 1×2 = 2×V₂, entonces V₂ = 1 L.', 'Química General', 'Gases', 'Ley de Boyle', 2, true),

('paes2022_cq_009', 'CQ', '¿Cuál es el número atómico del carbono?',
'{"a": "4", "b": "6", "c": "12", "d": "14", "e": "16"}',
'b', 'El carbono tiene número atómico 6, lo que significa que tiene 6 protones.', 'Química General', 'Estructura atómica', 'Número atómico', 1, true),

('paes2022_cq_010', 'CQ', '¿Qué tipo de enlace se forma cuando dos átomos comparten electrones?',
'{"a": "Enlace iónico", "b": "Enlace metálico", "c": "Enlace covalente", "d": "Enlace de hidrógeno", "e": "Enlace dipolo-dipolo"}',
'c', 'El enlace covalente se forma cuando dos átomos comparten uno o más pares de electrones.', 'Química General', 'Enlaces químicos', 'Enlace covalente', 1, true),

('paes2022_cq_011', 'CQ', 'El pH de una solución es 3. ¿Qué tipo de solución es?',
'{"a": "Básica", "b": "Neutra", "c": "Ácida", "d": "Saturada"}',
'c', 'Una solución con pH menor a 7 es ácida. pH 3 indica una solución ácida.', 'Química General', 'Ácidos y bases', 'Escala de pH', 1, true),

('paes2022_cq_012', 'CQ', '¿Cuál es la fórmula química del ácido clorhídrico?',
'{"a": "NaCl", "b": "HCl", "c": "H₂SO₄", "d": "HNO₃", "e": "NaOH"}',
'b', 'El ácido clorhídrico tiene fórmula HCl.', 'Química General', 'Nomenclatura', 'Ácidos', 1, true),

('paes2022_cq_013', 'CQ', 'En una reacción exotérmica:',
'{"a": "Se absorbe calor del entorno", "b": "Se libera calor al entorno", "c": "No hay intercambio de calor", "d": "La temperatura del sistema disminuye"}',
'b', 'En una reacción exotérmica, los productos tienen menos energía que los reactantes, y la diferencia se libera como calor.', 'Química General', 'Termoquímica', 'Reacciones exotérmicas', 2, true),

('paes2022_cq_014', 'CQ', '¿Cuál es el nombre del compuesto NaOH?',
'{"a": "Cloruro de sodio", "b": "Hidróxido de sodio", "c": "Óxido de sodio", "d": "Nitrato de sodio"}',
'b', 'NaOH es el hidróxido de sodio, también conocido como soda cáustica.', 'Química General', 'Nomenclatura', 'Hidróxidos', 1, true),

-- ============================================
-- COMPRENSIÓN LECTORA (L) - 10 preguntas
-- ============================================

('paes2022_l_001', 'L', 'Lee el siguiente texto sobre la resolución de problemas:

"Para resolver un problema es primordial definirlo previamente, con el objeto de que la solución corresponda exactamente al que se planteó y no a uno diferente."

De acuerdo con el texto, ¿cuál de los siguientes enunciados es FALSO en relación con los problemas?',
'{"a": "En algunos problemas hay más de una solución.", "b": "En algunos problemas la solución ya es conocida.", "c": "En algunos problemas solo se presentan soluciones parciales.", "d": "En algunos problemas no coincide lo percibido y el problema real."}',
'b', 'El texto indica que los problemas requieren ser definidos correctamente para encontrar su solución, implicando que la solución no es conocida de antemano.', 'Comprensión Lectora', 'Textos argumentativos', 'Inferencia', 2, true),

('paes2022_l_002', 'L', 'Considerando el texto sobre resolución de problemas, ¿cuál es el propósito comunicativo principal del autor?',
'{"a": "Contrastar los diversos tipos de problemas.", "b": "Informar acerca de cómo solucionar los problemas.", "c": "Señalar situaciones cotidianas que encierran problemas.", "d": "Dar cuenta de la importancia de la definición del problema."}',
'd', 'El texto enfatiza que "para resolver un problema es primordial definirlo previamente".', 'Comprensión Lectora', 'Textos argumentativos', 'Propósito comunicativo', 2, true),

('paes2022_l_003', 'L', 'Según el texto sobre resolución de problemas, ¿cuál de los siguientes casos NO corresponde a un problema según la definición planteada?',
'{"a": "Calcular la distancia recorrida por un automóvil.", "b": "Reducir la cantidad de accidentes en una ciudad.", "c": "Disminuir los desperdicios productivos de una industria.", "d": "Encontrar la cura para enfermedades como el sida o el cáncer."}',
'a', 'Un problema implica una situación que requiere una solución desconocida. Calcular una distancia es un ejercicio matemático con solución conocida.', 'Comprensión Lectora', 'Textos argumentativos', 'Comprensión global', 2, true),

('paes2022_l_004', 'L', 'En el texto, la expresión "esto puede sonar algo peregrino" significa que:',
'{"a": "parece una idea extraña o poco común", "b": "es un concepto religioso", "c": "representa un viaje largo", "d": "es una afirmación científica"}',
'a', 'En este contexto, "peregrino" significa extraño, inusual o poco común.', 'Comprensión Lectora', 'Vocabulario contextual', 'Significado de palabras', 2, true),

('paes2022_l_005', 'L', 'Un texto científico describe la megafauna: "Hace 13.000 a 9.000 años se extinguieron todos los grandes mamíferos sudamericanos (animales de más de una tonelada) y también la mayoría de los mamíferos de más de 44 kilogramos."

¿Qué característica permite clasificar a un animal como parte de la megafauna?',
'{"a": "Pertenencia a la familia de los tapires.", "b": "Hábitat dentro del continente americano.", "c": "Inclusión dentro de la clase Mammalia.", "d": "Peso superior a los 44 kilogramos."}',
'd', 'Según el texto, la megafauna incluye animales de más de una tonelada y mamíferos de más de 44 kilogramos.', 'Comprensión Lectora', 'Textos informativos', 'Identificación de información', 1, true),

('paes2022_l_006', 'L', 'El texto sobre la megafauna menciona que "No se tiene certeza del motivo de su extinción, pudieron ser factores ambientales o bien el contagio de enfermedades. Algunas teorías apuntan directamente a la influencia de los humanos."

¿Cuál es la idea principal de este fragmento?',
'{"a": "Los humanos causaron la extinción de la megafauna.", "b": "Las enfermedades fueron la causa principal de la extinción.", "c": "Existen múltiples teorías sobre las causas de la extinción.", "d": "Los factores ambientales eliminaron a la megafauna."}',
'c', 'El fragmento presenta diversas posibles causas de extinción sin confirmar ninguna.', 'Comprensión Lectora', 'Textos informativos', 'Idea principal', 2, true),

('paes2022_l_007', 'L', 'Lee el siguiente fragmento:

"En la actualidad, el cambio climático representa uno de los mayores desafíos para la humanidad. Los científicos han advertido que si no se toman medidas urgentes, las consecuencias podrían ser irreversibles."

¿Cuál es el propósito comunicativo principal del texto?',
'{"a": "Entretener al lector con datos curiosos.", "b": "Alertar sobre una problemática ambiental.", "c": "Describir el trabajo de los científicos.", "d": "Criticar las políticas ambientales actuales."}',
'b', 'El texto busca alertar sobre el cambio climático como un desafío urgente.', 'Comprensión Lectora', 'Textos informativos', 'Propósito comunicativo', 1, true),

('paes2022_l_008', 'L', 'En el texto anterior, la expresión "consecuencias irreversibles" significa:',
'{"a": "Consecuencias que pueden revertirse fácilmente.", "b": "Consecuencias que no pueden deshacerse.", "c": "Consecuencias que son temporales.", "d": "Consecuencias que afectan solo a los científicos."}',
'b', 'Irreversible significa que no puede volver a su estado anterior, es decir, que no puede deshacerse.', 'Comprensión Lectora', 'Vocabulario contextual', 'Significado de palabras', 1, true),

('paes2022_l_009', 'L', 'Un texto argumentativo presenta la siguiente tesis: "Las redes sociales han transformado la forma en que nos comunicamos". ¿Cuál de los siguientes enunciados podría ser un argumento a favor de esta tesis?',
'{"a": "Las redes sociales fueron creadas en el siglo XXI.", "b": "Muchas personas prefieren comunicarse por mensajes de texto que en persona.", "c": "Internet es una herramienta tecnológica.", "d": "Los teléfonos celulares son cada vez más pequeños."}',
'b', 'El enunciado B es un argumento que apoya la tesis porque muestra cómo ha cambiado la preferencia comunicativa de las personas.', 'Comprensión Lectora', 'Textos argumentativos', 'Identificación de argumentos', 2, true),

('paes2022_l_010', 'L', '¿Cuál de las siguientes oraciones presenta un error de concordancia?',
'{"a": "Los niños corren por el parque.", "b": "La profesora explicó la lección.", "c": "Los libros nuevos llegó ayer.", "d": "El perro duerme en su cama."}',
'c', 'En "Los libros nuevos llegó ayer" hay un error: el sujeto plural "Los libros" no concuerda con el verbo singular "llegó".', 'Comprensión Lectora', 'Gramática', 'Concordancia', 1, true),

-- ============================================
-- MATEMÁTICA 1 (M1) - 12 preguntas
-- ============================================

('paes2022_m1_001', 'M1', 'Todo el líquido contenido en un barril se reparte en 96 vasos iguales hasta su capacidad máxima. Se quiere verter la misma cantidad de líquido de otro barril idéntico en vasos iguales, pero solo hasta las 3/4 partes de su capacidad. ¿Cuántos vasos más se necesitarán?',
'{"a": "288", "b": "120", "c": "48", "d": "32"}',
'd', 'Si cada vaso se llena a 3/4, se necesitan 4/3 veces más vasos. Total = 96 × (4/3) = 128. Vasos adicionales = 128 - 96 = 32.', 'Números', 'Fracciones', 'Operaciones con fracciones', 2, true),

('paes2022_m1_002', 'M1', '¿Cuál de las siguientes cantidades corresponde al 5% del precio de un artículo?',
'{"a": "Un quinto del precio del artículo.", "b": "El precio del artículo multiplicado por cinco décimos.", "c": "El precio del artículo dividido por 100, y luego multiplicado por 5.", "d": "El precio del artículo dividido por 5, y luego multiplicado por 100."}',
'c', 'El 5% de un valor P es P × 5/100 = P/100 × 5.', 'Números', 'Porcentajes', 'Cálculo de porcentajes', 1, true),

('paes2022_m1_003', 'M1', 'Un número aumentado en su 30% es igual a 910. ¿Cuál es el número?',
'{"a": "273", "b": "637", "c": "700", "d": "1.183"}',
'c', 'Sea x el número. x + 0,30x = 910, entonces 1,30x = 910, por lo tanto x = 700.', 'Álgebra', 'Ecuaciones', 'Ecuaciones de primer grado', 2, true),

('paes2022_m1_004', 'M1', 'Al ingresar n instrucciones a un programa, este realiza cálculos durante 3^n segundos. Cuando se ingresan 9 instrucciones, el programa realiza cálculos durante M segundos. Si el programa hizo cálculos durante 3M segundos, ¿cuántas instrucciones se ingresaron?',
'{"a": "10", "b": "27", "c": "n", "d": "3n"}',
'a', 'Con 9 instrucciones: M = 3^9. Si trabaja 3M = 3 × 3^9 = 3^10 segundos, entonces se ingresaron 10 instrucciones.', 'Números', 'Potencias', 'Propiedades de potencias', 3, true),

('paes2022_m1_005', 'M1', 'En una mezcla de café, la razón entre café colombiano y café brasileño es 3:5. Si la mezcla tiene en total 480 gramos, ¿cuántos gramos de café colombiano contiene?',
'{"a": "60 g", "b": "120 g", "c": "180 g", "d": "300 g", "e": "360 g"}',
'c', 'Total de partes = 3 + 5 = 8. Cada parte = 480/8 = 60 g. Café colombiano = 3 × 60 = 180 g.', 'Números', 'Razones y proporciones', 'Cálculo de proporciones', 2, true),

('paes2022_m1_006', 'M1', '¿Cuál de las siguientes expresiones es igual a (x³ + x⁶ + x⁹)/x³?',
'{"a": "x¹⁸", "b": "3x¹⁸", "c": "x⁰ + x³ + x⁶", "d": "1 + x³ + x⁶"}',
'd', 'Dividiendo cada término por x³: x³/x³ + x⁶/x³ + x⁹/x³ = 1 + x³ + x⁶.', 'Álgebra', 'Expresiones algebraicas', 'Operaciones con potencias', 2, true),

('paes2022_m1_007', 'M1', 'Un triángulo rectángulo tiene catetos de 6 cm y 8 cm. ¿Cuál es la longitud de la hipotenusa?',
'{"a": "7 cm", "b": "10 cm", "c": "12 cm", "d": "14 cm", "e": "48 cm"}',
'b', 'Por el teorema de Pitágoras: h² = 6² + 8² = 36 + 64 = 100. h = 10 cm.', 'Geometría', 'Triángulos', 'Teorema de Pitágoras', 1, true),

('paes2022_m1_008', 'M1', 'Si el 20% de un número es 15, ¿cuál es el número?',
'{"a": "3", "b": "30", "c": "75", "d": "100", "e": "300"}',
'c', 'Si 0,20 × x = 15, entonces x = 15/0,20 = 75.', 'Números', 'Porcentajes', 'Cálculo inverso de porcentajes', 1, true),

('paes2022_m1_009', 'M1', '¿Cuál es el máximo común divisor (MCD) de 24 y 36?',
'{"a": "4", "b": "6", "c": "8", "d": "12", "e": "72"}',
'd', '24 = 2³ × 3 y 36 = 2² × 3². MCD = 2² × 3 = 12.', 'Números', 'Divisibilidad', 'MCD', 1, true),

('paes2022_m1_010', 'M1', 'El área de un cuadrado es 49 cm². ¿Cuál es su perímetro?',
'{"a": "7 cm", "b": "14 cm", "c": "28 cm", "d": "49 cm", "e": "196 cm"}',
'c', 'Si A = l² = 49, entonces l = 7 cm. Perímetro = 4l = 4 × 7 = 28 cm.', 'Geometría', 'Cuadriláteros', 'Área y perímetro', 1, true),

('paes2022_m1_011', 'M1', '¿Cuál es el valor de (-3)²?',
'{"a": "-9", "b": "-6", "c": "6", "d": "9", "e": "81"}',
'd', '(-3)² = (-3) × (-3) = 9. El cuadrado de un número negativo es positivo.', 'Números', 'Potencias', 'Potencias de números negativos', 1, true),

('paes2022_m1_012', 'M1', 'Si f(x) = 2x - 3, ¿cuál es el valor de f(5)?',
'{"a": "2", "b": "5", "c": "7", "d": "10", "e": "13"}',
'c', 'f(5) = 2(5) - 3 = 10 - 3 = 7.', 'Álgebra', 'Funciones', 'Evaluación de funciones', 1, true),

-- ============================================
-- MATEMÁTICA 2 (M2) - 12 preguntas
-- ============================================

('paes2022_m2_001', 'M2', 'Jacinta tiene 8 libros de matemática, 7 de literatura y 10 de biología. ¿De cuántas maneras puede escoger 2 libros de cada disciplina para llevarlos al colegio?',
'{"a": "C(8,2) + C(7,2) + C(10,2)", "b": "C(8,2) × C(7,2) × C(10,2)", "c": "C(25,2) × C(24,2) × C(23,2)", "d": "25!/19!"}',
'b', 'Como son eventos independientes, se multiplican las combinaciones: C(8,2) × C(7,2) × C(10,2).', 'Probabilidad y Estadística', 'Combinatoria', 'Principio multiplicativo', 3, true),

('paes2022_m2_002', 'M2', 'En un conjunto de datos, la media aritmética es 25 y la mediana es 23. Si se agrega un nuevo dato igual a 100, ¿qué ocurrirá con estas medidas de tendencia central?',
'{"a": "Ambas aumentarán significativamente.", "b": "La media aumentará más que la mediana.", "c": "La mediana aumentará más que la media.", "d": "Ambas permanecerán iguales."}',
'b', 'La media es sensible a valores extremos, por lo que aumentará significativamente con el dato 100. La mediana aumentará muy poco o nada.', 'Probabilidad y Estadística', 'Estadística descriptiva', 'Medidas de tendencia central', 3, true),

('paes2022_m2_003', 'M2', 'Si log(8/125) = m, ¿cuál es el valor de m expresado en términos de log 2 y log 5?',
'{"a": "3log2 - 3log5", "b": "log2 - log5", "c": "3log2 + 3log5", "d": "log8 - log125"}',
'a', 'log(8/125) = log8 - log125 = log(2³) - log(5³) = 3log2 - 3log5.', 'Álgebra', 'Logaritmos', 'Propiedades de logaritmos', 3, true),

('paes2022_m2_004', 'M2', 'La función f(x) = x² - 6x + 8 tiene dos raíces reales. ¿Cuál es la suma de estas raíces?',
'{"a": "-8", "b": "-6", "c": "2", "d": "6", "e": "8"}',
'd', 'Por las relaciones de Vieta, la suma de las raíces de ax² + bx + c es -b/a = -(-6)/1 = 6.', 'Álgebra', 'Funciones cuadráticas', 'Raíces de ecuaciones', 2, true),

('paes2022_m2_005', 'M2', 'En un triángulo rectángulo, si sen(α) = 3/5, ¿cuál es el valor de cos(α)?',
'{"a": "3/5", "b": "4/5", "c": "5/4", "d": "5/3", "e": "3/4"}',
'b', 'Usando sen²(α) + cos²(α) = 1: cos²(α) = 1 - 9/25 = 16/25. cos(α) = 4/5.', 'Geometría', 'Trigonometría', 'Razones trigonométricas', 2, true),

('paes2022_m2_006', 'M2', 'En una progresión aritmética, el primer término es 5 y la diferencia común es 3. ¿Cuál es el término número 20?',
'{"a": "57", "b": "60", "c": "62", "d": "65", "e": "68"}',
'c', 'an = a1 + (n-1)d = 5 + (20-1)×3 = 5 + 57 = 62.', 'Álgebra', 'Sucesiones', 'Progresiones aritméticas', 2, true),

('paes2022_m2_007', 'M2', '¿Cuál es la distancia entre los puntos A(2, 3) y B(6, 6)?',
'{"a": "3", "b": "4", "c": "5", "d": "6", "e": "7"}',
'c', 'd = √[(6-2)² + (6-3)²] = √[16 + 9] = √25 = 5.', 'Geometría', 'Geometría analítica', 'Distancia entre puntos', 1, true),

('paes2022_m2_008', 'M2', 'Se lanza un dado común dos veces. ¿Cuál es la probabilidad de obtener suma igual a 7?',
'{"a": "1/36", "b": "1/12", "c": "1/6", "d": "5/36", "e": "7/36"}',
'c', 'Las combinaciones que suman 7 son: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 casos. P = 6/36 = 1/6.', 'Probabilidad y Estadística', 'Probabilidad', 'Probabilidad de eventos', 2, true),

('paes2022_m2_009', 'M2', 'En un gráfico de barras, la barra más alta representa 40 estudiantes y corresponde al 25% del total. ¿Cuántos estudiantes hay en total?',
'{"a": "100", "b": "120", "c": "160", "d": "200", "e": "250"}',
'c', 'Si 40 = 25% del total, entonces total = 40/0,25 = 160 estudiantes.', 'Probabilidad y Estadística', 'Estadística descriptiva', 'Interpretación de gráficos', 2, true),

('paes2022_m2_010', 'M2', 'Una urna contiene 3 bolas rojas y 2 bolas azules. Si se extrae una bola al azar, ¿cuál es la probabilidad de que sea roja?',
'{"a": "2/5", "b": "3/5", "c": "1/2", "d": "2/3", "e": "3/2"}',
'b', 'P(roja) = número de bolas rojas / total de bolas = 3/5.', 'Probabilidad y Estadística', 'Probabilidad', 'Probabilidad simple', 1, true),

('paes2022_m2_011', 'M2', 'Si f(x) = x² - 4, ¿para qué valores de x se cumple que f(x) = 0?',
'{"a": "x = 4", "b": "x = -4", "c": "x = 2 y x = -2", "d": "x = 0", "e": "x = 4 y x = -4"}',
'c', 'x² - 4 = 0 → x² = 4 → x = ±2.', 'Álgebra', 'Ecuaciones', 'Ecuaciones cuadráticas', 2, true),

('paes2022_m2_012', 'M2', '¿Cuál es la ecuación de la recta que pasa por el origen y tiene pendiente 3?',
'{"a": "y = 3", "b": "x = 3", "c": "y = 3x", "d": "y = x + 3", "e": "y = 3x + 3"}',
'c', 'Una recta que pasa por el origen tiene ecuación y = mx. Con m = 3: y = 3x.', 'Geometría', 'Geometría analítica', 'Ecuación de la recta', 1, true)

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  options = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  area_tematica = EXCLUDED.area_tematica,
  tema = EXCLUDED.tema,
  subtema = EXCLUDED.subtema,
  difficulty = EXCLUDED.difficulty,
  active = EXCLUDED.active;

SELECT '✅ 91 preguntas PAES 2022 insertadas exitosamente' as resultado;
