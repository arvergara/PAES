#!/usr/bin/env python3
"""Test the API directly with the exact query the frontend is using"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def test_view_query():
    """Test the view query"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions_with_visuals"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # Exact query from frontend
    select = "id,subject,content,options,correct_answer,explanation,area_tematica,tema,subtema,difficulty,habilidad,has_visual_content,images,image_details,image_count,table_count,metadata"

    params = {
        "select": select,
        "active": "eq.true",
        "subject": "eq.H",
        "limit": "5"
    }

    print("Test 1: Vista questions_with_visuals")
    print("="*60)
    response = requests.get(endpoint, headers=headers, params=params)

    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"✅ Éxito - {len(data)} preguntas")
        if data:
            q = data[0]
            print(f"\nPrimera pregunta:")
            print(f"  ID: {q['id']}")
            print(f"  Subject: {q['subject']}")
            print(f"  Content: {q['content'][:80]}...")
            print(f"  Options: {len(q.get('options', []))} opciones")
            print(f"  Correct: {q.get('correct_answer')}")
    else:
        print(f"❌ Error")
        print(f"Response: {response.text}")

def test_table_query():
    """Test the table fallback query"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # Exact query from frontend fallback
    select = "id,subject,content,options,correct_answer,explanation,area_tematica,tema,subtema,difficulty,habilidad,has_visual_content,images,metadata"

    params = {
        "select": select,
        "active": "eq.true",
        "subject": "eq.H",
        "limit": "5"
    }

    print("\n\nTest 2: Tabla questions (fallback)")
    print("="*60)
    response = requests.get(endpoint, headers=headers, params=params)

    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"✅ Éxito - {len(data)} preguntas")
        if data:
            q = data[0]
            print(f"\nPrimera pregunta:")
            print(f"  ID: {q['id']}")
            print(f"  Subject: {q['subject']}")
            print(f"  Content: {q['content'][:80]}...")
            print(f"  Options: {len(q.get('options', []))} opciones")
            print(f"  Correct: {q.get('correct_answer')}")
    else:
        print(f"❌ Error")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_view_query()
    test_table_query()
