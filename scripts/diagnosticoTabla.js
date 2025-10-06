// scripts/diagnosticoTabla.js (actualizado)
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener la ruta actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Variables de entorno no definidas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const outputPath = path.join(__dirname, "..", "diagnostico_tabla.txt");

// Función para escribir en el archivo de log y en la consola
function log(message) {
  console.log(message);
  fs.appendFileSync(outputPath, message + "\n");
}

async function diagnosticarTabla() {
  try {
    // Inicializar archivo de salida
    fs.writeFileSync(
      outputPath,
      "=== Diagnóstico de la tabla 'questions' ===\n\n"
    );

    log("Consultando estructura de la tabla 'questions'...");

    // Obtener todas las preguntas de tipo M2
    const { data: m2Questions, error: m2Error } = await supabase
      .from("questions")
      .select("*")
      .eq("subject", "M2")
      .limit(5);

    if (m2Error) {
      log("Error al obtener preguntas M2: " + m2Error.message);
      return;
    }

    if (m2Questions && m2Questions.length > 0) {
      log(`Encontradas ${m2Questions.length} preguntas M2 existentes`);

      // Analizar el campo active
      log("\nAnálisis del campo 'active':");
      m2Questions.forEach((q, i) => {
        log(`  Pregunta ${i + 1}: ${q.active} (tipo: ${typeof q.active})`);
      });

      // Analizar los valores en area_tematica, tema, subtema y habilidad
      log("\nValores en campos clave:");
      m2Questions.forEach((q, i) => {
        log(`\nPregunta ${i + 1}:`);
        log(
          `  area_tematica: "${
            q.area_tematica
          }" (tipo: ${typeof q.area_tematica})`
        );
        log(`  tema: "${q.tema}" (tipo: ${typeof q.tema})`);
        log(`  subtema: "${q.subtema}" (tipo: ${typeof q.subtema})`);
        log(`  habilidad: "${q.habilidad}" (tipo: ${typeof q.habilidad})`);
      });

      // Ver qué valores distintos existen en estos campos
      const { data: uniqueValues, error: uniqueError } = await supabase
        .from("questions")
        .select("area_tematica, tema, subtema, habilidad")
        .eq("subject", "M2");

      if (!uniqueError && uniqueValues) {
        // Extraer valores únicos
        const areas = new Set(
          uniqueValues.map((q) => q.area_tematica).filter(Boolean)
        );
        const temas = new Set(uniqueValues.map((q) => q.tema).filter(Boolean));
        const subtemas = new Set(
          uniqueValues.map((q) => q.subtema).filter(Boolean)
        );
        const habilidades = new Set(
          uniqueValues.map((q) => q.habilidad).filter(Boolean)
        );

        log("\nValores únicos en cada campo:");
        log("  area_tematica: " + JSON.stringify([...areas]));
        log("  tema: " + JSON.stringify([...temas]));
        log("  subtema: " + JSON.stringify([...subtemas]));
        log("  habilidad: " + JSON.stringify([...habilidades]));
      }

      // Analizar una pregunta completa para ver todos sus campos
      log("\nEstructura completa de una pregunta M2:");
      log(JSON.stringify(m2Questions[0], null, 2));
    } else {
      log("No se encontraron preguntas M2 existentes");

      // Buscar cualquier otra pregunta como ejemplo
      const { data: anyQuestions, error: anyError } = await supabase
        .from("questions")
        .select("*")
        .limit(1);

      if (!anyError && anyQuestions && anyQuestions.length > 0) {
        log("Ejemplo de pregunta existente (subject no es M2):");
        log(JSON.stringify(anyQuestions[0], null, 2));
      }
    }

    // Intentar obtener la definición de la restricción
    log("\nBuscando la restricción 'valid_subject_structure'...");
    try {
      const { data, error } = await supabase.rpc("pg_get_constraintdef", {
        constraint_oid: "valid_subject_structure",
      });

      if (!error && data) {
        log("Definición de la restricción: " + data);
      } else {
        log(
          "No se pudo obtener la definición de la restricción: " +
            (error?.message || "Error desconocido")
        );
      }
    } catch (e) {
      log(
        "Error al intentar obtener la definición de la restricción: " +
          e.message
      );
    }

    log("\nDiagnóstico completo. Resultados guardados en: " + outputPath);
  } catch (error) {
    log("Error general: " + error.message);
  }
}

diagnosticarTabla();
