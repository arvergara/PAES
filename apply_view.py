#!/usr/bin/env python3
"""Apply the questions_with_visuals view to Supabase"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def apply_view():
    """Apply SQL view"""
    # Read SQL file
    with open("create_questions_view.sql", "r") as f:
        sql = f.read()

    # Use PostgREST to execute SQL
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/rpc"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }

    # Try to execute as raw SQL via Supabase management API
    # Note: This requires direct database access
    print("Aplicando vista questions_with_visuals...")
    print("="*60)
    print("\nOPCIÓN 1: Ejecuta este SQL en el SQL Editor de Supabase:")
    print("https://supabase.com/dashboard/project/gmqtbdgkmmlorxeadbih/sql/new\n")
    print(sql)
    print("\n" + "="*60)
    print("\nOPCIÓN 2: Usar psql (si tienes acceso directo):")
    print(f"psql postgresql://postgres:[password]@db.gmqtbdgkmmlorxeadbih.supabase.co:5432/postgres < create_questions_view.sql")

if __name__ == "__main__":
    apply_view()
