// loadQuestionsComplete.js
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Configurar dotenv
config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Variables de entorno no definidas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const __dirname = dirname(fileURLToPath(import.meta.url));
const questionBankPath = join(__dirname, "../data/m2_question_bank_completo.json");

async function loadQuestions() {
  try {
    console.log("Leyendo archivo...");
    const rawData = fs.readFileSync(questionBankPath, "utf8");
    const questionBank = JSON.parse(rawData);

    if (!questionBank.preguntas || !Array.isArray(questionBank.preguntas)) {
      console.error("Formato inesperado");
      return;
    }

    console.log(`Total de preguntas: ${questionBank.preguntas.length}`);

    // Crear una pregunta de prueba completa
    const testQuestion = {
      subject: "M2",
      content: "Pregunta de prueba",
      options: [
        { label: "a", text: "Opción A" },
        { label: "b", text: "Opción B" },
        { label: "c", text: "Opción C" },
        { label: "d", text: "Opción D" },
        { label: "e", text: "Opción E" },
      ],
      correct_answer: "a",
      explanation: "Explicación de prueba",
      habilidad: "Aplicar", // Añadido el campo habilidad
      difficulty: 1,
      active: true,
      area_tematica: "Algebra y funciones",
      tema: "Funciones",
      subtema: "Dominio y recorrido",
    };

    console.log("Insertando pregunta de prueba...");
    const { data: testData, error: testError } = await supabase
      .from("questions")
      .insert([testQuestion]);

    if (testError) {
      console.error("Error con pregunta de prueba:", testError.message);
      if (testError.cause) {
        console.error("Causa:", testError.cause);
      }
      console.error("Error completo:", testError);
      console.error("Detalles:", JSON.stringify(testQuestion, null, 2));

      // Si el error es por el campo habilidad, intentar sin él
      if (testError.message.includes("habilidad")) {
        delete testQuestion.habilidad;
        console.log("Intentando sin el campo habilidad...");
        const { data, error } = await supabase
          .from("questions")
          .insert([testQuestion]);

        if (error) {
          console.error("Sigue habiendo error:", error.message);
          return;
        } else {
          console.log("¡Funcionó sin el campo habilidad!");
        }
      } else {
        return;
      }
    } else {
      console.log("Pregunta de prueba insertada correctamente.");
    }

    // Procesar cada pregunta a la vez
    let successCount = 0;

    for (let i = 0; i < questionBank.preguntas.length; i++) {
      const pregunta = questionBank.preguntas[i];

      // Asegurarse de que las alternativas son un array
      const alternativas = Array.isArray(pregunta.alternativas)
        ? pregunta.alternativas
        : [];

      // Asegurarse de que hay 5 alternativas
      while (alternativas.length < 5) {
        alternativas.push(
          `Opción ${String.fromCharCode(65 + alternativas.length)}`
        );
      }

      // Preparar la pregunta con todos los campos necesarios
      const question = {
        subject: "M2",
        content: pregunta.texto || "",
        options: [
          { label: "a", text: alternativas[0] || "" },
          { label: "b", text: alternativas[1] || "" },
          { label: "c", text: alternativas[2] || "" },
          { label: "d", text: alternativas[3] || "" },
          { label: "e", text: alternativas[4] || "" },
        ],
        correct_answer: (pregunta.correcta || "A").toLowerCase(),
        explanation: pregunta.explicacion || "",
        habilidad: "Aplicar", // Añadido el campo habilidad con valor predeterminado
        area_tematica: pregunta.area_tematica || null,
        tema: pregunta.tema || null,
        subtema: pregunta.subtema || null,
        difficulty: pregunta.dificultad || 1,
        active: true,
      };

      try {
        const { error } = await supabase.from("questions").insert([question]);

        if (error) {
          console.error(`Error en pregunta ${i + 1}:`, error.message);

          // Si el problema es el campo habilidad, intentar sin él
          if (error.message.includes("habilidad")) {
            delete question.habilidad;
            const { error: retryError } = await supabase
              .from("questions")
              .insert([question]);

            if (retryError) {
              console.error(
                `Sigue habiendo error en pregunta ${i + 1}:`,
                retryError.message
              );
            } else {
              successCount++;
            }
          }
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`Progreso: ${successCount} preguntas insertadas`);
          }
        }
      } catch (e) {
        console.error(`Excepción en pregunta ${i + 1}:`, e.message);
      }

      // Breve pausa entre inserciones
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(
      `Proceso completado: ${successCount} de ${questionBank.preguntas.length} preguntas insertadas`
    );
  } catch (error) {
    console.error("Error general:", error);
  }
}

loadQuestions();
