import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const testQuestions = [
  {
    subject: 'M2',
    content: '¿Cuál es la derivada de f(x) = x² + 3x - 5?',
    options: {
      a: '2x + 3',
      b: 'x² + 3',
      c: '2x - 5',
      d: 'x + 3'
    },
    correct_answer: 'a',
    explanation: 'La derivada de x² es 2x, la derivada de 3x es 3, y la derivada de -5 es 0.',
    area_tematica: 'Cálculo',
    tema: 'Derivadas',
    difficulty: 2
  },
  {
    subject: 'CB',
    content: '¿Cuál es la función principal del sistema nervioso?',
    options: {
      a: 'Transportar nutrientes',
      b: 'Coordinar las funciones del organismo',
      c: 'Producir hormonas',
      d: 'Digerir alimentos'
    },
    correct_answer: 'b',
    explanation: 'El sistema nervioso coordina y regula las funciones del organismo.',
    area_tematica: 'Procesos y funciones biológicas',
    tema: 'Sistema nervioso',
    difficulty: 1
  }
];

async function insertTestQuestions() {
  console.log('Insertando preguntas de prueba...');
  
  const { data, error } = await supabase
    .from('questions')
    .insert(testQuestions)
    .select();
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Preguntas insertadas:', data.length);
    console.log('IDs:', data.map(q => q.id));
  }
}

insertTestQuestions();