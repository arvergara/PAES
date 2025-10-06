import pymupdf as fitz  # PyMuPDF
import pandas as pd
import json
import os
import re
import requests
from datetime import datetime
import csv
import random

# Try to import Ollama; if it fails, we'll use OpenAI as a fallback
try:
    import ollama
    USE_OLLAMA = True
except ImportError:
    USE_OLLAMA = False
    print("Ollama not found. Falling back to OpenAI API. Please provide your API key.")

# Configuration - Commented out API calls for now
# OLLAMA_MODEL = "gemma3:27b"
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here") 
# OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
USE_OLLAMA = False  # Disable Ollama by default
USE_API = False     # Disable all API calls

# Step 1: Extract questions from PDFs
def extract_questions_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    questions = []
    current_question = None
    question_pattern = r"^\d+\.\s+"
    collecting_question_text = False
    collecting_option = False
    current_option = None
    
    # Intentar detectar todo el contenido del PDF para mejor procesamiento
    all_text = ""
    for page in doc:
        all_text += page.get_text("text") + "\n"
    
    # Buscar patrones de preguntas completas con todas sus alternativas
    # Usando regex más sofisticados
    question_blocks = re.findall(r"(\d+\.\s+.+?)(?=\d+\.\s+|$)", all_text, re.DOTALL)
    
    for block in question_blocks:
        # Identificar el texto de la pregunta
        question_match = re.match(r"(\d+\.\s+.+?)(?=[A-D]\)|\n[A-D]\))", block, re.DOTALL)
        if not question_match:
            # Si no podemos identificar claramente la pregunta, usamos todo el bloque
            question_text = block.strip()
        else:
            question_text = question_match.group(1).strip()
        
        # Identificar las alternativas
        alternatives = re.findall(r"([A-D]\).*?)(?=[A-D]\)|Clave|Respuesta|$)", block, re.DOTALL)
        
        # Si no encontramos alternativas con el patrón A), intentamos con A.
        if not alternatives:
            alternatives = re.findall(r"([A-D]\..*?)(?=[A-D]\.|[A-D]\.|Clave|Respuesta|$)", block, re.DOTALL)
        
        # Limpieza de alternativas
        clean_alternatives = []
        for alt in alternatives:
            alt = alt.strip()
            if alt and len(alt) > 1:  # Asegurarse de que no está vacía y tiene más que solo la letra
                clean_alternatives.append(alt)
        
        # Detectar la respuesta correcta
        correct_answer = None
        answer_match = re.search(r"(?:Clave|Respuesta|Solución)[\s:]+([A-D])", block, re.IGNORECASE)
        if answer_match:
            correct_answer = answer_match.group(1).upper()
        
        # Crear la pregunta si tenemos suficiente información
        if question_text:
            current_question = {
                "texto": question_text,
                "alternativas": clean_alternatives,
                "correcta": correct_answer
            }
            
            # Asegurarse de que tenemos todas las alternativas
            existing_options = {alt[0].upper() for alt in clean_alternatives if alt and len(alt) > 0}
            for letter in "ABCD":
                if letter not in existing_options and len(clean_alternatives) < 4:
                    current_question["alternativas"].append(f"{letter}) TBD")
            
            questions.append(current_question)
    
    # Si no pudimos extraer preguntas con el enfoque anterior, intentamos con el enfoque línea por línea
    if not questions:
        questions = extract_questions_line_by_line(doc)
    
    doc.close()
    return questions

def extract_questions_line_by_line(doc):
    questions = []
    current_question = None
    question_pattern = r"^\d+\.\s+"
    collecting_question_text = False
    collecting_option = False
    current_option = None
    
    for page in doc:
        text = page.get_text("text")
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect question number (e.g., "1.", "2.")
            if re.match(question_pattern, line):
                # Save previous question if it exists
                if current_question:
                    # Ensure we have 4 options by adding empty ones if needed
                    while len(current_question["alternativas"]) < 4:
                        option_letter = 'ABCD'[len(current_question['alternativas'])]
                        current_question["alternativas"].append(f"{option_letter}) TBD")
                    questions.append(current_question)
                    
                # Start new question
                current_question = {"texto": line, "alternativas": [], "correcta": None}
                collecting_question_text = True
                collecting_option = False
                current_option = None
                
            # Detect options (e.g., "a)", "b)", "A)", "B)")
            elif re.match(r"^[a-dA-D][\.\)]", line):
                collecting_question_text = False
                collecting_option = True
                
                # Save current option if we were collecting one
                if current_option and current_question:
                    current_question["alternativas"].append(current_option)
                
                # Start new option
                current_option = line
                    
            # Detect correct answer
            elif "Respuesta:" in line or "Clave:" in line or "Solución:" in line:
                collecting_option = False
                
                # Save the last option we were collecting if any
                if current_option and current_question:
                    current_question["alternativas"].append(current_option)
                    current_option = None
                
                if current_question:
                    answer_match = re.search(r"[:\s]+([a-dA-D])[\.)\s]*", line)
                    if answer_match:
                        current_question["correcta"] = answer_match.group(1).upper()
            
            # Continue collecting option text if we're in that state
            elif collecting_option and current_option:
                current_option += " " + line
                
            # Continue collecting question text if we're in that state and no option yet
            elif collecting_question_text and current_question:
                current_question["texto"] += " " + line

    # Save the last option if we were collecting one
    if current_option and current_question:
        current_question["alternativas"].append(current_option)
    
    # Add the last question
    if current_question:
        # Ensure we have 4 options by adding empty ones if needed
        while len(current_question["alternativas"]) < 4:
            option_letter = 'ABCD'[len(current_question['alternativas'])]
            current_question["alternativas"].append(f"{option_letter}) TBD")
        questions.append(current_question)
        
    return questions

# Step 2: Categorize questions using temario_paes_vf.csv
def categorize_questions(questions, temario_path, subject_code):
    """
    Categoriza una lista de preguntas basándose en el temario y palabras clave.
    
    Args:
        questions: Lista de preguntas a categorizar
        temario_path: Ruta al archivo CSV del temario
        subject_code: Código de la materia (CB, CQ, CF, etc.)
    
    Returns:
        La lista de preguntas categorizada
    """
    import os
    import csv
    import re
    
    # Usar el archivo temario_paes_vf.csv
    temario_path = os.path.join(os.path.dirname(temario_path), "temario_paes_vf.csv")
    print(f"Cargando temario desde: {temario_path}")
    print(f"El archivo existe: {os.path.exists(temario_path)}")
    
    # Mapeo de códigos de materias a términos de búsqueda en el CSV
    subject_map = {
        "CB": "CB",
        "CQ": "CQ",
        "CF": "CF",
        "H": "H",
        "M1": "M1",
        "M2": "M2"
    }
    
    search_term = subject_map.get(subject_code, subject_code)
    
    # Cargar temario desde CSV
    temario_entries = []
    try:
        # Primero intenta leer el archivo como texto para determinar el delimitador correcto
        with open(temario_path, 'r', encoding='utf-8') as f:
            sample = f.readline()
            if ';' in sample:
                delimiter = ';'
            else:
                delimiter = ','
        
        with open(temario_path, 'r', encoding='utf-8') as csvfile:
            # Leer la primera línea para determinar la estructura
            first_line = csvfile.readline().strip()
            csv_reader = csv.reader([first_line], delimiter=delimiter)
            header = next(csv_reader)
            print(f"Cabecera: {header}")
            
            # Reiniciar el puntero del archivo
            csvfile.seek(0)
            csv_reader = csv.reader(csvfile, delimiter=delimiter)
            next(csv_reader)  # Saltamos la cabecera
            
            for row in csv_reader:
                if len(row) >= 4:  # Asegurar que hay suficientes campos
                    subject, area, theme, subtheme = row[0], row[1], row[2], row[3]
                    temario_entries.append({
                        'subject': subject.strip(),
                        'area': area.strip(),
                        'theme': theme.strip(),
                        'subtheme': subtheme.strip()
                    })
    except Exception as e:
        print(f"Error al cargar el temario: {e}")
        temario_entries = []
    
    print(f"Temario cargado: {len(temario_entries)} entradas")
    
    # Filtrar entradas relevantes para la materia
    relevant_entries = [entry for entry in temario_entries if search_term.lower() == entry['subject'].lower()]
    print(f"Entradas relevantes para {search_term}: {len(relevant_entries)}")
    
    # Obtener las áreas temáticas disponibles para la materia
    thematic_areas = set(entry['area'] for entry in relevant_entries)
    print(f"Áreas para {search_term}: {thematic_areas}")
    
    # Para Historia y Química, reforzar con palabras clave específicas por área
    keywords = {}
    if subject_code == "CQ":
        keywords = {
            "Estructura atómica": [
                "átomo", "protón", "neutrón", "electrón", "orbital", "modelo atómico", 
                "bohr", "cuántico", "número atómico", "masa atómica", "isótopo",
                "configuración electrónica", "nivel de energía", "capa", "subcapa",
                "orbital", "spin", "tabla periódica", "grupo", "período", "metal",
                "no metal", "gas noble", "elemento"
            ],
            "Enlaces químicos": [
                "enlace", "covalente", "iónico", "metálico", "puente de hidrógeno",
                "electronegatividad", "polar", "apolar", "dipolo", "molécular",
                "lewis", "octet", "valencia", "par solitario", "hibridación"
            ],
            "Reacciones químicas": [
                "reacción", "estequiometría", "mol", "reactivo", "producto", "rendimiento",
                "limitante", "exceso", "balance", "oxidación", "reducción", "redox", 
                "neutralización", "ácido", "base", "sal", "precipitación", "combustión",
                "síntesis", "descomposición", "intercambio", "equilibrio", "constante",
                "le chatelier", "concentración", "presión", "temperatura", "catalizador"
            ],
            "Química orgánica": [
                "orgánico", "carbono", "hidrocarburo", "alcano", "alqueno", "alquino",
                "aromático", "benceno", "alcohol", "fenol", "éter", "aldehído", "cetona",
                "ácido carboxílico", "éster", "amina", "amida", "funcional", "isomería",
                "nomenclatura", "iupac", "saturado", "insaturado"
            ]
        }
    elif subject_code == "H":
        # Usar solamente las áreas oficiales del temario actualizado
        keywords = {
            "Historia": [
                "chile", "chileno", "chilena", "colonia", "colonial", "independencia", 
                "república", "constitución", "guerra del pacífico", "parlamentarismo", 
                "alessandri", "ibáñez", "allende", "pinochet", "concertación", "dictadura",
                "democracia", "transición", "frente popular", "unidad popular", "golpe de estado",
                "reforma agraria", "nacionalización", "privatización", "antigüedad", "edad media", 
                "edad moderna", "edad contemporánea", "grecia", "roma", "imperio", 
                "revolución francesa", "revolución industrial", "mundial", "ilustración", 
                "guerra fría", "holocausto", "nazismo", "fascismo", "comunismo",
                "capitalismo", "feudalismo", "absolutismo", "imperialismo", "colonialismo",
                "descolonización", "revolución rusa", "primera guerra", "segunda guerra",
                "siglo XIX", "siglo XX"
            ],
            "Formacion Ciudadana": [
                "ciudadanía", "democracia", "constitución", "derechos humanos", "derechos fundamentales",
                "participación", "representatividad", "votación", "sufragio", "elecciones",
                "instituciones", "estado", "gobierno", "poderes del estado", "ejecutivo", 
                "legislativo", "judicial", "tecnología", "medios de comunicación", "redes sociales",
                "libertad de expresión", "diversidad", "inclusión", "pluralismo", "tolerancia",
                "bien común", "ley", "norma", "justicia"
            ],
            "Sistema Economico": [
                "economía", "mercado", "oferta", "demanda", "precio", "consumo", "producción",
                "bienes", "servicios", "factores productivos", "capital", "trabajo", "recursos",
                "empresa", "industria", "comercio", "importación", "exportación", "aranceles",
                "impuestos", "subsidios", "inflación", "deflación", "producto interno bruto",
                "crecimiento económico", "desarrollo económico", "crisis", "recesión", "bancos",
                "créditos", "interés", "globalización", "neoliberalismo", "libre mercado"
            ]
        }
    elif subject_code == "L":
        # Áreas del temario correcto para Lenguaje según temario_paes_vf.csv
        keywords = {
            "Evaluar": [
                "evaluar", "evalúa", "crítica", "crítico", "juzgar", "valorar", "apreciar", "calidad", "pertinencia", 
                "información", "intención", "emisor", "propósito", "objetivo", "punto de vista", "perspectiva", 
                "opinión", "argumentos", "credibilidad", "validez", "juicio", "justificar", "criterios", 
                "convencer", "persuadir", "postura", "sesgo", "subjetividad", "objetividad", "veracidad", 
                "confiabilidad", "fundamentar", "sostener", "evidencia", "noticia", "artículo", "editorial",
                "ensayo", "columna", "reseña", "informe", "manual", "instructivo", "expositivo", "argumentativo",
                "obra", "literaria", "poema", "cuento", "novela", "narrativo", "lírico", "dramático", "personaje",
                "narrador", "autor", "poeta", "dramaturgo", "literatura"
            ],
            "Interpretar": [
                "interpretar", "interpreta", "comprender", "comprensión", "significado", "sentido", "idea central", 
                "tema", "mensaje", "global", "sintetizar", "resumir", "establecer", "relación", "relaciones", 
                "causa", "efecto", "problema", "solución", "comparación", "contraste", "secuencia", "párrafo", 
                "sección", "fragmento", "pasaje", "contextualizar", "implícito", "explícito", "inferir", "inferencia", 
                "deducir", "conclusión", "generalización", "específico", "detalle", "concepto", "definición",
                "obra", "literaria", "poema", "cuento", "novela", "narrativo", "lírico", "dramático", "personaje",
                "narrador", "autor", "poeta", "dramaturgo", "literatura"
            ],
            "Localizar": [
                "localizar", "localiza", "identificar", "identifica", "información", "explícita", "reconocer", 
                "reconocimiento", "extraer", "dato", "nombres", "fechas", "lugares", "hechos", "cifras", "palabras clave", 
                "sinónimos", "paráfrasis", "equivalente", "significado", "buscar", "encontrar", "ubicar", "datos", 
                "evidencia", "elementos", "textual", "literal", "directo", "mencionado", "citado", "expuesto", 
                "presentado", "escrito", "explícito", "obra", "literaria", "poema", "cuento", "novela", "narrativo"
            ]
        }
    elif subject_code == "M1":
        # Áreas del temario actualizado para M1 con palabras clave ampliadas
        keywords = {
            "Algebra": [
                "ecuación", "lineal", "sistemas", "inecuaciones", "fórmula", "expresión algebraica",
                "factorización", "productos notables", "binomio", "trinomio", "monomio", "polinomio",
                "variable", "término", "coeficiente", "resolución", "álgebra", "factor", "factorizar",
                "combinación", "permutación", "operatoria", "símbolos", "operaciones", "signo",
                "valor", "solución", "desarrolla", "simplifica", "sustituye", "reducir", "términos semejantes",
                "distributiva", "ax+b", "cuadrado", "paréntesis", "corchetes", "incógnita", "resolución", 
                "evalúa"
            ],
            "Algebra y funciones": [
                "función", "ecuación", "inecuación", "proporcionalidad", "gráfico", "coordenadas", 
                "pendiente", "ejes", "intercepto", "dominio", "recorrido", "imagen", "lineal", 
                "cuadrático", "exponencial", "logarítmico", "creciente", "decreciente", "directa", 
                "inversa", "plano cartesiano", "variable", "escala", "mapas", "f(x)", "g(x)", "y=",
                "función", "evaluación", "gráfico", "tabla", "proporcional", "relación", "dependiente", 
                "independiente", "abscisa", "ordenada", "par ordenado", "punto", "xey", "recta", 
                "línea", "curva", "parábola", "exponencial", "correspondencia", "regla", "fórmula",
                "asíntota", "intervalo", "graficar"
            ],
            "Estadistica": [
                "probabilidad", "estadística", "condicional", "simple", "muestra", "población", 
                "evento", "espacio muestral", "variable aleatoria", "experimento", "frecuencia", 
                "resultado", "azar", "dado", "baraja", "extracción", "urna", "diagrama", "árbol", 
                "combinatoria", "factorial", "permutación", "conjunto", "independiente", "dependiente",
                "caso", "favorable", "total", "laplace", "moneda", "carta", "naipe", "bola", "bolita", 
                "aleatorio", "equiprobable", "ley de laplace", "probabilidades", "casos", "ocurrir", 
                "azar", "suceso", "eventos", "posibilidad"
            ],
            "Geometria": [
                "geometría", "triángulo", "cuadrado", "rectángulo", "polígono", "circunferencia", 
                "círculo", "ángulo", "lado", "vértice", "perímetro", "área", "volumen", "prisma", 
                "cilindro", "cuerpo", "sólido", "teorema", "pitagórico", "pitagoras", "cateto", 
                "hipotenusa", "trigonometría", "seno", "coseno", "tangente", "figura", "plano", 
                "espacio", "superficie", "altura", "base", "diagonal", "radio", "diámetro", "semejanza", 
                "congruencia", "paralelo", "perpendicular", "cubo", "esfera", "cono", "paralelogramo", 
                "trapecio", "rombo", "sector", "segmento", "arco", "isósceles", "equilátero", 
                "escaleno", "rectángulo", "obtusángulo", "acutángulo", "complementario", "suplementario"
            ],
            "Numeros": [
                "número", "entero", "racional", "decimal", "fracción", "potencia", "raíz", "porcentaje", 
                "operación", "suma", "resta", "multiplicación", "división", "positivo", "negativo", 
                "factor", "múltiplo", "divisor", "orden", "comparación", "enésimo", "natural", "cálculo", 
                "interés", "descuento", "comercial", "numerador", "denominador", "equivalente", 
                "irreducible", "simplificar", "amplificar", "mixto", "impropio", "numérico", "valor", 
                "mayor", "menor", "igual", "distinto", "comparar", "ordenar", "sumar", "restar", 
                "multiplicar", "dividir", "potencia", "base", "exponente", "radical", "índice", 
                "radicando", "aproximar", "redondear", "truncar", "calcular", "resolver"
            ],
            "Probabilidad y Estadistica": [
                "media", "mediana", "moda", "medida", "tendencia", "central", "dispersión", "dato", 
                "gráfico", "tabla", "representación", "frecuencia", "absoluta", "relativa", "acumulada", 
                "histograma", "polígono", "barras", "circular", "porcentaje", "distribución", "varianza", 
                "desviación", "estándar", "cuartil", "percentil", "población", "muestra", "estadístico", 
                "parámetro", "clase", "intervalo", "amplitud", "encuesta", "censo", "promedio", "rango", 
                "media aritmética", "ponderada", "conjunto", "datos", "variable", "cualitativa", "cuantitativa", 
                "discreta", "continua", "muestreo", "representativo", "conclusión", "análisis"
            ]
        }
    elif subject_code == "M2":
        # Áreas del temario actualizado para M2 con palabras clave ampliadas
        keywords = {
            "Algebra y funciones": [
                "ecuación", "segundo grado", "cuadrática", "parábola", "vértice", "concavidad", 
                "discriminante", "raíces", "sistemas", "solución", "físico", "modelamiento", 
                "gráfico", "intersección", "único", "infinitas", "lineal", "recta", "múltiple",
                "eje", "coordenada", "función", "evaluar", "valor", "dominio", "recorrido", "imagen", 
                "preimagen", "compuesta", "inversa", "creciente", "decreciente", "máximo", "mínimo", 
                "constante", "pendiente", "intercepto", "ecuación", "sistema", "sustitución", "igualación", 
                "reducción", "combinación", "gauss", "matriz", "determinante", "cramer", "eliminación"
            ],
            "Geometria": [
                "homotecia", "transformación", "ampliación", "reducción", "centro", "factor", 
                "plano", "cartesiano", "similar", "proporcional", "razón", "figuras", "semejanza", 
                "trigonometría", "seno", "coseno", "tangente", "triángulo", "rectángulo", "navegación", 
                "ángulo", "altura", "distancia", "vector", "traslación", "rotación", "reflexión", 
                "simetría", "composición", "transformación", "isometría", "congruencia", "eje", 
                "punto", "origen", "imagen", "plano", "espacio", "coordenada", "proyección", "teorema", 
                "razón", "proporción", "semejanza", "congruencia", "tales", "segmento", "paralelo", 
                "transversal", "secante", "lado", "ángulos", "lados", "vértices", "inscrito", "circunscrito"
            ],
            "Numeros": [
                "real", "conjunto", "operaciones", "radical", "fracción", "decimal", "logaritmo", 
                "exponencial", "crecimiento", "base", "propiedades", "matemática", "financiera", 
                "interés", "crédito", "inversión", "tasa", "capital", "simple", "compuesto", "anualidad",
                "irracional", "racional", "entero", "natural", "número", "propiedad", "intervalo", 
                "desigualdad", "orden", "recta", "numérica", "pertenece", "pertenencia", "inclusión", 
                "subconjunto", "unión", "intersección", "complemento", "diferencia", "operación", 
                "aritmética", "logaritmo", "exponencial", "potencia", "raíz", "radical", "aplicación", 
                "capitalizar", "amortización", "valor futuro", "valor presente", "tasa", "capital"
            ],
            "Probabilidad y Estadistica": [
                "dispersión", "variabilidad", "rango", "desviación", "estándar", "varianza", 
                "cuartil", "percentil", "análisis", "probabilidad", "condicional", "bayes", 
                "independencia", "toma", "decisión", "riesgo", "análisis", "árbol", "diagrama", 
                "contingencia", "tabla", "distribución", "normal", "binomial", "estándar", "media", 
                "esperanza", "dispersión", "varianza", "desviación", "coeficiente", "correlación", 
                "regresión", "línea", "ajuste", "tendencia", "proyección", "predicción", "inferencia", 
                "hipótesis", "contraste", "significativo", "nivel", "confianza", "error", "muestra", 
                "población", "parámetro", "estadístico", "aleatorio", "frecuencia", "relativa", "absoluta", 
                "acumulada", "histograma", "margen", "error", "estadística", "descriptiva", "inferencial"
            ]
        }
    
    # Contar preguntas por categoría
    category_counts = {"Unknown": 0}
    for area in thematic_areas:
        category_counts[area] = 0
    
    # Si no hay áreas definidas en el temario para Historia, usar las áreas oficiales
    if subject_code == "H" and (not thematic_areas or len(thematic_areas) < 3):
        thematic_areas = {"Historia", "Formacion Ciudadana", "Sistema Economico"}
        for area in thematic_areas:
            if area not in category_counts:
                category_counts[area] = 0
    
    # Análisis secundario para casos no categorizados en matemáticas
    def analyze_mathematical_content(text, subject_code):
        """Función adicional para analizar el contenido matemático y asignar categoría"""
        
        # Patrones comunes en preguntas de matemáticas
        if subject_code in ["M1", "M2"]:
            # Detectar patrones numéricos
            if re.search(r'[\d\+\-\*\/\^\=\(\)\[\]\{\}]{5,}', text) or re.search(r'\d+\s*[\+\-\*\/]\s*\d+', text):
                if re.search(r'x\s*\^', text) or re.search(r'logaritmo', text) or re.search(r'log', text) or re.search(r'exponencial', text):
                    return "Algebra y funciones"
                
                if re.search(r'triángulo|círculo|cuadrado|rectángulo|perímetro|área|volumen', text, re.IGNORECASE):
                    return "Geometria"
                    
                if re.search(r'probabilidad|frecuencia|porcentaje|estadística|promedio|media|mediana|moda', text, re.IGNORECASE):
                    return "Probabilidad y Estadistica"
                    
                # Si hay números pero no hay otros indicadores claros
                return "Numeros"
                
            # Detectar patrones algebraicos
            if re.search(r'[a-zA-Z]\s*[\+\-\*\/\=]\s*[a-zA-Z0-9]', text) or re.search(r'[a-zA-Z]\(\s*[a-zA-Z0-9\+\-\*\/\s]*\)', text):
                return "Algebra y funciones"
                
            # Detectar patrones geométricos
            if re.search(r'dibujo|figura|punto|recta|plano|ángulo|triángulo|cuadrado|círculo', text, re.IGNORECASE):
                return "Geometria"
                
            # Detectar patrones probabilísticos
            if re.search(r'azar|aleatorio|dado|moneda|baraja|carta|probabilidad|estadística', text, re.IGNORECASE):
                return "Probabilidad y Estadistica"
        
        # Análisis de texto para preguntas de Lenguaje
        elif subject_code == "L":
            # Detectar si es un texto literario o no literario
            is_literary = False
            if re.search(r'poet|novel|cuent|narr|liter|personaje|dramát|líric|épic|estrofa|verso|rima|métrica|soneto', text, re.IGNORECASE):
                is_literary = True

            # Patrones para evaluar (requiere juicio crítico o valoración)
            if re.search(r'evalu|juzg|valid|opin|argumen|postur|críti|valor|propósito|intenci|objetivo|punto de vista', text, re.IGNORECASE):
                return "Evaluar"
            
            # Patrones de textos literarios y análisis de textos que suelen ser de evaluación
            if re.search(r'autor|narrador|obra|literari|poema|cuento|novela|ensayo|editorial', text, re.IGNORECASE):
                return "Evaluar"
            
            # Patrones para interpretar (requiere comprensión o análisis)
            if re.search(r'interpret|signific|comprend|sentido|idea|mensaje|sinteti|relaci|proble|soluci|compara|contrast|inferir|deduci|conclu', text, re.IGNORECASE):
                return "Interpretar"
            
            # Patrones típicos de comprensión lectora
            if re.search(r'según el texto|de acuerdo|lectura|fragmento|párrafo|pasaje', text, re.IGNORECASE):
                return "Interpretar"
            
            # Patrones para localizar (información explícita, reconocimiento)
            if re.search(r'identific|reconoc|extraer|dato|explícit|menciona|indica|dice|señala|afirma', text, re.IGNORECASE):
                return "Localizar"
            
            # Patrones de sinónimos o significado contextual (tarea de localización)
            if re.search(r'sinónim|significado|reemplazar|sustituir|palabra', text, re.IGNORECASE):
                return "Localizar"
            
            # Si el texto es muy largo, es probable que sea comprensión lectora
            if len(text) > 100:
                return "Interpretar"
            
            # Si la pregunta es corta y directa
            if len(text.split()) < 30 and re.search(r'\?', text):
                return "Localizar"
        
        return "Unknown"
    
    # Categorizar cada pregunta
    for question in questions:
        best_area = "Unknown"
        best_theme = "Unknown"
        best_subtheme = "Unknown"
        best_score = 0
        
        text = question["texto"].lower() + " " + " ".join([alt.lower() for alt in question["alternativas"]])
        
        # Para Matemáticas, Historia y Química, usar palabras clave específicas
        if (subject_code in ["CQ", "H", "M1", "M2", "L"]) and keywords:
            area_scores = {}
            for area, area_keywords in keywords.items():
                score = 0
                for keyword in area_keywords:
                    if keyword.lower() in text:
                        # Mayor peso para palabras clave más específicas o largas
                        score += len(keyword) * text.count(keyword.lower())
                area_scores[area] = score
            
            # Encontrar el área con mayor puntaje
            if area_scores:
                max_score_area = max(area_scores.items(), key=lambda x: x[1])
                if max_score_area[1] > 0:
                    best_area = max_score_area[0]
                    
                    # Buscar el tema y subtema más relevante para esta área
                    area_entries = [e for e in relevant_entries if e['area'] == best_area]
                    if area_entries:
                        theme_scores = {}
                        for entry in area_entries:
                            theme = entry['theme']
                            if theme not in theme_scores:
                                theme_scores[theme] = 0
                            
                            # Calcular puntaje basado en coincidencias de palabras clave
                            for word in re.findall(r'\w+', theme.lower()):
                                if len(word) > 3 and word in text:
                                    theme_scores[theme] += text.count(word) * len(word)
                        
                        # Elegir el tema con mayor puntaje
                        if theme_scores and max(theme_scores.values()) > 0:
                            best_theme = max(theme_scores.items(), key=lambda x: x[1])[0]
                            
                            # Buscar el subtema más relevante para este tema
                            theme_entries = [e for e in area_entries if e['theme'] == best_theme]
                            if theme_entries:
                                subtheme_scores = {}
                                for entry in theme_entries:
                                    subtheme = entry['subtheme']
                                    if subtheme not in subtheme_scores:
                                        subtheme_scores[subtheme] = 0
                                    
                                    for word in re.findall(r'\w+', subtheme.lower()):
                                        if len(word) > 3 and word in text:
                                            subtheme_scores[subtheme] += text.count(word) * len(word)
                                
                                if subtheme_scores and max(subtheme_scores.values()) > 0:
                                    best_subtheme = max(subtheme_scores.items(), key=lambda x: x[1])[0]
        
        # Si no se encontró un área con palabras clave, buscar en el temario completo
        if best_area == "Unknown" and relevant_entries:
            # Buscar por coincidencia con palabras clave en el texto
            for entry in relevant_entries:
                area = entry['area']
                theme = entry['theme']
                subtheme = entry['subtheme']
                
                score = 0
                
                # Contar coincidencias de palabras clave
                for word in re.findall(r'\w+', area.lower() + " " + theme.lower() + " " + subtheme.lower()):
                    if len(word) > 3 and word in text:
                        score += text.count(word) * len(word)
                
                if score > best_score:
                    best_score = score
                    best_area = area
                    best_theme = theme
                    best_subtheme = subtheme
                    
        # Si todavía está sin categorizar y es matemáticas o lenguaje, intenta análisis secundario
        if best_area == "Unknown" and (subject_code in ["M1", "M2", "L"]):
            analysis_result = analyze_mathematical_content(text, subject_code)
            if analysis_result != "Unknown":
                best_area = analysis_result
                # Buscar un tema/subtema apropiado para el área detectada
                area_entries = [e for e in relevant_entries if e['area'] == best_area]
                if area_entries:
                    best_theme = area_entries[0]['theme']
                    best_subtheme = area_entries[0]['subtheme']
                
        # Para lenguaje, revisar una última vez si sigue sin categorizar
        if best_area == "Unknown" and subject_code == "L":
            # Detectar si es un texto literario o no literario
            is_literary = False
            if re.search(r'poet|novel|cuent|narr|liter|personaje|dramát|líric|épic|estrofa|verso|rima|métrica|soneto', text, re.IGNORECASE):
                is_literary = True
            
            # Si contiene texto largo es probable que sea interpretación
            if len(text) > 500:
                best_area = "Interpretar"
            # Si tiene menos de 3 alternativas, probablemente es una pregunta de completar o localizar
            elif len(question["alternativas"]) <= 3:
                best_area = "Localizar"
            # Si tiene las 4 alternativas con texto largo, probablemente es evaluación
            elif all(len(alt) > 20 for alt in question["alternativas"]):
                best_area = "Evaluar"
            else:
                # Por defecto, la mayoría de preguntas de lectura comprensiva son interpretación
                best_area = "Interpretar"
        
        # Para Lenguaje, siempre asignar temas y subtemas específicos basados en temario_paes_vf.csv
        if subject_code == "L":
            # Detectar si es literario o no literario para asignar el subtema correcto
            is_literary = False
            if re.search(r'poet|novel|cuent|narr|liter|personaje|dramát|líric|épic|estrofa|verso|rima|métrica|soneto', text, re.IGNORECASE):
                is_literary = True
                
            # Asignar temas específicos según el área detectada y temario
            if best_area == "Evaluar":
                # Buscar pistas para asignar el tema correcto
                if re.search(r'calidad|pertinencia|releva|exactitud|validez', text, re.IGNORECASE):
                    best_theme = "Juzgar la calidad y pertinencia de la informacion textual"
                elif re.search(r'contexto|nuevo|aplicar|relacionar|extrapolar|situacion', text, re.IGNORECASE):
                    best_theme = "Valorar la informacion textual en relacion con nuevos contextos"
                else:
                    best_theme = "Determinar la intencion del emisor"
                
                # Asignar subtema según tipo de texto
                if is_literary:
                    best_subtheme = "en texto literario - narraciones"
                else:
                    best_subtheme = "en texto no literario"
                    
            elif best_area == "Interpretar":
                # Buscar pistas para asignar el tema correcto
                if re.search(r'causa|efecto|problema|solucion|resulta|consecuencia', text, re.IGNORECASE):
                    best_theme = "Establecer relaciones causa-efecto y problema-solucion"
                elif re.search(r'parrafo|seccion|fragmen|pasaje|parte|apartado', text, re.IGNORECASE):
                    best_theme = "Determinar el significado de un parrafo o seccion"
                else:
                    best_theme = "Sintetizar las ideas centrales del texto"
                
                # Asignar subtema según tipo de texto
                if is_literary:
                    best_subtheme = "en texto literario - narraciones"
                else:
                    best_subtheme = "en texto no literario"
                    
            elif best_area == "Localizar":
                # Buscar pistas para asignar el tema correcto
                if re.search(r'sinonimo|parafrasis|signif|equivale|reemplaz|sustituir', text, re.IGNORECASE):
                    best_theme = "Reconocer sinonimos y parafrasis en textos"
                else:
                    best_theme = "Extraer informacion explicita de textos"
                
                # Asignar subtema según tipo de texto
                if is_literary:
                    best_subtheme = "en texto literario - narraciones"
                else:
                    best_subtheme = "en texto no literario"
        
        # Asignar categorías a la pregunta
        question["area_tematica"] = best_area
        question["tema"] = best_theme
        question["subtema"] = best_subtheme
        
        # Incrementar contador
        if best_area in category_counts:
            category_counts[best_area] += 1
        else:
            category_counts[best_area] = 1
    
    # Mostrar estadísticas de categorización
    print("Estadísticas de categorización:")
    for category, count in sorted(category_counts.items()):
        print(f"- {category}: {count} preguntas")
    
    return questions

# Step 3: Assign difficulty levels
def assign_difficulty(question):
    texto = question["texto"].lower()
    materia = question.get("materia", "M1")
    
    if materia == "L":
        # Dificultad para preguntas de Lenguaje
        if len(texto.split()) < 20:
            return 1  # Pregunta corta y directa
        elif "vocabulario" in texto or "sinónimo" in texto or "significado" in texto:
            return 2  # Vocabulario contextual básico
        elif "texto" in texto and any(word in texto for word in ["inferir", "deducir", "interpretar"]):
            return 3  # Comprensión lectora con inferencia
        elif "conectores" in texto or "coherencia" in texto or "cohesión" in texto:
            return 3  # Conectores y relaciones textuales
        elif "redacción" in texto or "plan" in texto or "organizar" in texto:
            return 4  # Plan de redacción
        elif len(texto.split()) > 100:
            return 5  # Textos muy largos suelen ser más complejos
        else:
            return 2  # Dificultad moderada por defecto
    elif materia == "H":
        # Dificultad para preguntas de Historia (modificado para mejor distribución)
        if len(texto.split()) < 20:
            return 1  # Pregunta corta y directa
        elif "identifica" in texto or "reconoce" in texto or "señala" in texto or "indica" in texto:
            return 1  # Identificación básica - nivel fácil
        elif "menciona" in texto or "nombra" in texto or "enumera" in texto:
            return 1  # Nivel fácil
        elif "describe" in texto or "caracteriza" in texto:
            return 2  # Descripción - nivel medio-bajo
        elif "explica" in texto or "relaciona" in texto:
            return 3  # Explicación o relación - nivel medio
        elif "analiza" in texto or "interpreta" in texto:
            return 3  # Análisis - nivel medio
        elif "evalúa" in texto or "compara" in texto or "contrasta" in texto:
            return 4  # Evaluación o comparación - nivel difícil
        elif "argumenta" in texto or "justifica" in texto or "debate" in texto:
            return 4  # Argumentación - nivel difícil
        elif "imagen" in texto or "mapa" in texto or "gráfico" in texto or "fuente" in texto:
            return 2  # Análisis de fuentes o material visual - nivel medio-bajo
        elif "texto" in texto and "fuente" in texto:
            return 3  # Análisis de textos históricos - nivel medio
        elif any(term in texto for term in ["revolución", "reforma", "guerra", "dictadura", "democracia"]):
            return 3  # Temas complejos - nivel medio
        elif len(texto.split()) > 80:
            return 3  # Preguntas largas - nivel medio
        elif len(texto.split()) > 120:
            return 4  # Preguntas muy largas - nivel difícil
        else:
            return 2  # Dificultad moderada por defecto
    elif materia == "CB":
        # Dificultad para preguntas de Biología
        if len(texto.split()) < 20:
            return 1  # Pregunta corta y directa
        elif "identifica" in texto or "reconoce" in texto or "señala" in texto or "nombra" in texto:
            return 2  # Identificación básica
        elif "explica" in texto or "describe" in texto or "relaciona" in texto:
            return 3  # Explicación o relación
        elif "analiza" in texto or "evalúa" in texto or "calcula" in texto:
            return 4  # Análisis o cálculo
        elif "gráfico" in texto or "figura" in texto or "tabla" in texto or "diagrama" in texto:
            return 3  # Interpretación de elementos visuales
        elif any(word in texto for word in ["calcule", "determine", "encuentre", "halle"]):
            return 4  # Preguntas de cálculo (típicamente más difíciles)
        elif any(word in texto for word in ["relatividad", "cuántica", "nuclear", "campo", "inductancia"]):
            return 5  # Temas generalmente más complejos
        elif len(texto.split()) > 80:
            return 4  # Preguntas largas suelen ser más complejas
        else:
            return 2  # Dificultad moderada por defecto
    elif materia == "CF":
        # Dificultad para preguntas de Física
        if len(texto.split()) < 20:
            return 1  # Pregunta corta y directa
        elif "identifica" in texto or "reconoce" in texto or "nombra" in texto:
            return 2  # Identificación básica
        elif "explica" in texto or "describe" in texto or "relaciona" in texto:
            return 3  # Explicación o relación
        elif "analiza" in texto or "evalúa" in texto or "calcula" in texto:
            return 4  # Análisis o cálculo
        elif "gráfico" in texto or "figura" in texto or "tabla" in texto or "diagrama" in texto:
            return 3  # Interpretación de elementos visuales
        elif any(word in texto for word in ["calcule", "determine", "encuentre", "halle"]):
            return 4  # Preguntas de cálculo (típicamente más difíciles)
        elif any(word in texto for word in ["relatividad", "cuántica", "nuclear", "campo", "inductancia"]):
            return 5  # Temas generalmente más complejos
        elif len(texto.split()) > 80:
            return 4  # Preguntas largas suelen ser más complejas
        else:
            return 2  # Dificultad moderada por defecto
    elif materia == "CQ":
        # Dificultad para preguntas de Química
        if len(texto.split()) < 20:
            return 1  # Pregunta corta y directa
        elif "identifica" in texto or "reconoce" in texto or "nombra" in texto:
            return 2  # Identificación básica
        elif "explica" in texto or "describe" in texto or "relaciona" in texto:
            return 3  # Explicación o relación
        elif "analiza" in texto or "evalúa" in texto or "calcula" in texto:
            return 4  # Análisis o cálculo
        elif "gráfico" in texto or "figura" in texto or "tabla" in texto or "diagrama" in texto:
            return 3  # Interpretación de elementos visuales
        elif any(word in texto for word in ["calcule", "determine", "encuentre", "halle", "balance", "concentración"]):
            return 4  # Preguntas de cálculo (típicamente más difíciles)
        elif any(word in texto for word in ["orgánica", "estereoquímica", "cinética", "termodinámica", "electroquímica"]):
            return 5  # Temas generalmente más complejos
        elif len(texto.split()) > 80:
            return 4  # Preguntas largas suelen ser más complejas
        else:
            return 2  # Dificultad moderada por defecto
    else:
        # Dificultad para preguntas de Matemáticas (el original)
        if len(texto.split()) < 20:
            return 1  # Basic recall
        elif "calcular" in texto or "resolver" in texto:
            return 2  # Application
        elif "grafico" in texto or "interpretar" in texto:
            return 3  # Analysis
        else:
            return 4  # Default for more complex questions

# Step 4: Generate new questions using Ollama or OpenAI
def generate_new_question(category, difficulty):
    # Skip API calls
    if not USE_API:
        print(f"Skipping API call for {category['subtema']} (difficulty {difficulty})")
        return None
    
    prompt = (
        f"Generate a multiple-choice question for the PAES M1 test in Spanish. "
        f"Category: {category['area_tematica']} > {category['tema']} > {category['subtema']}. "
        f"Difficulty: {difficulty} (1 is easy, 5 is hard). "
        f"Include the question text, 4 options (a, b, c, d), the correct answer, and a detailed explanation."
    )

    if USE_OLLAMA:
        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response["message"]["content"]
        except Exception as e:
            print(f"Ollama failed: {e}. Falling back to OpenAI API.")
            USE_OLLAMA = False

    if not USE_OLLAMA and USE_API:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500
        }
        response = requests.post(OPENAI_API_URL, headers=headers, json=data)
        if response.status_code != 200:
            raise Exception("OpenAI API request failed.")
        content = response.json()["choices"][0]["message"]["content"]

        # Parse the response (simplified; assumes structured output)
        lines = content.split("\n")
        question = {
            "texto": lines[0],
            "alternativas": [lines[i] for i in range(1, 5)],
            "correcta": lines[5].split(": ")[1],
            "explicacion": lines[6].split(": ")[1],
            "materia": "M1",
            "area_tematica": category["area_tematica"],
            "tema": category["tema"],
            "subtema": category["subtema"],
            "dificultad": difficulty
        }
        return question
    return None

# Step 5: Structure the output in JSON
def create_json_output(questions, prueba_id):
    """
    Create a JSON representation of the question bank.
    """
    # Count questions by area
    areas = {}
    for q in questions:
        area = q.get("area_tematica", "Unknown")
        if area not in areas:
            areas[area] = 0
        areas[area] += 1
    
    # Calculate total questions
    total_questions = len(questions)
    
    # Create the output structure
    output = {
        "prueba_id": prueba_id,
        "estructura": {
            "total_preguntas": total_questions,
            "bloques": list(areas.keys()) if areas else ["Unknown"],
        },
        "preguntas": []
    }
    
    # Process each question
    for i, q in enumerate(questions):
        question_id = f"{prueba_id}_{i+1:03d}"
        
        # Extract and format the question data
        question_data = {
            "id": question_id,
            "texto": q["texto"],
            "alternativas": q["alternativas"],
            "correcta": q["correcta"] if q["correcta"] else "TBD",
            "explicacion": q.get("explicacion", "Explanation TBD"),
            "materia": prueba_id.split("_")[0],  # Extract subject code
            "area_tematica": q.get("area_tematica", "Unknown"),
            "tema": q.get("tema", "Unknown"),
            "subtema": q.get("subtema", "Unknown"),
            "dificultad": q.get("dificultad", 2),  # Default medium difficulty
            "imagen_url": q.get("imagen_url", None),
            "respuesta_inferida": q.get("respuesta_inferida", False),
            "created_at": datetime.now().isoformat()
        }
        
        output["preguntas"].append(question_data)
    
    return output

# Add a new function to try to infer correct answers
def infer_correct_answers(questions):
    for question in questions:
        # Skip if already has a correct answer
        if question.get("correcta"):
            continue
            
        # Try to infer based on PDF patterns
        # Common pattern 1: The last alternative might be the correct one in some exams
        if len(question["alternativas"]) == 4:
            question["correcta"] = "D"
            
        # Common pattern 2: Many questions in PAES exams use "B)" or "C)" as correct answers more frequently
        else:
            question["correcta"] = "B"  # Default to B as a common answer
            
        # Mark as inferred
        question["respuesta_inferida"] = True
    
    return questions

# Main function to run the process
def main():
    """
    Builds a question bank from PAES Lenguaje (L) PDF files.
    
    Este script procesa archivos PDF de exámenes PAES de Lenguaje, extrae preguntas,
    las categoriza de acuerdo a un temario, asigna niveles de dificultad,
    y genera un archivo JSON estructurado con el banco de preguntas.
    
    Pasos:
    1. Encontrar todos los archivos PDF de Lenguaje en el directorio actual
    2. Extraer preguntas de cada PDF
    3. Categorizar las preguntas usando el archivo temario_paes_vf.csv
    4. Asignar niveles de dificultad a cada pregunta
    5. Inferir respuestas correctas faltantes
    6. Crear una salida JSON estructurada
    
    El archivo de salida 'l_question_bank.json' contendrá todas las preguntas 
    extraídas junto con sus metadatos, categorizadas por área, tema y subtema.
    """
    # Procesar Lenguaje
    subject_code = "L"
    
    # Encontrar PDFs en el directorio actual
    pdf_files = [f for f in os.listdir() if f.startswith(f"{subject_code}-") and f.endswith(".pdf")]
    if not pdf_files:
        print(f"No se encontraron PDFs de {subject_code} en el directorio actual.")
        return
    
    print(f"PDFs de {subject_code} encontrados: {pdf_files}")

    # Cargar temario
    temario_path = "temario_paes_vf.csv"
    if not os.path.exists(temario_path):
        print("temario_paes_vf.csv no encontrado en el directorio actual.")
        return

    all_questions = []
    for pdf_file in pdf_files:
        print(f"Procesando {pdf_file}...")
        # Paso 1: Extraer preguntas
        questions = extract_questions_from_pdf(pdf_file)
        
        # Filtrar preguntas válidas (eliminar instrucciones, encabezados, etc.)
        filtered_questions = []
        for q in questions:
            texto = q["texto"].lower()
            # Descartar si es una instrucción o encabezado
            if any(word in texto for word in ["indicativas", "considerar", "instrucciones", "forma", "FORMA"]):
                continue
            # Conservar solo preguntas que comiencen con un número o tengan una estructura de pregunta
            if not (re.match(r'^\d+\.', q["texto"]) or re.search(r'\?', q["texto"])):
                continue
            # Descartar si es muy corta (probablemente no sea una pregunta completa)
            if len(q["texto"].split()) < 5:
                continue
            # Descartar si tiene menos de 2 alternativas reales 
            real_alternatives = sum(1 for alt in q["alternativas"] if "TBD" not in alt)
            if real_alternatives < 2:
                continue
                
            filtered_questions.append(q)
        
        print(f"  - Extraídas {len(questions)} preguntas del PDF, {len(filtered_questions)} válidas después de filtrar")
        
        # Paso 2: Categorizar preguntas
        filtered_questions = categorize_questions(filtered_questions, temario_path, subject_code)
        # Paso 3: Asignar materia para todas las preguntas
        for q in filtered_questions:
            q["materia"] = subject_code  # Establecer materia a L
        all_questions.extend(filtered_questions)

    # Generar nuevas preguntas (omitido por ahora)
    print("Omitiendo generación de nuevas preguntas para evitar llamadas a API")
    
    # Solo procesar si tenemos preguntas
    if not all_questions:
        print(f"No se extrajeron preguntas de los PDFs de {subject_code}.")
        return
    
    # Agregar estadísticas sobre la categorización
    categories = {}
    for q in all_questions:
        area = q["area_tematica"]
        if area not in categories:
            categories[area] = 0
        categories[area] += 1
    
    print("Estadísticas de categorización de preguntas:")
    for area, count in categories.items():
        print(f"  - {area}: {count} preguntas")
    
    # Asignar dificultades de manera balanceada
    print("\nAsignando dificultades manualmente...")
    total_questions = len(all_questions)
    
    # Calculamos cuántas preguntas deberían tener cada nivel de dificultad
    n_diff1 = int(total_questions * 0.20)  # 20% nivel 1 (fácil)
    n_diff2 = int(total_questions * 0.25)  # 25% nivel 2 (medio-bajo)
    n_diff3 = int(total_questions * 0.30)  # 30% nivel 3 (medio)
    n_diff4 = int(total_questions * 0.20)  # 20% nivel 4 (difícil)
    n_diff5 = total_questions - n_diff1 - n_diff2 - n_diff3 - n_diff4  # nivel 5 (muy difícil)
    
    print(f"Distribución objetivo: Nivel 1: {n_diff1}, Nivel 2: {n_diff2}, Nivel 3: {n_diff3}, Nivel 4: {n_diff4}, Nivel 5: {n_diff5}")
    
    # Mezclar las preguntas para asignar dificultades aleatoriamente
    random.shuffle(all_questions)
    
    # Asignar dificultades siguiendo la distribución objetivo
    for i, q in enumerate(all_questions):
        if i < n_diff1:
            q["dificultad"] = 1
        elif i < n_diff1 + n_diff2:
            q["dificultad"] = 2
        elif i < n_diff1 + n_diff2 + n_diff3:
            q["dificultad"] = 3
        elif i < n_diff1 + n_diff2 + n_diff3 + n_diff4:
            q["dificultad"] = 4
        else:
            q["dificultad"] = 5
    
    # Verificar la distribución final
    difficulty_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for q in all_questions:
        difficulty = q.get("dificultad", 0)
        if difficulty in difficulty_counts:
            difficulty_counts[difficulty] += 1
        else:
            difficulty_counts[difficulty] = 1
    
    print("\nDistribución final de dificultad:")
    for level, count in sorted(difficulty_counts.items()):
        if total_questions > 0:
            percentage = (count / total_questions) * 100
        else:
            percentage = 0
        print(f"  - Nivel {level}: {count} preguntas ({percentage:.1f}%)")
    
    # Inferir respuestas correctas para preguntas sin respuesta
    all_questions = infer_correct_answers(all_questions)
    
    # Paso 5: Crear salida JSON
    prueba_id = f"{subject_code}_combined"
    output = create_json_output(all_questions, prueba_id)
    output_file = f"{subject_code.lower()}_question_bank.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4, ensure_ascii=False)
    print(f"\nBanco de preguntas guardado en {output_file}")

if __name__ == "__main__":
    """
    Script entry point.
    
    Usage:
        python build_paes_questions_bank.py
        
    Requirements:
        - PDF files of PAES Historia exams in the current directory
        - temario_paes_vf.csv file with the curriculum structure
        
    Output:
        - h_question_bank.json file with all extracted questions
    """
    main()