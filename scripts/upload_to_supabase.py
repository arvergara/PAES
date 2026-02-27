#!/usr/bin/env python3
"""
Script para subir preguntas generadas a Supabase
Uso: python3 upload_to_supabase.py
"""

import json
import os
import re
from typing import List, Dict

# ============================================================
# CONFIGURACIÓN - EDITAR ESTAS LÍNEAS
# ============================================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://TU_PROJECT_ID.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "TU_API_KEY_AQUI")
# ============================================================

try:
    from supabase import create_client, Client
except ImportError:
    print("Instalando supabase-py...")
    os.system("pip install supabase --break-system-packages")
    from supabase import create_client, Client

def parse_sql_inserts(sql_content: str) -> List[Dict]:
    """Parsea los INSERT statements del SQL y extrae los datos."""
    questions = []
    
    # Regex para extraer cada INSERT
    # Busca el patrón VALUES seguido de los valores
    pattern = r"\('(M[12]|L|H|C[BFQ])',\s*'([^']*(?:''[^']*)*)',\s*'(\{[^}]+\})',\s*'([a-e])',\s*'([^']*(?:''[^']*)*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(true|false),\s*(true|false),\s*'([^']*)'\)"
    
    matches = re.findall(pattern, sql_content, re.MULTILINE | re.DOTALL)
    
    for match in matches:
        subject, content, options_str, correct_answer, explanation, area, tema, subtema, difficulty, active, is_generated, source = match
        
        # Limpiar comillas escapadas
        content = content.replace("''", "'")
        explanation = explanation.replace("''", "'")
        
        # Parsear options JSON
        try:
            options = json.loads(options_str)
        except:
            print(f"Error parseando options: {options_str}")
            continue
        
        question = {
            "subject": subject,
            "content": content,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "area_tematica": area,
            "tema": tema,
            "subtema": subtema,
            "difficulty": int(difficulty),
            "active": active == "true",
            "is_generated": is_generated == "true",
            "source": source
        }
        questions.append(question)
    
    return questions


def upload_questions(supabase: Client, questions: List[Dict]) -> int:
    """Sube las preguntas a Supabase."""
    if not questions:
        print("No hay preguntas para subir")
        return 0
    
    try:
        # Insertar en batches de 50
        batch_size = 50
        total_inserted = 0
        
        for i in range(0, len(questions), batch_size):
            batch = questions[i:i+batch_size]
            result = supabase.table("questions").insert(batch).execute()
            total_inserted += len(batch)
            print(f"  Insertadas {total_inserted}/{len(questions)} preguntas...")
        
        return total_inserted
    except Exception as e:
        print(f"Error insertando: {e}")
        return 0


def main():
    # Verificar credenciales
    if "TU_PROJECT_ID" in SUPABASE_URL or "TU_API_KEY" in SUPABASE_KEY:
        print("=" * 60)
        print("ERROR: Configura las credenciales de Supabase")
        print("=" * 60)
        print("\nOpción 1 - Variables de entorno:")
        print("  export SUPABASE_URL='https://xxxxx.supabase.co'")
        print("  export SUPABASE_KEY='tu-api-key'")
        print("\nOpción 2 - Editar este archivo directamente")
        print("=" * 60)
        return
    
    # Conectar a Supabase
    print(f"Conectando a Supabase: {SUPABASE_URL[:40]}...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Buscar archivos SQL
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_files = sorted([f for f in os.listdir(script_dir) if f.startswith("generated_") and f.endswith(".sql")])
    
    if not sql_files:
        print("No se encontraron archivos SQL generados")
        return
    
    print(f"\nArchivos encontrados: {len(sql_files)}")
    
    total_questions = 0
    total_uploaded = 0
    
    for sql_file in sql_files:
        filepath = os.path.join(script_dir, sql_file)
        print(f"\n📄 Procesando: {sql_file}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        questions = parse_sql_inserts(sql_content)
        total_questions += len(questions)
        print(f"   Preguntas parseadas: {len(questions)}")
        
        if questions:
            uploaded = upload_questions(supabase, questions)
            total_uploaded += uploaded
    
    print("\n" + "=" * 60)
    print(f"✅ RESUMEN")
    print(f"   Archivos procesados: {len(sql_files)}")
    print(f"   Preguntas parseadas: {total_questions}")
    print(f"   Preguntas subidas:   {total_uploaded}")
    print("=" * 60)


if __name__ == "__main__":
    main()
