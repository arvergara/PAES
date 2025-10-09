#!/usr/bin/env python3
"""Check database structure"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def test_view():
    """Test if questions_with_visuals view exists"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions_with_visuals"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    print("\nTest 1: Consultar vista questions_with_visuals")
    print("="*60)

    params = {
        "subject": "eq.H",
        "active": "eq.true",
        "limit": "1"
    }
    response = requests.get(endpoint, headers=headers, params=params)

    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"✅ Vista existe - {len(data)} registros")
        if data:
            print(f"Sample: {data[0].get('id', 'N/A')}")
    else:
        print(f"❌ Vista no existe o error")
        print(f"Error: {response.text[:300]}")

def test_table():
    """Test if questions table works"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    print("\n\nTest 2: Consultar tabla questions (Historia)")
    print("="*60)

    params = {
        "subject": "eq.H",
        "active": "eq.true",
        "select": "id,subject,content,active",
        "limit": "3"
    }
    response = requests.get(endpoint, headers=headers, params=params)

    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"✅ Encontradas {len(data)} preguntas")
        for i, q in enumerate(data, 1):
            print(f"\nPregunta {i}:")
            print(f"  ID: {q['id']}")
            print(f"  Subject: {q['subject']}")
            print(f"  Active: {q['active']}")
            print(f"  Content: {q['content'][:80]}...")
    else:
        print(f"❌ Error")
        print(f"Error: {response.text[:300]}")

if __name__ == "__main__":
    test_view()
    test_table()
