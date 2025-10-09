#!/usr/bin/env python3
"""Check questions in Supabase database"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def check_questions_by_subject():
    """Check question count by subject"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    subjects = ["H", "M1", "CB", "CF", "CQ"]

    print("\n" + "="*60)
    print("CONTEO DE PREGUNTAS EN SUPABASE")
    print("="*60 + "\n")

    total = 0
    for subject in subjects:
        # Count questions
        params = {
            "subject": f"eq.{subject}",
            "select": "id",
        }
        response = requests.get(endpoint, headers=headers, params=params)

        if response.ok:
            count = len(response.json())
            total += count
            subject_names = {
                "H": "Historia",
                "M1": "Matemática 1",
                "CB": "Biología",
                "CF": "Física",
                "CQ": "Química"
            }
            print(f"{subject_names[subject]:15} ({subject}): {count:4} preguntas")
        else:
            print(f"Error al consultar {subject}: {response.status_code}")
            print(f"  {response.text[:200]}")

    print(f"\n{'='*60}")
    print(f"TOTAL: {total} preguntas")
    print(f"{'='*60}\n")

    # Sample first question from H
    print("\nMuestra de pregunta de Historia:")
    print("="*60)
    params = {
        "subject": "eq.H",
        "select": "id,content,subject,active",
        "limit": "1"
    }
    response = requests.get(endpoint, headers=headers, params=params)
    if response.ok and response.json():
        q = response.json()[0]
        print(f"ID: {q['id']}")
        print(f"Subject: {q['subject']}")
        print(f"Active: {q['active']}")
        print(f"Content: {q['content'][:100]}...")
    else:
        print(f"❌ No se encontraron preguntas de Historia")
        print(f"Response: {response.text[:300]}")

if __name__ == "__main__":
    check_questions_by_subject()
