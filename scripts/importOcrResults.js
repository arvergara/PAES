#!/usr/bin/env node
/**
 * Importador de resultados OCR ya procesados
 * ==========================================
 *
 * Permite tomar los JSON generados en `output/<pdf>/preguntas.json`
 * y cargarlos en Supabase reutilizando la lógica de importación existente.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { importToSupabase } from './processPdfWithOcr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fileExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch (error) {
    return false;
  }
}

async function resolveInputPaths(inputPath) {
  const stats = await fs.stat(inputPath);
  if (stats.isFile()) {
    return [inputPath];
  }
  if (stats.isDirectory()) {
    const files = await fs.readdir(inputPath);
    const candidates = [];
    for (const file of files) {
      const entryPath = path.join(inputPath, file);
      const entryStats = await fs.stat(entryPath);
      if (entryStats.isDirectory()) {
        const nested = path.join(entryPath, 'preguntas.json');
        if (await fileExists(nested)) {
          candidates.push(nested);
        }
      } else if (entryStats.isFile() && file.endsWith('.json')) {
        candidates.push(entryPath);
      }
    }
    return candidates;
  }
  throw new Error(`Ruta no válida: ${inputPath}`);
}

async function importFile(jsonPath, autoClassify) {
  console.log(`\n📄 Importando ${jsonPath}`);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const payload = JSON.parse(raw);
  const stats = await importToSupabase(payload, autoClassify);

  console.log(`✅ Preguntas importadas: ${stats.questionsImported}`);
  console.log(`🖼️  Imágenes subidas: ${stats.imagesUploaded}`);
  console.log(`📋 Tablas importadas: ${stats.tablesImported}`);
  console.log(`🤖 Preguntas clasificadas: ${stats.questionsClassified}`);

  if (stats.errors.length > 0) {
    console.log('⚠️  Errores:');
    stats.errors.forEach((err) => {
      console.log(`  - Pregunta ${err.question}: ${err.error}`);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Uso: node importOcrResults.js <ruta> [--auto-classify]

Argumentos:
  <ruta>            Archivo preguntas.json o carpeta con subcarpetas de output
  --auto-classify    Vuelve a clasificar si el JSON no contiene etiquetas

Ejemplos:
  node importOcrResults.js output/M2_examples/preguntas.json
  node importOcrResults.js output --auto-classify
    `);
    process.exit(0);
  }

  const inputArg = path.resolve(args[0]);
  const autoClassify = args.includes('--auto-classify');

  try {
    const candidates = await resolveInputPaths(inputArg);
    if (candidates.length === 0) {
      console.log('No se encontraron archivos preguntas.json en la ruta proporcionada.');
      process.exit(1);
    }

    for (const candidate of candidates) {
      await importFile(candidate, autoClassify);
    }

    console.log('\n🎉 Importación completada');
  } catch (error) {
    console.error('❌ Error importando resultados:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importFile };
