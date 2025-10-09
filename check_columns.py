#!/usr/bin/env python3
"""Check actual columns in questions table"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def check_columns():
    """Get one question to see all columns"""
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/questions"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    params = {
        "limit": "1"
    }
    response = requests.get(endpoint, headers=headers, params=params)

    if response.ok and response.json():
        q = response.json()[0]
        print("\nColumnas existentes en la tabla 'questions':")
        print("="*60)
        for key in sorted(q.keys()):
            value = q[key]
            value_type = type(value).__name__
            print(f"  {key:30} ({value_type})")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_columns()
