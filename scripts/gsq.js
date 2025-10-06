// scripts/generateSampleQuestion.js
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

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

async function analyzeSampleQuestion() {
  try {
    // Primero, recuperamos una pregunta existente para entender su estructura exacta
    const { data: existingQuestions, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .limit(1);

    if (fetchError) {
      console.error(
        "Error al recuperar preguntas existentes:",
        fetchError.message
      );
      return;
    }

    if (!existingQuestions || existingQuestions.length === 0) {
      console.log("No se encontraron preguntas existentes para analizar.");
      return;
    }

    const sampleQuestion = existingQuestions[0];

    console.log("Estructura completa de una pregunta existente:");
    console.log(JSON.stringify(sampleQuestion, null, 2));

    // Analizar específicamente el campo options
    console.log("\nEstructura del campo 'options':");
    try {
      const options = JSON.parse(sampleQuestion.options);
      console.log(JSON.stringify(options, null, 2));
      console.log("Tipo de datos:", typeof options);
      console.log("Es array:", Array.isArray(options));
      if (Array.isArray(options) && options.length > 0) {
        console.log(
          "Estructura de una opción:",
          JSON.stringify(options[0], null, 2)
        );
      }
    } catch (e) {
      console.log(
        "El campo options no es un JSON válido:",
        sampleQuestion.options
      );
      console.log("Tipo de datos:", typeof sampleQuestion.options);
    }

    // Analizar otros campos importantes
    console.log("\nValor del campo 'subject':", sampleQuestion.subject);
    console.log("Tipo de datos de 'subject':", typeof sampleQuestion.subject);

    console.log(
      "\nValor del campo 'correct_answer':",
      sampleQuestion.correct_answer
    );
    console.log(
      "Tipo de datos de 'correct_answer':",
      typeof sampleQuestion.correct_answer
    );

    // Intentar crear una pregunta basada en el formato exacto de la existente
    const { data: exemplarQuestions, error: exemplarError } = await supabase
      .from("questions")
      .select("*")
      .eq("subject", "M2")
      .limit(1);

    if (!exemplarError && exemplarQuestions && exemplarQuestions.length > 0) {
      const m2Question = exemplarQuestions[0];
      console.log("\nEjemplo específico de pregunta M2:");
      console.log(JSON.stringify(m2Question, null, 2));
    }
  } catch (error) {
    console.error("Error general:", error);
  }
}

analyzeSampleQuestion();
