import "dotenv/config";
import { Ollama } from "ollama";
import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import * as csv from "csv"; // Cambiar la importación del módulo csv

// ---- Base de datos en memoria para pruebas ----
class LocalDB {
  constructor() {
    this.tables = {
      questions: [],
    };
  }

  from(table) {
    return {
      insert: (records) => {
        const ids = [];
        for (const record of records) {
          record.id = Date.now() + Math.floor(Math.random() * 1000);
          record.created_at = new Date().toISOString();
          this.tables[table].push(record);
          ids.push(record.id);
        }
        return {
          data: records,
          error: null,
          select: () => ({ data: records, error: null }),
        };
      },
      select: (columns, options) => {
        if (options?.count === "exact") {
          return { count: this.tables[table].length, error: null };
        }
        return { data: this.tables[table], error: null };
      },
    };
  }

  rpc(func) {
    if (func === "version") {
      return { data: "LocalDB 1.0.0", error: null };
    }
    return { data: null, error: { message: "Function not implemented" } };
  }
}

// Crear instancia de LocalDB para pruebas
const supabase = new LocalDB();
const ollama = new Ollama();

// --- Constants and Configuration ---
const QUESTIONS_PER_SUBJECT = 2; // Reducido para pruebas
const BATCH_SIZE = 1;
const MODEL_NAME = "gemma3:27b"; // Actualizado al modelo gemma3:27b para mejorar la precisión
const TEMPERATURE = 0.3; // Reducido para respuestas más deterministas y precisas
const TOP_P = 0.9;
const CONTEXT_WINDOW = 8192; // Aumentado si es necesario
const MAX_TOKENS = 2000; // Aumentado para respuestas completas
const RETRY_DELAY = 10000; // Aumentado a 10 segundos
const MAX_RETRIES = 3; // Reducido para pruebas
const CONTENT_DIR = "content";
const TEMARIO_CSV = "temario.csv";

// Subject configuration matching database schema
const subjects = {
  M1: {
    name: "Matemática 1",
    contentPath: path.join(CONTENT_DIR, "M1_content.pdf"),
    examplesPath: path.join(CONTENT_DIR, "M1_examples.pdf"),
  },
  M2: {
    name: "Matemática 2",
    contentPath: path.join(CONTENT_DIR, "M2_content.pdf"),
    examplesPath: path.join(CONTENT_DIR, "M2_examples.pdf"),
  },
  L: {
    name: "Lenguaje",
    contentPath: path.join(CONTENT_DIR, "L_content.pdf"),
    examplesPath: path.join(CONTENT_DIR, "L_examples.pdf"),
  },
  C: {
    name: "Ciencias",
    contentPath: path.join(CONTENT_DIR, "C_content.pdf"),
    examplesPath: path.join(CONTENT_DIR, "C_examples.pdf"),
  },
  H: {
    name: "Historia",
    contentPath: path.join(CONTENT_DIR, "H_content.pdf"),
    examplesPath: path.join(CONTENT_DIR, "H_examples.pdf"),
  },
};

async function loadTemario(csvPath) {
  let temario = {};
  try {
    console.log(`Leyendo archivo CSV desde ${csvPath}...`);
    const fileContent = await fs.readFile(csvPath, "utf-8");
    console.log(`Archivo CSV leído con éxito (${fileContent.length} bytes)`);

    // Procesar el CSV manualmente para evitar problemas con require
    const lines = fileContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Limpia los encabezados de posibles caracteres especiales
    const rawHeader = lines[0].split(";");
    const header = rawHeader.map((h) => h.trim().replace(/\r$/, ""));

    console.log(`Encabezado detectado: ${header.join(", ")}`);

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";");
      if (values.length >= header.length) {
        const record = {};
        for (let j = 0; j < header.length; j++) {
          // Eliminar cualquier carácter de retorno de carro
          const value = values[j]?.trim().replace(/\r$/, "") || "";
          record[header[j]] = value;
        }
        records.push(record);
      }
    }

    console.log(`CSV parseado: ${records.length} registros encontrados`);

    // Depurar algunos registros para verificar estructura
    console.log("Muestra de registros:");
    for (let i = 0; i < Math.min(3, records.length); i++) {
      console.log(`Registro ${i + 1}:`, records[i]);
    }

    // Contar registros por asignatura
    const subjectCounts = {};
    for (const record of records) {
      const subject = record.Subject;
      if (subject) {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      }
    }
    console.log("Conteo de registros por asignatura:", subjectCounts);

    for (const record of records) {
      const subject = record.Subject;
      const areaTematica = record["Área Temática"]?.trim();
      const tema = record.Tema?.trim();
      const subtema = record.Subtema?.trim();

      // Validación
      if (!subject || !areaTematica || !tema) {
        console.log(`Registro incompleto omitido:`, record);
        continue;
      }

      if (!temario[subject]) {
        temario[subject] = {};
      }
      if (!temario[subject][areaTematica]) {
        temario[subject][areaTematica] = {};
      }
      if (!temario[subject][areaTematica][tema]) {
        temario[subject][areaTematica][tema] = [];
      }
      if (subtema) {
        temario[subject][areaTematica][tema].push(subtema);
      }
    }

    const subjectsLoaded = Object.keys(temario);
    console.log("Asignaturas cargadas en el temario:", subjectsLoaded);
    for (const subject of subjectsLoaded) {
      const areasCount = Object.keys(temario[subject]).length;
      console.log(`Asignatura ${subject}: ${areasCount} áreas temáticas`);
    }
  } catch (error) {
    console.error(`Error al leer o procesar el archivo CSV ${csvPath}:`, error);
    return null;
  }
  return temario;
}

async function extractPdfContent(pdfPath) {
  try {
    // Verificar si existe el archivo
    try {
      await fs.access(pdfPath);
    } catch (e) {
      // Si el archivo no existe, intentar usar una versión .txt del mismo
      const txtPath = pdfPath.replace(".pdf", ".txt");
      try {
        await fs.access(txtPath);
        console.log(`Archivo PDF no encontrado, usando texto de ${txtPath}`);
        return await fs.readFile(txtPath, "utf-8");
      } catch (txtError) {
        console.error(
          `No se encontró ni PDF ni archivo TXT: ${pdfPath} / ${txtPath}`
        );
        throw e; // Lanzar el error original
      }
    }

    // Si llegamos aquí, el PDF existe
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error al leer el archivo ${pdfPath}:`, error);
    return "";
  }
}

async function getExampleQuestions(subject, examplesPath, numExamples = 5) {
  try {
    const fullText = await extractPdfContent(examplesPath);
    if (!fullText) return "";

    // Si tenemos un archivo de texto, simplemente utilizarlo como está
    if (examplesPath.endsWith(".txt")) {
      return fullText;
    }

    // Procesamiento para PDF
    const questionPattern = /(?:\n\d+\.|\nPregunta \d+|\n[A-E]\.|\n[A-E]\))/g;
    let questions = fullText.split(questionPattern);
    questions = questions.filter((q) => q.trim().length > 20);
    // Mezclar las preguntas
    questions.sort(() => Math.random() - 0.5);
    return questions.slice(0, numExamples).join("\n\n");
  } catch (error) {
    console.error(
      `Error getting example questions from ${examplesPath}:`,
      error
    );
    return "";
  }
}

async function generatePrompt(
  subject,
  areaTematica,
  tema,
  subtema,
  subjectContent,
  exampleQuestions
) {
  return `Eres un experto profesor diseñando preguntas para la Prueba de Acceso a la Educación Superior (PAES) chilena en ${
    subjects[subject].name
  }.

Área Temática: ${areaTematica}
Tema: ${tema}
Subtema: ${subtema || "General"}

Referencia de Contenido (usa solo lo relevante para la pregunta):
${
  subjectContent.length > 3000
    ? subjectContent.substring(0, 3000) + "..."
    : subjectContent
}


Preguntas de ejemplo (formato y nivel de dificultad, NO USAR LAS MISMAS PREGUNTAS):
${exampleQuestions}

Basado en el contenido y los ejemplos anteriores, genera UNA SOLA pregunta de selección múltiple que siga ESTRICTAMENTE estas reglas:
1. La pregunta DEBE ser relevante para el área temática, tema y subtema especificados.
2. Todas las opciones DEBEN ser plausibles, pero SOLO UNA correcta.  Evita opciones como "Todas las anteriores" o "Ninguna de las anteriores".
3. Incluye una explicación DETALLADA de por qué la respuesta correcta es correcta y por qué cada una de las otras opciones son incorrectas.
4. La pregunta DEBE evaluar habilidades de pensamiento de orden superior (análisis, aplicación, evaluación).
5. Asigna un nivel de dificultad según estos criterios:
   - Nivel 1: Conocimiento y comprensión básica.
   - Nivel 2: Aplicación directa de conceptos.
   - Nivel 3: Análisis y aplicación en contextos nuevos.
   - Nivel 4: Evaluación y resolución de problemas complejos.
   - Nivel 5: Síntesis y creación de soluciones originales (poco común).

Genera la respuesta en este formato JSON EXACTO y COMPLETO (sin texto adicional, sin comentarios):
\`\`\`json
{
  "content": "Texto completo de la pregunta, incluyendo el enunciado y cualquier contexto necesario.",
  "options": {
    "a": "Opción A completa.",
    "b": "Opción B completa.",
    "c": "Opción C completa.",
    "d": "Opción D completa."
  },
  "correct_answer": "Letra de la opción correcta (a, b, c, o d).",
  "explanation": "Explicación detallada de por qué la respuesta correcta es correcta y por qué cada una de las incorrectas es incorrecta.",
  "area_tematica": "${areaTematica}",
  "tema": "${tema}",
  "subtema": "${subtema || ""}",
  "difficulty": "Número entre 1 y 5 según los criterios especificados."
}
\`\`\`
`;
}

async function generateQuestion(
  subject,
  areaTematica,
  tema,
  subtema,
  subjectContent,
  exampleQuestions,
  attempt = 1
) {
  console.log(
    `[Intento ${attempt}] Generando pregunta para ${subject}: ${areaTematica} - ${tema} - ${
      subtema || "General"
    }`
  );

  const startTime = Date.now();

  try {
    const prompt = await generatePrompt(
      subject,
      areaTematica,
      tema,
      subtema,
      subjectContent,
      exampleQuestions
    );

    console.log(`Enviando prompt al modelo ${MODEL_NAME}...`);
    const modelStartTime = Date.now();
    const response = await ollama.generate({
      model: MODEL_NAME,
      prompt,
      format: "json", // Muy importante: forzar formato JSON
      stream: false, // Simplifica el manejo de la respuesta
      options: {
        temperature: TEMPERATURE,
        top_p: TOP_P,
        num_predict: MAX_TOKENS, // Usar num_predict en lugar de max_tokens
        top_k: 50, // Añadir top_k si es necesario
        stop: ["\n\n", "```"], // Tokens de parada para evitar respuestas incompletas.
      },
    });
    const modelEndTime = Date.now();
    const modelTimeSeconds = ((modelEndTime - modelStartTime) / 1000).toFixed(
      2
    );

    console.log(
      `Respuesta recibida en ${modelTimeSeconds} segundos, longitud: ${
        response.response?.length || 0
      } caracteres`
    );

    // Extraer JSON de la respuesta
    let jsonString = response.response.trim();
    let question;

    // Intentar extraer JSON si está envuelto en bloques de código markdown
    if (jsonString.includes("```json")) {
      console.log("Detectado formato con bloques de código markdown");
      const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonString = match[1].trim();
      }
    } else if (jsonString.includes("```")) {
      console.log("Detectado formato con bloques de código genéricos");
      const match = jsonString.match(/```\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonString = match[1].trim();
      }
    }

    try {
      console.log("Intentando parsear JSON...");
      question = JSON.parse(jsonString);
      console.log("JSON parseado exitosamente");
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError.message);
      console.log("JSON recibido:", jsonString.substring(0, 200) + "...");

      if (attempt < MAX_RETRIES) {
        console.log(
          `Reintentando (intento ${attempt + 1} de ${MAX_RETRIES})...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return await generateQuestion(
          subject,
          areaTematica,
          tema,
          subtema,
          subjectContent,
          exampleQuestions,
          attempt + 1
        );
      }
      throw new Error("Agotados todos los intentos de parseo JSON");
    }

    // Validación estricta del formato JSON
    console.log("Validando formato de la pregunta...");
    const validationErrors = [];

    if (!question.content || typeof question.content !== "string")
      validationErrors.push("Falta campo 'content' o no es string");

    if (!question.options || typeof question.options !== "object")
      validationErrors.push("Falta campo 'options' o no es objeto");
    else if (Object.keys(question.options).length !== 4)
      validationErrors.push(
        `La pregunta debe tener exactamente 4 opciones, tiene ${
          Object.keys(question.options).length
        }`
      );

    if (!question.correct_answer || typeof question.correct_answer !== "string")
      validationErrors.push("Falta campo 'correct_answer' o no es string");
    else if (
      !["a", "b", "c", "d"].includes(question.correct_answer.toLowerCase())
    )
      validationErrors.push(
        `Respuesta correcta inválida: ${question.correct_answer}, debe ser a, b, c o d`
      );

    if (!question.explanation || typeof question.explanation !== "string")
      validationErrors.push("Falta campo 'explanation' o no es string");

    if (!question.area_tematica || typeof question.area_tematica !== "string")
      validationErrors.push("Falta campo 'area_tematica' o no es string");

    if (!question.tema || typeof question.tema !== "string")
      validationErrors.push("Falta campo 'tema' o no es string");

    if (
      question.difficulty === undefined ||
      isNaN(parseInt(question.difficulty))
    )
      validationErrors.push("Falta campo 'difficulty' o no es un número");

    if (validationErrors.length > 0) {
      console.error("Validación fallida:", validationErrors.join(", "));
      if (attempt < MAX_RETRIES) {
        console.log(
          `Reintentando generación (intento ${
            attempt + 1
          } de ${MAX_RETRIES})...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return await generateQuestion(
          subject,
          areaTematica,
          tema,
          subtema,
          subjectContent,
          exampleQuestions,
          attempt + 1
        );
      }
      throw new Error(
        "Formato de pregunta inválido después de todos los intentos"
      );
    }

    console.log(
      "Pregunta validada correctamente, preparando para inserción en DB"
    );

    // Normalizar datos
    question.subject = subject;
    question.active = true;
    question.difficulty = Math.max(
      1,
      Math.min(5, parseInt(question.difficulty) || 3)
    );

    // Asegurar que correct_answer sea minúscula
    question.correct_answer = question.correct_answer.toLowerCase();

    console.log("Insertando pregunta en Supabase...");
    const { data, error } = await supabase
      .from("questions")
      .insert([question])
      .select();

    if (error) {
      console.error(`Error insertando en Supabase:`, error);
      throw error;
    }

    console.log(
      `Pregunta insertada exitosamente con ID: ${
        data?.[0]?.id || "desconocido"
      }`
    );

    const endTime = Date.now();
    const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
    console.log(
      `Tiempo total para generar la pregunta: ${totalTimeSeconds} segundos`
    );
    return true; // Éxito
  } catch (error) {
    console.error(`Error en generateQuestion:`, error.message);

    const endTime = Date.now();
    const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
    console.log(
      `Tiempo transcurrido antes del error: ${totalTimeSeconds} segundos`
    );

    if (attempt < MAX_RETRIES) {
      console.log(
        `Reintentando generación completa (intento ${
          attempt + 1
        } de ${MAX_RETRIES})...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return await generateQuestion(
        subject,
        areaTematica,
        tema,
        subtema,
        subjectContent,
        exampleQuestions,
        attempt + 1
      );
    }

    console.error(`Agotados todos los intentos para esta pregunta.`);
    return false; // Falló después de todos los intentos
  }
}

async function generateQuestionsForSubject(subject, temario) {
  console.log(`Loading content for ${subject}...`);

  const [subjectContent, exampleQuestions] = await Promise.all([
    extractPdfContent(subjects[subject].contentPath),
    getExampleQuestions(subject, subjects[subject].examplesPath),
  ]);

  if (!subjectContent || !exampleQuestions) {
    console.error(`Missing content for ${subject}. Skipping...`);
    return;
  }

  let questionCount = 0;
  const areasTematicas = Object.keys(temario[subject]);

  while (questionCount < QUESTIONS_PER_SUBJECT) {
    // Iterar sobre las áreas temáticas, temas y subtemas en orden.
    for (const areaTematica of areasTematicas) {
      const temas = Object.keys(temario[subject][areaTematica]);
      for (const tema of temas) {
        const subtemas = temario[subject][areaTematica][tema];
        for (const subtema of subtemas.length > 0 ? subtemas : [null]) {
          // Considerar el caso sin subtemas

          if (questionCount >= QUESTIONS_PER_SUBJECT) {
            break; // Salir si ya se generaron suficientes preguntas
          }

          await generateQuestion(
            subject,
            areaTematica,
            tema,
            subtema,
            subjectContent,
            exampleQuestions
          );

          questionCount++;

          if (questionCount % BATCH_SIZE === 0) {
            console.log(
              `Generated ${questionCount}/${QUESTIONS_PER_SUBJECT} questions for ${subject}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Pequeña pausa
          }
          if (questionCount >= QUESTIONS_PER_SUBJECT) break;
        }
        if (questionCount >= QUESTIONS_PER_SUBJECT) break;
      }
      if (questionCount >= QUESTIONS_PER_SUBJECT) break;
    }
  }
}

async function saveQuestionsToJson(questions, filepath = "sample.json") {
  try {
    await fs.writeFile(filepath, JSON.stringify(questions, null, 2), "utf-8");
    console.log(`Preguntas guardadas exitosamente en ${filepath}`);
  } catch (error) {
    console.error(`Error al guardar preguntas en ${filepath}:`, error);
  }
}

async function generateQuestions() {
  console.log("=== INICIANDO GENERACIÓN DE PREGUNTAS ===");
  console.log(
    `Modelo: ${MODEL_NAME}, Temperatura: ${TEMPERATURE}, Top-P: ${TOP_P}`
  );
  console.log(
    `Preguntas por asignatura: ${QUESTIONS_PER_SUBJECT}, Tamaño de lote: ${BATCH_SIZE}`
  );
  console.log(
    `Intentos máximos: ${MAX_RETRIES}, Retraso entre reintentos: ${RETRY_DELAY}ms`
  );

  try {
    // Verificar conexión con Supabase
    console.log("Verificando conexión con Supabase...");
    const { data: versionData, error: versionError } = await supabase.rpc(
      "version"
    );

    if (versionError) {
      throw new Error(`Error conectando con Supabase: ${versionError.message}`);
    }
    console.log(
      `Conexión con Supabase exitosa. Versión PostgreSQL: ${versionData}`
    );

    // Verificar acceso a la tabla questions
    console.log("Verificando acceso a la tabla 'questions'...");
    const { count, error: countError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(
        `Error accediendo a la tabla 'questions': ${countError.message}`
      );
    }
    console.log(
      `Acceso a tabla 'questions' exitoso. Registros actuales: ${count}`
    );

    // Crear directorio de contenido si no existe
    console.log(`Verificando directorio de contenido (${CONTENT_DIR})...`);
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    console.log("Directorio de contenido verificado.");

    // Cargar temario
    console.log(`Cargando temario desde ${TEMARIO_CSV}...`);
    const temario = await loadTemario(TEMARIO_CSV);
    if (!temario) {
      throw new Error("Error al cargar temario");
    }
    console.log("Temario cargado exitosamente.");

    // Configurar asignatura a generar
    const subjectToGenerate = "M1";
    console.log(
      `Generando ${QUESTIONS_PER_SUBJECT} preguntas para ${subjectToGenerate} (${subjects[subjectToGenerate].name})...`
    );

    // Verificar contenido de la asignatura
    const contentPath = subjects[subjectToGenerate].contentPath;
    const examplesPath = subjects[subjectToGenerate].examplesPath;

    try {
      await fs.access(contentPath);
      console.log(`Archivo de contenido encontrado: ${contentPath}`);
    } catch (e) {
      throw new Error(`Archivo de contenido no encontrado: ${contentPath}`);
    }

    try {
      await fs.access(examplesPath);
      console.log(`Archivo de ejemplos encontrado: ${examplesPath}`);
    } catch (e) {
      throw new Error(`Archivo de ejemplos no encontrado: ${examplesPath}`);
    }

    // Generar preguntas
    if (temario[subjectToGenerate]) {
      console.log("Iniciando generación de preguntas...");
      await generateQuestionsForSubject(subjectToGenerate, temario);
      console.log(`Generación completada para ${subjectToGenerate}`);

      // Guardar las preguntas generadas en un archivo JSON
      const { data: questions } = await supabase.from("questions").select("*");
      if (questions && questions.length > 0) {
        await saveQuestionsToJson(questions);
      }
    } else {
      throw new Error(
        `No se encontraron entradas en el temario para: ${subjectToGenerate}`
      );
    }

    console.log("=== GENERACIÓN DE PREGUNTAS COMPLETADA ===");

    /*
    // Código original para generar todas las asignaturas (ahora correctamente indentado)
    for (const subject of Object.keys(subjects)) {
      if (temario[subject]) {
        await generateQuestionsForSubject(subject, temario);
      } else {
        console.warn(`No temario entries found for subject: ${subject}`);
      }
    }
    */
  } catch (error) {
    console.error("=== ERROR EN GENERACIÓN DE PREGUNTAS ===");
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  }
}

// Ejecutar generación de preguntas
generateQuestions().catch((error) => {
  console.error("Error fatal en generación de preguntas:", error);
  process.exit(1);
});
