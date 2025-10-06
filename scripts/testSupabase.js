import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Probando conexión a Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key type: ${process.env.SUPABASE_SERVICE_KEY ? 'service_role' : 'anon'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Probar con una consulta simple
    const { data, error, count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Conexión exitosa!');
      console.log(`📊 Total de preguntas en la BD: ${count || 0}`);
    }
    
    // Verificar si existe la columna has_visual_content
    const { data: cols, error: colError } = await supabase
      .from('questions')
      .select('has_visual_content')
      .limit(1);
      
    if (colError && colError.message.includes('column')) {
      console.log('⚠️  La columna has_visual_content no existe. Ejecuta las migraciones.');
    } else {
      console.log('✅ Columna has_visual_content existe');
    }
    
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}

testConnection();