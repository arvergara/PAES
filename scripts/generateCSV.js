// generateCSV.js
import * as fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

// Ruta a tu archivo JSON
const questionBankPath =
  "/Users/alfil/Mi unidad/5_PAES/simulador-paes/m2_question_bank_completo.json";
const outputPath =
  "/Users/alfil/Mi unidad/5_PAES/simulador-paes/questions_export.csv";

async function generateCSV() {
  try {
    // Leer JSON
    const rawData = fs.readFileSync(questionBankPath, "utf8");
    const questionBank = JSON.parse(rawData);

    if (!questionBank.preguntas || !Array.isArray(questionBank.preguntas)) {
      console.error("Formato inesperado");
      return;
    }

    // Preparar datos para CSV
    const records = questionBank.preguntas.map((pregunta) => {
      // Asegurarse de que hay suficientes alternativas
      const alternativas = Array.isArray(pregunta.alternativas)
        ? pregunta.alternativas
        : [];
      while (alternativas.length < 5) {
        alternativas.push(
          `Opción ${String.fromCharCode(65 + alternativas.length)}`
        );
      }

      const options = [
        { label: "a", text: alternativas[0] || "" },
        { label: "b", text: alternativas[1] || "" },
        { label: "c", text: alternativas[2] || "" },
        { label: "d", text: alternativas[3] || "" },
        { label: "e", text: alternativas[4] || "" },
      ];

      return {
        subject: "M2",
        content: pregunta.texto || "",
        options: JSON.stringify(options),
        correct_answer: (pregunta.correcta || "A").toLowerCase(),
        explanation: pregunta.explicacion || "",
        habilidad: "Aplicar",
        difficulty: pregunta.dificultad || 1,
        active: true,
        area_tematica: pregunta.area_tematica || null,
        tema: pregunta.tema || null,
        subtema: pregunta.subtema || null,
        origen: "AI Generated",
      };
    });

    // Configurar escritor CSV
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: "subject", title: "subject" },
        { id: "content", title: "content" },
        { id: "options", title: "options" },
        { id: "correct_answer", title: "correct_answer" },
        { id: "explanation", title: "explanation" },
        { id: "habilidad", title: "habilidad" },
        { id: "difficulty", title: "difficulty" },
        { id: "active", title: "active" },
        { id: "area_tematica", title: "area_tematica" },
        { id: "tema", title: "tema" },
        { id: "subtema", title: "subtema" },
        { id: "origen", title: "origen" },
      ],
    });

    // Escribir CSV
    await csvWriter.writeRecords(records);

    console.log(`CSV generado exitosamente: ${outputPath}`);
    console.log(`Total de preguntas exportadas: ${records.length}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateCSV();
