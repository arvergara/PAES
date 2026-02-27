import re
from collections import defaultdict
import glob

temario = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {"count": 0, "difficulties": []})))

for sql_file in glob.glob("supabase/migrations/*.sql"):
    with open(sql_file, 'r') as f:
        content = f.read()
    
    pattern = r"'([A-Z0-9]+)',\s*'[^']+',\s*'\{[^}]+\}',\s*'[a-e]',\s*'[^']+',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+)"
    
    matches = re.findall(pattern, content)
    for match in matches:
        subject, area, tema, subtema, difficulty = match
        key = f"{tema} > {subtema}"
        temario[subject][area][key]["count"] += 1
        temario[subject][area][key]["difficulties"].append(int(difficulty))

print("=" * 70)
print("TEMARIO PAES - EXTRAIDO DE PREGUNTAS OFICIALES")
print("=" * 70)

for subject in sorted(temario.keys()):
    print(f"\n{'='*60}")
    print(f"  {subject}")
    print(f"{'='*60}")
    
    total_subject = 0
    for area in sorted(temario[subject].keys()):
        print(f"\n  {area}")
        for tema_subtema in sorted(temario[subject][area].keys()):
            data = temario[subject][area][tema_subtema]
            avg_diff = sum(data["difficulties"]) / len(data["difficulties"]) if data["difficulties"] else 0
            print(f"    - {tema_subtema}: {data['count']} preg (dif: {avg_diff:.1f})")
            total_subject += data["count"]
    
    print(f"\n  TOTAL {subject}: {total_subject} preguntas")

print("\n" + "=" * 70)
print("RESUMEN")
print("=" * 70)
for subject in sorted(temario.keys()):
    total = sum(temario[subject][area][ts]["count"] for area in temario[subject] for ts in temario[subject][area])
    print(f"  {subject}: {total} preguntas")
