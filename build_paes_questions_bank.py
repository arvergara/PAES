import csv
import json
import os
import traceback

# Verificar si existen las funciones necesarias
functions_needed = [
    'extract_questions_from_pdf',
    'filter_invalid_questions',
    'infer_correct_answer',
    'assign_difficulty'
]

for func_name in functions_needed:
    if func_name not in globals():
        print(f"ADVERTENCIA: La función {func_name} no está definida en este archivo")

# Definir funciones mockup si no existen en el código
def extract_questions_from_pdf(pdf_file):
    """Mock function if real implementation is missing"""
    print(f"MOCK: extract_questions_from_pdf llamada con {pdf_file}")
    return []

def filter_invalid_questions(questions):
    """Mock function if real implementation is missing"""
    print(f"MOCK: filter_invalid_questions llamada con {len(questions)} preguntas")
    return questions

def assign_difficulty(question):
    """Mock function if real implementation is missing"""
    return 2  # Dificultad media por defecto

def infer_correct_answer(question):
    """Mock function if real implementation is missing"""
    return "A"  # Respuesta por defecto

def categorize_with_keywords(question_text, subject, temario):
    """
    Categoriza una pregunta utilizando palabras clave específicas por materia,
    pero asegurándose de que las categorías asignadas correspondan exactamente 
    a las definidas en el temario_paes.csv
    """
    # Texto en minúsculas para comparación
    texto = question_text.lower()
    
    # Para diagnóstico: imprimir un fragmento del texto a analizar
    print_debug = True  # Activado para diagnóstico
    if print_debug and subject == "CQ" and len(texto) > 20:
        text_preview = texto[:150] + "..." if len(texto) > 150 else texto
        print(f"Analizando texto: {text_preview}")
    
    # Determinar el subject_to_search basado en el subject
    subject_to_search = ""
    if subject == "CB":
        subject_to_search = "C-biologia"
    elif subject == "CF":
        subject_to_search = "C-fisica"
    elif subject == "CQ":
        subject_to_search = "C-quimica"
    elif subject == "H":
        subject_to_search = "H"
    else:
        subject_to_search = subject
    
    # Obtener las categorías disponibles en el temario para este subject
    relevant_entries = [entry for entry in temario if entry["subject"] == subject_to_search]
    
    # Si no hay entradas en el temario, devolver Unknown
    if not relevant_entries:
        if print_debug:
            print(f"No hay entradas en el temario para {subject_to_search}")
        return "Unknown", "Unknown", "Unknown"
    
    # Crear listas de áreas, temas y subtemas disponibles en el temario
    areas_disponibles = list(set(entry["area_tematica"] for entry in relevant_entries))
    temas_por_area = {}
    subtemas_por_tema = {}
    
    for area in areas_disponibles:
        temas_por_area[area] = list(set(entry["tema"] for entry in relevant_entries if entry["area_tematica"] == area))
        
    for entry in relevant_entries:
        area_tema = (entry["area_tematica"], entry["tema"])
        if area_tema not in subtemas_por_tema:
            subtemas_por_tema[area_tema] = []
        subtemas_por_tema[area_tema].append(entry["subtema"])
    
    if print_debug:
        print(f"Áreas disponibles: {areas_disponibles}")
        for area, temas in temas_por_area.items():
            print(f"Temas de {area}: {temas}")
    
    # Definir palabras clave específicas por materia
    if subject == "CQ":
        # Palabras clave para Química basadas en las áreas del temario
        keywords_por_area = {
            "Estructura atómica": ["átomo", "electrón", "protón", "neutrón", "orbital", "configuración", 
                                  "elemento", "tabla periódica", "grupo", "periodo", "metal", "no metal", 
                                  "número atómico", "masa atómica", "bohr", "rutherford", "thomson"],
            
            "Enlaces químicos": ["enlace", "covalente", "iónico", "metálico", "electronegatividad", 
                                "polar", "apolar", "molécula", "lewis", "geometría molecular"],
            
            "Reacciones químicas": ["reacción", "reactivo", "producto", "estequiometría", "equilibrio", 
                                   "pH", "ácido", "base", "concentración", "mol", "constante", "catalizador",
                                   "presión", "temperatura", "rendimiento", "balance", "ecuación"],
            
            "Química orgánica": ["carbono", "orgánica", "hidrocarburo", "alcano", "alqueno", "alquino", 
                                "aromático", "alcohol", "aldehído", "cetona", "ácido carboxílico", 
                                "éster", "éter", "amina", "fenol", "grupo funcional"]
        }
        
        # Palabras clave para los temas específicos
        keywords_por_tema = {
            "Modelos atómicos": ["modelo atómico", "bohr", "rutherford", "thomson", "orbital", "electrón", 
                                "nivel", "subnivel", "configuración electrónica"],
            "Tabla periódica": ["tabla periódica", "elemento", "grupo", "periodo", "metal", "no metal", 
                               "propiedades periódicas", "electronegatividad", "energía de ionización"],
            "Tipos de enlaces": ["enlace", "covalente", "iónico", "metálico", "polar", "apolar", "geometría molecular"],
            "Estequiometría": ["mol", "masa", "volumen", "concentración", "balance", "ecuación", "reactivo", 
                              "producto", "estequiometría", "rendimiento"],
            "Equilibrio químico": ["equilibrio", "constante", "ácido", "base", "pH", "desplazamiento", 
                                  "Le Chatelier", "presión", "temperatura", "catalizador"],
            "Hidrocarburos": ["hidrocarburo", "alcano", "alqueno", "alquino", "aromático", "carbono", 
                             "saturado", "insaturado", "metano", "etano", "butano"],
            "Grupos funcionales": ["grupo funcional", "alcohol", "aldehído", "cetona", "ácido carboxílico", 
                                  "éster", "éter", "amina", "fenol"]
        }
        
        # Calcular puntuaciones para cada área
        area_scores = {}
        for area, keywords in keywords_por_area.items():
            if area in areas_disponibles:  # Solo considerar áreas que existen en el temario
                score = 0
                matches = []
                for keyword in keywords:
                    if keyword in texto:
                        score += 1
                        matches.append(keyword)
                area_scores[area] = score
                
                if print_debug and score > 0:
                    print(f"Área {area}: puntuación {score}, coincidencias: {matches}")
                elif print_debug:
                    print(f"Área {area}: sin coincidencias")
        
        if print_debug and not any(score > 0 for score in area_scores.values()):
            print("No se encontraron coincidencias para ninguna área temática")
        
        # Encontrar el área con mayor puntuación
        if any(score > 0 for score in area_scores.values()):
            best_area = max(area_scores.items(), key=lambda x: x[1])[0]
            
            # Calcular puntuaciones para los temas de esta área
            tema_scores = {}
            for tema in temas_por_area.get(best_area, []):
                if tema in keywords_por_tema:
                    score = 0
                    matches = []
                    for keyword in keywords_por_tema[tema]:
                        if keyword in texto:
                            score += 1
                            matches.append(keyword)
                    tema_scores[tema] = score
                    
                    if print_debug and score > 0:
                        print(f"Tema {tema}: puntuación {score}, coincidencias: {matches}")
                    elif print_debug:
                        print(f"Tema {tema}: sin coincidencias")
                        
            if print_debug and not any(score > 0 for score in tema_scores.values()):
                print(f"No se encontraron coincidencias para ningún tema de {best_area}")
            
            # Encontrar el tema con mayor puntuación
            if tema_scores and any(score > 0 for score in tema_scores.values()):
                best_tema = max(tema_scores.items(), key=lambda x: x[1])[0]
            else:
                # Si no hay coincidencias específicas de tema, usar el primer tema disponible
                best_tema = temas_por_area[best_area][0] if temas_por_area[best_area] else "Unknown"
            
            # Obtener el subtema correspondiente
            best_subtema = "Unknown"
            if (best_area, best_tema) in subtemas_por_tema and subtemas_por_tema[(best_area, best_tema)]:
                best_subtema = subtemas_por_tema[(best_area, best_tema)][0]
            
            if print_debug:
                print(f"Categoría final: {best_area} - {best_tema} - {best_subtema}")
            
            return best_area, best_tema, best_subtema
    
    # Para otros subjects se podrían implementar keywords específicos siguiendo el mismo patrón
    
    return "Unknown", "Unknown", "Unknown"

def categorize_questions(questions, temario_path, subject):
    """
    Categoriza una lista de preguntas según el temario proporcionado.
    """
    try:
        # Cargar temario
        print(f"Intentando cargar temario desde: {temario_path}")
        print(f"Ruta absoluta: {os.path.abspath(temario_path)}")
        print(f"El archivo existe: {os.path.exists(temario_path)}")
        
        if not os.path.exists(temario_path):
            print(f"ERROR: El archivo {temario_path} no existe.")
            # Buscar el archivo en el directorio actual y padres
            for dir_path in ['.', '..', '../..']:
                test_path = os.path.join(dir_path, 'temario_paes.csv')
                if os.path.exists(test_path):
                    print(f"Encontrado en: {test_path}")
                    temario_path = test_path
                    break
        
        temario = []
        with open(temario_path, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"Primeras 100 caracteres del archivo: {content[:100]}")
            f.seek(0)  # Volver al inicio del archivo
            
            reader = csv.reader(f, delimiter=';')
            header = next(reader)  # Skip header
            print(f"Cabecera del CSV: {header}")
            
            for row in reader:
                # Asegurarse de que hay suficientes campos en la fila
                if len(row) >= 4:
                    temario.append({
                        "subject": row[0],
                        "area_tematica": row[1],
                        "tema": row[2],
                        "subtema": row[3],
                        "keywords": row[4] if len(row) > 4 else ""
                    })
                else:
                    print(f"Fila con formato incorrecto: {row}")
        
        # Verificar el temario cargado
        print(f"Temario cargado: {len(temario)} entradas")
        subject_to_search = ""
        if subject == "CB":
            subject_to_search = "C-biologia"
        elif subject == "CF":
            subject_to_search = "C-fisica"
        elif subject == "CQ":
            subject_to_search = "C-quimica"
        elif subject == "H":
            subject_to_search = "H"
        else:
            subject_to_search = subject
            
        # Verificar entradas relevantes para esta materia
        relevant_entries = [entry for entry in temario if entry["subject"] == subject_to_search]
        print(f"Entradas relevantes para {subject_to_search}: {len(relevant_entries)}")
        
        if relevant_entries:
            # Mostrar un ejemplo de entrada relevante
            print("Ejemplo de entrada relevante:")
            print(relevant_entries[0])
            # Mostrar áreas temáticas disponibles
            areas = set(entry["area_tematica"] for entry in relevant_entries)
            print(f"Áreas temáticas disponibles: {areas}")
        else:
            print(f"ADVERTENCIA: No hay entradas para {subject_to_search} en el temario")
            # Mostrar los subjects disponibles
            subjects = set(entry["subject"] for entry in temario)
            print(f"Subjects disponibles en el temario: {subjects}")

        # Inicializar la puntuación de cada área temática
        area_scores = {}

        # Categorizar cada pregunta
        for i, q in enumerate(questions):
            # Mostrar algunas preguntas de ejemplo para depuración
            if i < 3 or i % 100 == 0:  # Mostrar las primeras 3 y luego cada 100
                print(f"\nProcesando pregunta {i+1}/{len(questions)}:")
                text_preview = q["texto"][:150] + "..." if len(q["texto"]) > 150 else q["texto"]
                print(text_preview)
            
            # Para química, primero intentamos categorizar con palabras clave específicas
            if subject == "CQ":
                area_tematica, tema, subtema = categorize_with_keywords(q["texto"], subject, temario)
                if area_tematica != "Unknown":
                    q["area_tematica"] = area_tematica
                    q["tema"] = tema
                    q["subtema"] = subtema
                    continue  # Si se categorizó correctamente, pasamos a la siguiente pregunta
            
            # Categoría mediante temario para todas las materias o si falló la categorización con palabras clave
            result = categorize_question_with_temario(q["texto"], temario, subject)
            q["area_tematica"] = result["area_tematica"]
            q["tema"] = result["tema"]
            q["subtema"] = result["subtema"]

            # Si falló la categorización con temario y no es química (que ya se intentó antes)
            if q["area_tematica"] == "Unknown" and subject != "CQ":
                area_tematica, tema, subtema = categorize_with_keywords(q["texto"], subject, temario)
                q["area_tematica"] = area_tematica
                q["tema"] = tema
                q["subtema"] = subtema

        return questions
    except Exception as e:
        print(f"Error al categorizar preguntas: {e}")
        traceback.print_exc()
        return questions