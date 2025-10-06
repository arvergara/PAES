#!/usr/bin/env python3
"""
Script para migrar preguntas generadas a Supabase.
Carga un archivo JSON generado y lo inserta en la tabla questions de Supabase.
"""

import os
import json
import argparse
import asyncio
import logging
from typing import List, Dict, Any
from supabase import create_client, Client

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("MigradorSupabase")

class SupabaseMigrator:
    def __init__(self, url: str, key: str):
        """
        Inicializa el migrador con las credenciales de Supabase.
        
        Args:
            url: URL de Supabase
            key: Key de Supabase (service_role key para permisos completos)
        """
        self.supabase = create_client(url, key)
        logger.info("Cliente Supabase inicializado")
        
    async def check_connection(self) -> bool:
        """Verifica la conexión con Supabase."""
        try:
            # Intenta obtener la versión de PostgreSQL
            response = self.supabase.table("questions").select("count(*)", count="exact").execute()
            logger.info(f"Conexión exitosa con Supabase. Registros en 'questions': {response.count}")
            return True
        except Exception as e:
            logger.error(f"Error conectando con Supabase: {e}")
            return False
    
    async def migrate_questions(self, questions: List[Dict[str, Any]], batch_size: int = 50) -> int:
        """
        Migra las preguntas a Supabase en lotes.
        
        Args:
            questions: Lista de preguntas a migrar
            batch_size: Tamaño de cada lote de inserción
            
        Returns:
            Número de preguntas migradas correctamente
        """
        total_questions = len(questions)
        migrated = 0
        
        logger.info(f"Iniciando migración de {total_questions} preguntas a Supabase")
        
        # Procesar en lotes para evitar límites de tamaño en las solicitudes
        for i in range(0, total_questions, batch_size):
            batch = questions[i:i+batch_size]
            batch_num = i // batch_size + 1
            
            logger.info(f"Procesando lote {batch_num}/{(total_questions-1)//batch_size+1} ({len(batch)} preguntas)")
            
            try:
                # Insertar lote en Supabase
                result = self.supabase.table("questions").insert(batch).execute()
                
                if hasattr(result, 'data') and result.data:
                    batch_success = len(result.data)
                    migrated += batch_success
                    logger.info(f"Lote {batch_num}: {batch_success}/{len(batch)} preguntas migradas exitosamente")
                else:
                    logger.warning(f"Lote {batch_num}: Respuesta inesperada de Supabase")
                
            except Exception as e:
                logger.error(f"Error migrando lote {batch_num}: {e}")
                
            # Pequeña pausa para evitar límites de rate
            await asyncio.sleep(1)
        
        logger.info(f"Migración completada: {migrated}/{total_questions} preguntas migradas exitosamente")
        return migrated

async def main():
    parser = argparse.ArgumentParser(description="Migrador de preguntas a Supabase")
    parser.add_argument("--input", type=str, default="questions_generated.json",
                      help="Archivo JSON con las preguntas a migrar")
    parser.add_argument("--batch-size", type=int, default=50,
                      help="Número de preguntas a insertar en cada lote")
    
    args = parser.parse_args()
    
    # Obtener credenciales de variables de entorno
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Faltan variables de entorno requeridas: SUPABASE_URL y SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY)")
        logger.info("Configura estas variables en el entorno o en un archivo .env")
        return
    
    # Cargar preguntas desde el archivo JSON
    try:
        with open(args.input, "r", encoding="utf-8") as f:
            questions = json.load(f)
            
        if not isinstance(questions, list):
            logger.error(f"Formato inválido en {args.input}. Se esperaba una lista de preguntas.")
            return
            
        logger.info(f"Cargadas {len(questions)} preguntas desde {args.input}")
        
    except Exception as e:
        logger.error(f"Error cargando archivo {args.input}: {e}")
        return
    
    # Inicializar migrador y verificar conexión
    migrator = SupabaseMigrator(supabase_url, supabase_key)
    
    if not await migrator.check_connection():
        logger.error("No se pudo establecer conexión con Supabase. Migración abortada.")
        return
    
    # Migrar preguntas
    migrated = await migrator.migrate_questions(questions, args.batch_size)
    
    if migrated > 0:
        logger.info(f"Migración exitosa: {migrated} preguntas migradas a Supabase")
    else:
        logger.error("No se migró ninguna pregunta")

if __name__ == "__main__":
    asyncio.run(main()) 