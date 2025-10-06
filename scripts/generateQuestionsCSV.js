// scripts/generateQuestionsCSV_fixed.js
import { createObjectCsvWriter } from "csv-writer";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Cargar variables de entorno
dotenv.config();

// Obtener la ruta actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a tu archivo JSON
const questionBankPath =
  "/Users/alfil/Mi unidad/5_PAES/simulador-paes/m2_question_bank_completo.json";
const outputPath = path.join(__dirname, "..", "questions_export_fixed.csv");

// Mapeo de área temática y habilidad según valores permitidos
function mapAreaTematica(area) {
  const areasPermitidas = {
    "Algebra y funciones": "Álgebra",
    Numeros: "Números",
    Geometria: "Geometría",
    "Probabilidad y Estadistica": "Probabilidad y Estadística",
  };

  return areasPermitidas[area] || "Geometría"; // Valor por defecto
}

function mapHabilidad(area) {
  const habilidadesPermitidas = {
    "Algebra y funciones": "Álgebra y Funciones",
    Numeros: "Números",
    Geometria: "Geometría",
    "Probabilidad y Estadistica": "Probabilidad y Estadística",
  };

  return habilidadesPermitidas[area] || "Geometría"; // Valor por defecto
}

async function generateCSV() {
  try {
    console.log("Leyendo archivo JSON...");
    // Leer JSON
    const rawData = fs.readFileSync(questionBankPath, "utf8");
    const questionBank = JSON.parse(rawData);

    if (!questionBank.preguntas || !Array.isArray(questionBank.preguntas)) {
      console.error("Formato inesperado");
      return;
    }

    console.log(`Encontradas ${questionBank.preguntas.length} preguntas`);

    // Obtener fecha actual en formato ISO
    const currentDate = new Date().toISOString();

    // Preparar datos para CSV en el orden correcto
    const records = questionBank.preguntas.map((pregunta) => {
      // Asegurarse de que hay suficientes alternativas (solo 4, no 5)
      const alternativas = Array.isArray(pregunta.alternativas)
        ? pregunta.alternativas.slice(0, 4)
        : [];
      while (alternativas.length < 4) {
        alternativas.push(
          `Opción ${String.fromCharCode(65 + alternativas.length)}`
        );
      }

      // Formato correcto para las opciones: objeto con propiedades a, b, c, d
      const options = {
        a: alternativas[0] || "",
        b: alternativas[1] || "",
        c: alternativas[2] || "",
        d: alternativas[3] || "",
      };

      // Mapear área temática y habilidad a valores permitidos
      const areaTematica = mapAreaTematica(pregunta.area_tematica);
      const habilidad = mapHabilidad(pregunta.area_tematica);

      // Ajustar respuesta correcta si es "E" (ya que solo tenemos 4 alternativas)
      let correctAnswer = (pregunta.correcta || "A").toLowerCase();
      if (correctAnswer === "e") {
        correctAnswer = "d"; // Cambiar E a D
      }

      // Orden exacto de columnas según la base de datos
      return {
        id: uuidv4(),
        subject: "M2",
        content: pregunta.texto || "",
        options: JSON.stringify(options),
        correct_answer: correctAnswer,
        explanation: pregunta.explicacion || "",
        difficulty: pregunta.dificultad || 1,
        created_at: currentDate,
        active: true,
        area_tematica: areaTematica,
        tema: pregunta.tema || "Razones trigonométricas",
        subtema: null,
        habilidad: habilidad,
        origen: "AI Generated",
      };
    });

    console.log("Configurando escritor CSV...");
    // Configurar escritor CSV con el orden exacto de las columnas
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: "id", title: "id" },
        { id: "subject", title: "subject" },
        { id: "content", title: "content" },
        { id: "options", title: "options" },
        { id: "correct_answer", title: "correct_answer" },
        { id: "explanation", title: "explanation" },
        { id: "difficulty", title: "difficulty" },
        { id: "created_at", title: "created_at" },
        { id: "active", title: "active" },
        { id: "area_tematica", title: "area_tematica" },
        { id: "tema", title: "tema" },
        { id: "subtema", title: "subtema" },
        { id: "habilidad", title: "habilidad" },
        { id: "origen", title: "origen" },
      ],
    });

    console.log("Escribiendo CSV...");
    // Escribir CSV
    await csvWriter.writeRecords(records);

    console.log(`CSV generado exitosamente: ${outputPath}`);
    console.log(`Total de preguntas exportadas: ${records.length}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateCSV();
