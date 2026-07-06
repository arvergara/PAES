#!/usr/bin/env python3
"""Carga idempotente del banco reprocesado de Ciencias a Supabase.

- Sube las imágenes recortadas a Storage (bucket questions-images).
- Inserta las 1.608 preguntas con lote='ciencias_oficial_2026'.
- NO desactiva el banco viejo (eso es un paso aparte y confirmado).

Requiere en el entorno:
  SUPABASE_URL            (default: proyecto de producción)
  SUPABASE_SERVICE_KEY    (service_role; NO se imprime nunca)

Uso:
  set -a && source .env.rebuild && set +a
  .venv-rebuild/bin/python scripts/load_ciencias_rebuild.py
"""
import json, os, sys, base64, mimetypes
import urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = os.getenv("SUPABASE_URL", "https://bmsmmlymsjpydpealmcw.supabase.co").rstrip("/")
KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET = "questions-images"
LOTE = "ciencias_oficial_2026"
CONS = os.path.join(ROOT, "scripts/output/rebuild/consolidado_ciencias.json")

if not KEY:
    print("FALTA SUPABASE_SERVICE_KEY en el entorno.", file=sys.stderr)
    sys.exit(1)


def req(method, path, data=None, extra_headers=None, raw=False):
    url = f"{URL}{path}"
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if extra_headers:
        headers.update(extra_headers)
    body = data if raw else (json.dumps(data).encode() if data is not None else None)
    if not raw and data is not None:
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def upload_image(local_path, storage_path):
    with open(local_path, "rb") as fh:
        blob = fh.read()
    ctype = mimetypes.guess_type(local_path)[0] or "image/png"
    status, resp = req("POST", f"/storage/v1/object/{BUCKET}/{storage_path}",
                       data=blob, raw=True,
                       extra_headers={"Content-Type": ctype, "x-upsert": "true"})
    return status, resp


def main():
    rows = json.load(open(CONS))
    con_img = [r for r in rows if r.get("_local_img")]
    print(f"Filas: {len(rows)} | imágenes a subir: {len(con_img)}")

    # 1) Subir imágenes (saltable si ya se subieron)
    up_ok = up_fail = 0
    if os.getenv("SKIP_UPLOAD") == "1":
        print("SKIP_UPLOAD=1 -> se omite la subida de imágenes")
        con_img = []
    for r in con_img:
        lp = os.path.join(ROOT, r["_local_img"])
        if not os.path.exists(lp):
            up_fail += 1; continue
        st, resp = upload_image(lp, r["image_url"])
        if st in (200, 201):
            up_ok += 1
        else:
            up_fail += 1
            if up_fail <= 5:
                print(f"  upload FALLO {r['image_url']}: {st} {resp[:120]}")
    print(f"Imágenes: {up_ok} subidas, {up_fail} fallidas")

    # 2) Borrar batch previo (idempotencia)
    st, resp = req("DELETE", f"/rest/v1/questions?lote=eq.{LOTE}",
                   extra_headers={"Prefer": "return=minimal"})
    print(f"DELETE lote previo -> HTTP {st}")

    # 3) Insertar en lotes
    def payload(r):
        p = {
            "subject": r["subject"],
            "content": r["content"],
            "options": r["options"],
            "correct_answer": r["correct_answer"],
            "active": r["active"],
            "origen": r["origen"],
            "lote": LOTE,
            "source": "official",
            "origen_tipo": "oficial",
            "is_generated": False,
            "has_visual_content": bool(r.get("image_url")),
            "metadata": {"es_piloto": r.get("es_piloto", False), "src": r.get("_src")},
            "image_url": r.get("image_url"),   # siempre presente (null si no hay) -> claves uniformes
        }
        return p

    ins_ok = 0
    B = 200
    for i in range(0, len(rows), B):
        chunk = [payload(r) for r in rows[i:i + B]]
        st, resp = req("POST", "/rest/v1/questions", data=chunk,
                       extra_headers={"Prefer": "return=minimal"})
        if st in (200, 201):
            ins_ok += len(chunk)
        else:
            print(f"  INSERT lote {i}-{i+len(chunk)} FALLO: {st} {resp[:200]}")
            break
    print(f"Insertadas: {ins_ok}/{len(rows)}")
    print("\nListo. El banco viejo NO se tocó (paso de desactivación es aparte).")


if __name__ == "__main__":
    main()
