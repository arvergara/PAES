/**
 * Script para clasificar preguntas PAES con IA
 * ============================================
 * 
 * Clasifica preguntas existentes en la base de datos usando
 * el modelo de clasificación taxonómica
 */

import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Falta configuración de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ejecuta el clasificador Python para un batch de preguntas
 * @param {Array} questions - Array de preguntas para clasificar
 * @returns {Promise<Array>} Preguntas clasificadas
 */
async function runPythonClassifier(questions) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'classify_batch.py');
    const pythonProcess = spawn('python', [pythonScript]);
    
    let outputData = '';
    let errorData = '';
    
    // Enviar preguntas al proceso Python
    pythonProcess.stdin.write(JSON.stringify(questions));
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python stderr:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Clasificador Python falló con código ${code}: ${errorData}`));
        return;
      }
      
      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Error parseando resultado: ${error.message}`));
      }
    });
  });
}

/**
 * Obtiene preguntas pendientes de clasificación
 * @param {number} limit - Número máximo de preguntas
 * @param {string} subject - Filtrar por materia (opcional)
 * @returns {Promise<Array>} Preguntas sin clasificar
 */
async function getPendingQuestions(limit = 100, subject = null) {
  let query = supabase
    .from('questions')
    .select('*')
    .or('processing_status.is.null,processing_status.eq.pending')
    .limit(limit);
    
  if (subject) {
    query = query.eq('subject', subject);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Error obteniendo preguntas: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Actualiza preguntas clasificadas en la base de datos
 * @param {Array} classifiedQuestions - Preguntas con clasificación
 * @returns {Promise<Object>} Estadísticas de actualización
 */
async function updateClassifiedQuestions(classifiedQuestions) {
  const stats = {
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  for (const question of classifiedQuestions) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          ai_classification: question.ai_classification,
          area_tematica: question.area_tematica,
          tema: question.tema,
          habilidad: question.habilidad,
          classification_confidence: question.classification_confidence,
          processing_status: 'classified',
          processed_at: new Date().toISOString()
        })
        .eq('id', question.id);
        
      if (error) {
        stats.errors++;
        stats.errorDetails.push({
          questionId: question.id,
          error: error.message
        });
      } else {
        stats.updated++;
      }
    } catch (err) {
      stats.errors++;
      stats.errorDetails.push({
        questionId: question.id,
        error: err.message
      });
    }
  }
  
  return stats;
}

/**
 * Función principal para clasificar preguntas
 * @param {Object} options - Opciones de clasificación
 */
async function classifyQuestions(options = {}) {
  const {
    batchSize = 50,
    subject = null,
    maxQuestions = null,
    dryRun = false
  } = options;
  
  console.log('🤖 Iniciando clasificación de preguntas PAES...\n');
  
  try {
    // Obtener total de preguntas pendientes
    const { count: totalPending } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .or('processing_status.is.null,processing_status.eq.pending');
      
    console.log(`📊 Total de preguntas pendientes: ${totalPending}`);
    
    if (totalPending === 0) {
      console.log('✅ No hay preguntas pendientes de clasificar');
      return;
    }
    
    // Determinar cuántas preguntas procesar
    const questionsToProcess = maxQuestions ? 
      Math.min(maxQuestions, totalPending) : 
      totalPending;
      
    console.log(`🎯 Procesando ${questionsToProcess} preguntas en lotes de ${batchSize}\n`);
    
    let totalProcessed = 0;
    let totalErrors = 0;
    
    // Procesar en batches
    while (totalProcessed < questionsToProcess) {
      const remaining = questionsToProcess - totalProcessed;
      const currentBatchSize = Math.min(batchSize, remaining);
      
      console.log(`\n📦 Procesando lote ${Math.floor(totalProcessed / batchSize) + 1}...`);
      
      // Obtener siguiente batch
      const questions = await getPendingQuestions(currentBatchSize, subject);
      
      if (questions.length === 0) {
        console.log('No hay más preguntas pendientes');
        break;
      }
      
      console.log(`  - Clasificando ${questions.length} preguntas...`);
      
      // Clasificar con Python
      const classifiedQuestions = await runPythonClassifier(questions);
      
      // Mostrar preview de clasificaciones
      if (classifiedQuestions.length > 0) {
        const sample = classifiedQuestions[0];
        console.log(`  - Ejemplo de clasificación:`);
        console.log(`    • Área: ${sample.area_tematica} (${(sample.ai_classification.area_confidence * 100).toFixed(1)}%)`);
        console.log(`    • Tema: ${sample.tema}`);
        console.log(`    • Habilidad: ${sample.habilidad}`);
      }
      
      // Actualizar en base de datos (si no es dry run)
      if (!dryRun) {
        const stats = await updateClassifiedQuestions(classifiedQuestions);
        console.log(`  - Actualizadas: ${stats.updated}, Errores: ${stats.errors}`);
        
        totalProcessed += stats.updated;
        totalErrors += stats.errors;
        
        if (stats.errors > 0) {
          console.error('  - Detalles de errores:', stats.errorDetails);
        }
      } else {
        console.log(`  - [DRY RUN] Se clasificaron ${classifiedQuestions.length} preguntas`);
        totalProcessed += classifiedQuestions.length;
      }
      
      // Pausa entre batches para no sobrecargar
      if (totalProcessed < questionsToProcess) {
        console.log('  - Esperando 2 segundos antes del siguiente lote...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CLASIFICACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Preguntas procesadas: ${totalProcessed}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log(`⏱️  Tiempo total: ${new Date().toLocaleTimeString()}`);
    
    if (dryRun) {
      console.log('\n⚠️  MODO DRY RUN - No se guardaron cambios en la base de datos');
    }
    
  } catch (error) {
    console.error('\n❌ Error en clasificación:', error.message);
    process.exit(1);
  }
}

// Script principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    batchSize: 50,
    subject: null,
    maxQuestions: null,
    dryRun: false
  };
  
  // Parsear argumentos
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch':
        options.batchSize = parseInt(args[++i]) || 50;
        break;
      case '--subject':
        options.subject = args[++i];
        break;
      case '--max':
        options.maxQuestions = parseInt(args[++i]);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        console.log(`
Uso: node classifyQuestions.js [opciones]

Opciones:
  --batch <n>      Tamaño del lote (default: 50)
  --subject <code> Filtrar por materia (M1, M2, L, H, CB, CF, CQ)
  --max <n>        Número máximo de preguntas a procesar
  --dry-run        Simular sin guardar cambios
  --help           Mostrar esta ayuda

Ejemplos:
  node classifyQuestions.js --batch 100
  node classifyQuestions.js --subject M2 --max 200
  node classifyQuestions.js --dry-run
        `);
        process.exit(0);
    }
  }
  
  // Ejecutar clasificación
  classifyQuestions(options);
}

export { classifyQuestions, runPythonClassifier };