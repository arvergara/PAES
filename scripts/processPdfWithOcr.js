/**
 * Script para procesar PDFs con OCR e importar a Supabase
 * ======================================================
 * 
 * Integra el procesador Python OCR con la base de datos Supabase
 * Maneja extracción de texto, imágenes y clasificación
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

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return options || null;
  }

  const normalized = {};
  const optionPattern = /^([A-E])\)\s*(.*)$/i;

  options.forEach((item, index) => {
    if (typeof item !== 'string') return;
    const match = item.match(optionPattern);
    if (match) {
      const key = match[1].toLowerCase();
      normalized[key] = match[2].trim();
    } else {
      const fallbackKey = String.fromCharCode(97 + index); // a, b, c...
      normalized[fallbackKey] = item.trim();
    }
  });

  return normalized;
}

/**
 * Ejecuta el procesador Python OCR
 * @param {string} pdfPath - Ruta al archivo PDF
 * @param {string} subject - Código de materia (M1, M2, L, H, CB, CF, CQ)
 * @param {number} skipPages - Páginas iniciales a omitir
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function runOCRProcessor(pdfPath, subject = null, skipPages = 0, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Procesando PDF con OCR: ${path.basename(pdfPath)}`);
    
    const args = [
      path.join(__dirname, 'ocr', 'pdf_processor.py'),
      pdfPath,
      '--output', path.join(__dirname, '..', 'output'),
      '--skip', skipPages.toString()
    ];
    
    if (subject) {
      args.push('--subject', subject);
    }

    const {
      autoClassify = false,
      temario,
      model,
      device
    } = options;

    if (autoClassify) {
      args.push('--auto-classify');
      if (temario) {
        args.push('--temario', temario);
      }
      if (model) {
        args.push('--model', model);
      }
      if (typeof device === 'number' && Number.isFinite(device)) {
        args.push('--device', device.toString());
      }
    }
    
    const pythonProcess = spawn('python', args);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Mostrar progreso en tiempo real
      if (text.includes('Procesando') || text.includes('Extrayendo')) {
        process.stdout.write(text);
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Error en procesamiento OCR:', stderr);
        reject(new Error(`Proceso OCR falló con código ${code}`));
        return;
      }
      
      try {
        // Leer el archivo de resultados
        const pdfName = path.basename(pdfPath, path.extname(pdfPath));
        const resultPath = path.join(__dirname, '..', 'output', pdfName, 'preguntas.json');
        const resultData = await fs.readFile(resultPath, 'utf8');
        const result = JSON.parse(resultData);
        
        console.log(`✅ OCR completado: ${result.total_questions} preguntas, ${result.total_images} imágenes`);
        resolve(result);
      } catch (error) {
        reject(new Error(`Error leyendo resultados: ${error.message}`));
      }
    });
  });
}

/**
 * Sube una imagen a Supabase Storage
 * @param {string} imagePath - Ruta local de la imagen
 * @param {string} questionId - ID de la pregunta asociada
 * @returns {Promise<string>} URL pública de la imagen
 */
async function uploadImage(imagePath, questionId) {
  try {
    const fileName = path.basename(imagePath);
    const fileBuffer = await fs.readFile(imagePath);
    
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(`${questionId}/${fileName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('question-images')
      .getPublicUrl(`${questionId}/${fileName}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Error en uploadImage:', error);
    return null;
  }
}

/**
 * Importa preguntas procesadas a Supabase
 * @param {Object} ocrResult - Resultado del procesamiento OCR
 * @param {boolean} autoClassify - Si clasificar automáticamente las preguntas
 * @returns {Promise<Object>} Estadísticas de importación
 */
async function importToSupabase(ocrResult, autoClassify = true) {
  console.log('\n📤 Importando a Supabase...');
  
  const stats = {
    questionsImported: 0,
    imagesUploaded: 0,
    tablesImported: 0,
    questionsClassified: 0,
    errors: []
  };
  
  // Crear un mapa de imágenes por ID para búsqueda rápida
  const imageMap = {};
  (ocrResult.images || []).forEach(img => {
    imageMap[img.id] = img;
  });
  
  // Si autoClassify está activado, clasificar las preguntas primero
  let questionsToImport = ocrResult.questions;
  
  const alreadyClassified = questionsToImport.some(q => q.ai_classification);

  if (autoClassify && ocrResult.subject && !alreadyClassified) {
    console.log('🤖 Clasificando preguntas con IA...');
    try {
      const { runPythonClassifier } = await import('./classifyQuestions.js');
      
      // Preparar preguntas para clasificación
      const questionsForClassification = ocrResult.questions.map(q => ({
        ...q,
        subject: ocrResult.subject
      }));
      
      // Clasificar
      const classifiedQuestions = await runPythonClassifier(questionsForClassification);
      questionsToImport = classifiedQuestions;
      stats.questionsClassified = classifiedQuestions.length;
      
      console.log(`✅ ${stats.questionsClassified} preguntas clasificadas`);
    } catch (error) {
      console.error('⚠️  Error en clasificación automática:', error.message);
      console.log('Continuando sin clasificación...');
    }
  }
  
  // Procesar cada pregunta
  for (const question of questionsToImport) {
    try {
      // Preparar datos de la pregunta
      const hasTables = Array.isArray(question.tables) && question.tables.length > 0;
      const questionData = {
        subject: ocrResult.subject || question.subject || 'UNKNOWN',
        content: question.content,
        options: normalizeOptions(question.options),
        correct_answer: null, // Se puede agregar manualmente después
        explanation: null,
        difficulty: null,
        area_tematica: question.area_tematica || null,
        tema: question.tema || null,
        subtema: question.subtema || null,
        habilidad: question.habilidad || null,
        has_visual_content: question.has_visual_content || hasTables,
        processing_status: question.ai_classification ? 'classified' : 'completed',
        processed_at: new Date().toISOString(),
        classification_confidence: question.classification_confidence || null,
        ai_classification: question.ai_classification || null,
        metadata: {
          pdf_source: ocrResult.pdf_name,
          page_number: question.page,
          question_number: question.question_number,
          ocr_processed: true,
          auto_classified: Boolean(question.ai_classification),
          skip_pages: ocrResult.metadata?.skip_pages ?? 0
        }
      };
      
      // Agregar datos de clasificación si existen
      if (question.ai_classification) {
        questionData.ai_classification = question.ai_classification;
        questionData.area_tematica = question.area_tematica;
        questionData.tema = question.tema;
        questionData.habilidad = question.habilidad;
        questionData.classification_confidence = question.classification_confidence;
      }
      
      // Insertar pregunta
      const { data: insertedQuestion, error: questionError } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single();
      
      if (questionError) {
        console.error(`Error insertando pregunta ${question.question_number}:`, questionError);
        stats.errors.push({ question: question.question_number, error: questionError.message });
        continue;
      }
      
      stats.questionsImported++;
      
      // Procesar imágenes asociadas
      if (question.images && question.images.length > 0) {
        const uploadedImages = [];
        const imagePromises = question.images.map(async (imageId) => {
          const imageInfo = imageMap[imageId];
          if (!imageInfo) return;
          
          // Subir imagen a storage
          const imageUrl = await uploadImage(imageInfo.path, insertedQuestion.id);
          
          if (imageUrl) {
            // Guardar referencia en base de datos
            const { error: imgError } = await supabase
              .from('question_images')
              .insert({
                question_id: insertedQuestion.id,
                image_url: imageUrl,
                image_path: imageInfo.path,
                image_type: imageInfo.type,
                coordinates: imageInfo.coordinates,
                page_number: imageInfo.page,
                width: imageInfo.size.width,
                height: imageInfo.size.height
              });
            
            if (!imgError) {
              stats.imagesUploaded++;
              uploadedImages.push({
                id: imageInfo.id,
                url: imageUrl,
                type: imageInfo.type,
                page_number: imageInfo.page,
                coordinates: imageInfo.coordinates,
                width: imageInfo.size?.width,
                height: imageInfo.size?.height
              });
            } else {
              console.error('Error guardando referencia de imagen:', imgError);
            }
          }
        });
        
        await Promise.all(imagePromises);
        
        // Actualizar campo images en la pregunta
        if (uploadedImages.length > 0) {
          await supabase
            .from('questions')
            .update({ 
              images: uploadedImages,
              has_visual_content: true
            })
            .eq('id', insertedQuestion.id);
        }
      }
      
      // Procesar tablas asociadas (si las hay)
      if (question.tables && question.tables.length > 0) {
        const tablePayload = question.tables.map((table) => ({
          question_id: insertedQuestion.id,
          table_content: table.content,
          page_number: table.page,
          rows: table.rows,
          cols: table.cols
        }));

        const { error: tableError } = await supabase
          .from('question_tables')
          .insert(tablePayload);

        if (tableError) {
          console.error('Error guardando tablas:', tableError);
        } else {
          stats.tablesImported += tablePayload.length;
          await supabase
            .from('questions')
            .update({ has_visual_content: true })
            .eq('id', insertedQuestion.id);
        }
      }
      
    } catch (error) {
      console.error(`Error procesando pregunta ${question.question_number}:`, error);
      stats.errors.push({ question: question.question_number, error: error.message });
    }
  }
  
  return stats;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Uso: node processPdfWithOcr.js <archivo.pdf> [opciones]

Opciones:
  --subject <código>    Código de materia (M1, M2, L, H, CB, CF, CQ)
  --skip <número>       Páginas iniciales a omitir (default: 0)
  --auto-classify       Ejecutar clasificación Zero-Shot en el mismo proceso
  --temario <ruta>      Ruta al CSV del temario (para --auto-classify)
  --model <nombre>      Modelo HuggingFace para clasificación
  --device <id>         Dispositivo Transformers (-1=CPU)
  --no-import           Solo procesar, no importar a Supabase

Ejemplo:
  node processPdfWithOcr.js "../pruebas/M2-2024-1.pdf" --subject M2 --skip 2 --auto-classify
    `);
    process.exit(0);
  }
  
  const pdfPath = args[0];
  const subjectIndex = args.indexOf('--subject');
  const skipIndex = args.indexOf('--skip');
  const autoClassify = args.includes('--auto-classify');
  const noImport = args.includes('--no-import');
  const temarioIndex = args.indexOf('--temario');
  const modelIndex = args.indexOf('--model');
  const deviceIndex = args.indexOf('--device');
  
  const subject = subjectIndex !== -1 ? args[subjectIndex + 1] : null;
  const skipPages = skipIndex !== -1 ? parseInt(args[skipIndex + 1]) : 0;
  const temarioPath = temarioIndex !== -1 ? args[temarioIndex + 1] : null;
  const modelName = modelIndex !== -1 ? args[modelIndex + 1] : null;
  const deviceId = deviceIndex !== -1 ? parseInt(args[deviceIndex + 1], 10) : null;
  
  try {
    // Verificar que el archivo existe
    await fs.access(pdfPath);
    
    // Ejecutar OCR
    const ocrResult = await runOCRProcessor(pdfPath, subject, skipPages, {
      autoClassify,
      temario: temarioPath,
      model: modelName,
      device: deviceId
    });
    
    // Importar a Supabase si no se especifica --no-import
    if (!noImport) {
      const importStats = await importToSupabase(ocrResult, autoClassify);
      
      console.log('\n📊 Resumen de importación:');
      console.log(`✅ Preguntas importadas: ${importStats.questionsImported}`);
      console.log(`🤖 Preguntas clasificadas: ${importStats.questionsClassified}`);
      console.log(`🖼️  Imágenes subidas: ${importStats.imagesUploaded}`);
      console.log(`📋 Tablas importadas: ${importStats.tablesImported}`);
      
      if (importStats.errors.length > 0) {
        console.log(`\n⚠️  Errores encontrados: ${importStats.errors.length}`);
        importStats.errors.forEach(err => {
          console.log(`  - Pregunta ${err.question}: ${err.error}`);
        });
      }
    } else {
      console.log('\n✅ Procesamiento completado (sin importar a Supabase)');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Exportar funciones para uso en otros scripts
export {
  runOCRProcessor,
  uploadImage,
  importToSupabase,
  normalizeOptions
};
