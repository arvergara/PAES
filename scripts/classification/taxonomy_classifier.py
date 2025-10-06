"""
Clasificador Taxonómico PAES con IA
====================================

Utiliza modelos de lenguaje para clasificar preguntas PAES según:
- Área temática
- Tema específico
- Habilidad requerida

Basado en el temario oficial PAES (temario_paes_vs.csv)
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
from transformers import pipeline
from tqdm import tqdm
import time

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Mapeo de habilidades por materia
ABILITY_MAP = {
    "CB": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],
    "CF": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],
    "CQ": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],
    "M1": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],
    "M2": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],
    "H": ["Evaluar", "Interpretar", "Localizar"],
    "L": ["Evaluar", "Interpretar", "Localizar"],
    "C": ["Resolver problemas", "Modelar", "Representar", "Argumentar"],  # Genérico para ciencias
    "ALL": ["Resolver problemas", "Modelar", "Representar", "Argumentar", "Evaluar", "Interpretar", "Localizar"]
}


class TaxonomyClassifier:
    """
    Clasificador de preguntas PAES usando zero-shot classification
    """
    
    def __init__(self, 
                 temario_path: str = "content/temario_paes_vs.csv",
                 model_name: str = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
                 device: int = -1):
        """
        Inicializa el clasificador
        
        Args:
            temario_path: Ruta al archivo CSV del temario
            model_name: Modelo de Hugging Face a usar
            device: -1 para CPU, 0+ para GPU
        """
        self.temario_path = Path(temario_path)
        self.model_name = model_name
        self.device = device
        
        # Cargar temario
        self._load_temario()
        
        # Inicializar pipeline (lazy loading)
        self._classifier = None
        
    def _load_temario(self):
        """Carga y procesa el temario PAES"""
        if not self.temario_path.exists():
            raise FileNotFoundError(f"No se encuentra el archivo de temario: {self.temario_path}")
            
        logger.info(f"Cargando temario desde: {self.temario_path}")
        self.df_temario = pd.read_csv(self.temario_path)
        
        # Limpiar espacios en blanco
        self.df_temario['Subject'] = self.df_temario['Subject'].str.strip().str.upper()
        self.df_temario['Area_tematica'] = self.df_temario['Area_tematica'].str.strip()
        self.df_temario['Tema'] = self.df_temario['Tema'].str.strip()
        
        # Crear estructura de datos para búsqueda eficiente
        self.subjects = sorted(self.df_temario['Subject'].unique())
        self.areas_by_subject = {}
        self.temas_by_area = {}
        
        for subject in self.subjects:
            df_subject = self.df_temario[self.df_temario['Subject'] == subject]
            areas = sorted(df_subject['Area_tematica'].unique())
            self.areas_by_subject[subject] = areas
            
            for area in areas:
                df_area = df_subject[df_subject['Area_tematica'] == area]
                temas = sorted(df_area['Tema'].unique())
                self.temas_by_area[f"{subject}_{area}"] = temas
                
        logger.info(f"Temario cargado: {len(self.subjects)} materias, {len(self.df_temario)} entradas")
        
    @property
    def classifier(self):
        """Lazy loading del modelo de clasificación"""
        if self._classifier is None:
            logger.info(f"Cargando modelo: {self.model_name}")
            self._classifier = pipeline(
                "zero-shot-classification",
                model=self.model_name,
                device=self.device
            )
            logger.info("Modelo cargado exitosamente")
        return self._classifier
        
    def classify_question(self, 
                         question_text: str, 
                         subject: str,
                         options: Optional[List[str]] = None) -> Dict[str, any]:
        """
        Clasifica una pregunta según el temario PAES
        
        Args:
            question_text: Texto de la pregunta
            subject: Código de materia (CB, CF, CQ, H, L, M1, M2)
            options: Opciones de respuesta (opcional, para mejor contexto)
            
        Returns:
            Diccionario con clasificación y confianza
        """
        subject = subject.upper()
        
        # Validar materia
        if subject not in self.subjects and subject not in ABILITY_MAP:
            logger.warning(f"Materia '{subject}' no encontrada, usando 'ALL'")
            subject = 'ALL'
            
        # Preparar texto completo para clasificación
        full_text = question_text
        if options:
            options_text = " ".join([f"Opción: {opt}" for opt in options])
            full_text = f"{question_text} {options_text}"
            
        # 1. Clasificar área temática
        if subject in self.areas_by_subject:
            area_candidates = self.areas_by_subject[subject]
        else:
            # Si no hay áreas específicas, usar todas las del temario
            area_candidates = sorted(self.df_temario['Area_tematica'].unique())
            
        area_result = self._classify_with_template(
            full_text,
            area_candidates,
            "Esta pregunta se relaciona con el área de {}"
        )
        
        # 2. Clasificar tema específico
        tema_key = f"{subject}_{area_result['label']}"
        if tema_key in self.temas_by_area:
            tema_candidates = self.temas_by_area[tema_key]
        else:
            # Buscar temas de esa área sin importar la materia
            df_area = self.df_temario[self.df_temario['Area_tematica'] == area_result['label']]
            tema_candidates = sorted(df_area['Tema'].unique())
            
        if len(tema_candidates) > 0:
            tema_result = self._classify_with_template(
                full_text,
                tema_candidates,
                "El tema específico de esta pregunta es {}"
            )
        else:
            tema_result = {'label': area_result['label'], 'score': area_result['score']}
            
        # 3. Clasificar habilidad
        habilidades = ABILITY_MAP.get(subject, ABILITY_MAP['ALL'])
        habilidad_result = self._classify_with_template(
            full_text,
            habilidades,
            "Para resolver esta pregunta se necesita {}"
        )
        
        # Construir resultado
        result = {
            'subject': subject,
            'area_tematica': area_result['label'],
            'area_confidence': area_result['score'],
            'tema': tema_result['label'],
            'tema_confidence': tema_result['score'],
            'habilidad': habilidad_result['label'],
            'habilidad_confidence': habilidad_result['score'],
            'overall_confidence': (area_result['score'] + tema_result['score'] + habilidad_result['score']) / 3,
            'all_scores': {
                'areas': area_result.get('all_scores', {}),
                'temas': tema_result.get('all_scores', {}),
                'habilidades': habilidad_result.get('all_scores', {})
            }
        }
        
        return result
        
    def _classify_with_template(self, 
                               text: str, 
                               candidates: List[str], 
                               template: str) -> Dict[str, any]:
        """
        Realiza clasificación zero-shot con una plantilla específica
        
        Args:
            text: Texto a clasificar
            candidates: Lista de etiquetas candidatas
            template: Plantilla de hipótesis
            
        Returns:
            Diccionario con resultado de clasificación
        """
        if not candidates:
            return {'label': 'Sin clasificar', 'score': 0.0, 'all_scores': {}}
            
        try:
            result = self.classifier(
                text,
                candidate_labels=candidates,
                hypothesis_template=template
            )
            
            # Crear diccionario de todos los scores
            all_scores = dict(zip(result['labels'], result['scores']))
            
            return {
                'label': result['labels'][0],
                'score': result['scores'][0],
                'all_scores': all_scores
            }
            
        except Exception as e:
            logger.error(f"Error en clasificación: {e}")
            return {'label': candidates[0] if candidates else 'Error', 'score': 0.0, 'all_scores': {}}
            
    def classify_batch(self, 
                      questions: List[Dict[str, any]], 
                      show_progress: bool = True) -> List[Dict[str, any]]:
        """
        Clasifica múltiples preguntas en batch
        
        Args:
            questions: Lista de preguntas (deben tener 'content' y 'subject')
            show_progress: Mostrar barra de progreso
            
        Returns:
            Lista de preguntas con clasificación agregada
        """
        classified_questions = []
        
        iterator = tqdm(questions, desc="Clasificando preguntas") if show_progress else questions
        
        for question in iterator:
            try:
                # Obtener texto y materia
                text = question.get('content', '')
                subject = question.get('subject', 'ALL')
                options = question.get('options', [])
                
                # Clasificar
                classification = self.classify_question(text, subject, options)
                
                # Agregar clasificación a la pregunta
                question['ai_classification'] = classification
                question['area_tematica'] = classification['area_tematica']
                question['tema'] = classification['tema']
                question['habilidad'] = classification['habilidad']
                question['classification_confidence'] = classification['overall_confidence']
                
                classified_questions.append(question)
                
            except Exception as e:
                logger.error(f"Error clasificando pregunta {question.get('id', 'unknown')}: {e}")
                question['ai_classification'] = {'error': str(e)}
                classified_questions.append(question)
                
            # Pequeña pausa para no sobrecargar
            time.sleep(0.1)
            
        return classified_questions
        
    def get_taxonomy_summary(self) -> Dict[str, any]:
        """
        Obtiene un resumen de la taxonomía disponible
        
        Returns:
            Diccionario con resumen de materias, áreas y temas
        """
        summary = {
            'total_subjects': len(self.subjects),
            'subjects': self.subjects,
            'areas_by_subject': {}
        }
        
        for subject in self.subjects:
            areas = self.areas_by_subject.get(subject, [])
            summary['areas_by_subject'][subject] = {
                'total_areas': len(areas),
                'areas': areas,
                'total_temas': sum(len(self.temas_by_area.get(f"{subject}_{area}", [])) 
                                 for area in areas)
            }
            
        return summary


def main():
    """Función principal para pruebas"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clasificador de preguntas PAES")
    parser.add_argument("--test", action="store_true", help="Ejecutar prueba simple")
    parser.add_argument("--summary", action="store_true", help="Mostrar resumen del temario")
    
    args = parser.parse_args()
    
    # Inicializar clasificador
    classifier = TaxonomyClassifier()
    
    if args.summary:
        summary = classifier.get_taxonomy_summary()
        print("\n📚 Resumen del Temario PAES:")
        print(f"Total de materias: {summary['total_subjects']}")
        for subject, info in summary['areas_by_subject'].items():
            print(f"\n{subject}:")
            print(f"  - Áreas temáticas: {info['total_areas']}")
            print(f"  - Total de temas: {info['total_temas']}")
            
    if args.test:
        # Pregunta de ejemplo
        test_question = {
            'content': "¿Cuál es la derivada de la función f(x) = x² + 3x - 5?",
            'subject': 'M2',
            'options': ["2x + 3", "x² + 3", "2x - 5", "x + 3"]
        }
        
        print("\n🧪 Prueba de clasificación:")
        print(f"Pregunta: {test_question['content']}")
        
        result = classifier.classify_question(
            test_question['content'],
            test_question['subject'],
            test_question['options']
        )
        
        print(f"\nResultados:")
        print(f"  - Área temática: {result['area_tematica']} ({result['area_confidence']:.2%})")
        print(f"  - Tema: {result['tema']} ({result['tema_confidence']:.2%})")
        print(f"  - Habilidad: {result['habilidad']} ({result['habilidad_confidence']:.2%})")
        print(f"  - Confianza general: {result['overall_confidence']:.2%}")


if __name__ == "__main__":
    main()