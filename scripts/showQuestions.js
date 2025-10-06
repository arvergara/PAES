// Este script importa la clase LocalDB del script principal y muestra las preguntas generadas
// Como LocalDB es una clase en memoria, tenemos que simular la ejecución del script principal

import "dotenv/config";
import fs from "fs/promises";

// Recreamos la clase LocalDB
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

// Suponemos que las preguntas fueron guardadas en un archivo JSON
async function main() {
  try {
    // Cargamos las últimas preguntas generadas del archivo sample.json
    // Primero verificamos si existe el archivo
    try {
      await fs.access("sample.json");
      const jsonData = await fs.readFile("sample.json", "utf-8");
      const questions = JSON.parse(jsonData);

      console.log("=== PREGUNTAS GENERADAS ===");

      questions.forEach((q, index) => {
        console.log(`\n--- Pregunta ${index + 1} ---`);
        console.log(`Asignatura: ${q.subject}`);
        console.log(`Área Temática: ${q.area_tematica}`);
        console.log(`Tema: ${q.tema}`);
        console.log(`Subtema: ${q.subtema || "General"}`);
        console.log(`Dificultad: ${q.difficulty}/5`);
        console.log(`\nPregunta: ${q.content}`);

        console.log("\nOpciones:");
        for (const [letra, texto] of Object.entries(q.options)) {
          console.log(`${letra.toUpperCase()}. ${texto}`);
        }

        console.log(`\nRespuesta correcta: ${q.correct_answer.toUpperCase()}`);
        console.log(`\nExplicación: ${q.explanation}`);
      });
    } catch (error) {
      console.log(
        "No se encontraron preguntas guardadas. Ejecuta el script generateQuestions.js primero y guarda el resultado en sample.json"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
