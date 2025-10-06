"""
PDF Processor with OCR and Image Extraction
==========================================

Adaptado de TUPAES para simulador-paes
Extrae preguntas, texto e imágenes de PDFs PAES

Características:
- OCR con Tesseract para texto
- Extracción de imágenes con PyMuPDF
- Detección de tablas con pdfplumber
- Asociación pregunta-imagen por proximidad
"""

import os
import re
import sys
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import logging

import pytesseract
from pdf2image import convert_from_path
import pdfplumber
import fitz  # PyMuPDF
from PIL import Image
import io
from tqdm import tqdm

# Permitir importar módulos hermanos (classification, etc.) cuando se ejecuta como script
CURRENT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = CURRENT_DIR.parent
PROJECT_ROOT = SCRIPTS_DIR.parent
for candidate in (SCRIPTS_DIR, PROJECT_ROOT):
    if str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

try:
    from classification.taxonomy_classifier import TaxonomyClassifier
except ImportError:  # pragma: no cover - fallback para ejecuciones empaquetadas
    TaxonomyClassifier = None

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PDFProcessor:
    """Procesador principal de PDFs con OCR y extracción de imágenes"""
    
    # Patrones regex para detectar preguntas y opciones
    QUESTION_REGEX = re.compile(r"^(\d{1,3})\.\s+(.*)$", re.DOTALL)
    OPTION_REGEX = re.compile(r"^[A-E]\)\s+(.*)$")
    
    def __init__(self, output_dir: str = "./output", temp_dir: str = "./temp/images"):
        """
        Inicializa el procesador
        
        Args:
            output_dir: Directorio para guardar resultados
            temp_dir: Directorio temporal para imágenes
        """
        self.output_dir = Path(output_dir)
        self.temp_dir = Path(temp_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
    def process_pdf(
        self,
        pdf_path: str,
        subject: Optional[str] = None,
        skip_pages: int = 0,
        auto_classify: bool = False,
        classifier_kwargs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Procesa un PDF completo extrayendo texto, preguntas e imágenes
        
        Args:
            pdf_path: Ruta al archivo PDF
            subject: Código de materia (M1, M2, L, H, CB, CF, CQ)
            skip_pages: Número de páginas iniciales a omitir
            
        Returns:
            Diccionario con preguntas, imágenes y metadatos
        """
        pdf_path = Path(pdf_path)
        logger.info(f"Procesando PDF: {pdf_path.name}")
        
        # Crear subdirectorio para este PDF
        pdf_output_dir = self.output_dir / pdf_path.stem
        pdf_output_dir.mkdir(exist_ok=True)
        
        # Extraer texto con OCR
        logger.info("Extrayendo texto con OCR...")
        text_data = self._extract_text_ocr(pdf_path, skip_pages)
        
        # Extraer imágenes
        logger.info("Extrayendo imágenes...")
        images = self._extract_images(pdf_path, pdf_output_dir / "images", skip_pages)
        
        # Extraer tablas
        logger.info("Extrayendo tablas...")
        tables = self._extract_tables(pdf_path, skip_pages)
        
        # Parsear preguntas del texto
        logger.info("Parseando preguntas...")
        questions = self._parse_questions(text_data)

        if auto_classify and not subject:
            logger.warning("auto_classify está activo pero no se proporcionó subject; se omitirá la clasificación")
            auto_classify = False

        if auto_classify:
            self._apply_classification(
                questions,
                subject,
                classifier_kwargs or {}
            )
        
        # Asociar imágenes con preguntas
        logger.info("Asociando imágenes con preguntas...")
        questions = self._associate_images_to_questions(questions, images, text_data)
        
        # Generar resultado
        result = {
            "pdf_name": pdf_path.name,
            "subject": subject,
            "total_pages": len(text_data),
            "total_questions": len(questions),
            "total_images": len(images),
            "total_tables": len(tables),
            "questions": questions,
            "images": images,
            "tables": tables,
            "metadata": {
                "processed_date": str(Path.ctime(Path())),
                "skip_pages": skip_pages,
                "subject": subject,
                "auto_classified": auto_classify
            }
        }
        
        # Guardar resultados
        output_file = pdf_output_dir / "preguntas.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Procesamiento completado. Resultados en: {output_file}")
        
        return result
    
    def _extract_text_ocr(self, pdf_path: Path, skip_pages: int = 0) -> List[Dict[str, Any]]:
        """Extrae texto usando OCR con información de página"""
        pages_data = []
        
        # Convertir PDF a imágenes
        pages = convert_from_path(str(pdf_path), dpi=300)
        
        for i, page_img in enumerate(tqdm(pages, desc="Procesando páginas con OCR")):
            if i < skip_pages:
                continue
                
            # OCR en español
            text = pytesseract.image_to_string(page_img, lang='spa')
            
            # También obtener datos con coordenadas para mejor asociación
            data = pytesseract.image_to_data(page_img, lang='spa', output_type=pytesseract.Output.DICT)
            
            pages_data.append({
                'page_num': i,
                'text': text,
                'words_data': data,
                'page_height': page_img.height,
                'page_width': page_img.width
            })
            
        return pages_data
    
    def _extract_images(self, pdf_path: Path, output_dir: Path, skip_pages: int = 0) -> List[Dict[str, Any]]:
        """Extrae imágenes del PDF con sus coordenadas"""
        output_dir.mkdir(parents=True, exist_ok=True)
        images_info = []
        
        try:
            doc = fitz.open(str(pdf_path))
            
            for page_num, page in enumerate(doc):
                if page_num < skip_pages:
                    continue
                    
                image_list = page.get_images(full=True)
                
                if not image_list:
                    continue
                    
                logger.info(f"Página {page_num}: {len(image_list)} imágenes encontradas")
                
                for img_index, img in enumerate(image_list):
                    try:
                        # Extraer imagen
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Verificar tamaño mínimo
                        image_pil = Image.open(io.BytesIO(image_bytes))
                        width, height = image_pil.size
                        
                        if width < 50 or height < 50:
                            continue
                            
                        # Obtener coordenadas
                        rect = page.get_image_bbox(img)
                        
                        # Guardar imagen
                        image_ext = base_image["ext"]
                        image_name = f"page_{page_num}_img_{img_index}.{image_ext}"
                        image_path = output_dir / image_name
                        
                        with open(image_path, "wb") as f:
                            f.write(image_bytes)
                            
                        # Registrar información
                        images_info.append({
                            "id": str(uuid.uuid4()),
                            "page": page_num,
                            "filename": image_name,
                            "path": str(image_path),
                            "coordinates": {
                                "x0": rect.x0,
                                "y0": rect.y0,
                                "x1": rect.x1,
                                "y1": rect.y1,
                                "center_y": (rect.y0 + rect.y1) / 2
                            },
                            "size": {
                                "width": width,
                                "height": height
                            },
                            "type": self._classify_image_type(width, height)
                        })
                        
                    except Exception as e:
                        logger.error(f"Error procesando imagen {img_index} en página {page_num}: {e}")
                        
            doc.close()
            
        except Exception as e:
            logger.error(f"Error extrayendo imágenes: {e}")
            
        return images_info
    
    def _extract_tables(self, pdf_path: Path, skip_pages: int = 0) -> List[Dict[str, Any]]:
        """Extrae tablas del PDF usando pdfplumber"""
        tables_info = []
        
        try:
            with pdfplumber.open(str(pdf_path)) as pdf:
                for i, page in enumerate(pdf.pages):
                    if i < skip_pages:
                        continue
                        
                    tables = page.extract_tables()
                    
                    for j, table in enumerate(tables):
                        if table and len(table) > 1:  # Verificar que la tabla tenga contenido
                            tables_info.append({
                                "id": str(uuid.uuid4()),
                                "page": i,
                                "table_index": j,
                                "rows": len(table),
                                "cols": len(table[0]) if table[0] else 0,
                                "content": table
                            })
                            
        except Exception as e:
            logger.error(f"Error extrayendo tablas: {e}")
            
        return tables_info
    
    def _parse_questions(self, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parsea preguntas del texto extraído"""
        questions = []
        current_question = None
        question_counter = 0
        
        for page_data in pages_data:
            page_num = page_data['page_num']
            text = page_data['text']
            
            # Dividir en bloques por líneas vacías
            blocks = [b.strip() for b in text.split('\n\n') if b.strip()]
            
            for block in blocks:
                # Buscar inicio de pregunta
                match = self.QUESTION_REGEX.match(block)
                
                if match:
                    # Si había una pregunta anterior, guardarla
                    if current_question:
                        questions.append(current_question)
                        
                    # Crear nueva pregunta
                    num, content = match.groups()
                    question_counter += 1
                    
                    current_question = {
                        "id": str(uuid.uuid4()),
                        "question_number": int(num),
                        "content": content.strip(),
                        "options": [],
                        "page": page_num,
                        "has_visual_content": False,
                        "images": [],
                        "tables": []
                    }
                    
                elif current_question:
                    # Buscar opciones
                    option_match = self.OPTION_REGEX.match(block)
                    
                    if option_match:
                        current_question["options"].append(block.strip())
                    else:
                        # Podría ser continuación del enunciado
                        current_question["content"] += " " + block.strip()
                        
        # Guardar última pregunta
        if current_question:
            questions.append(current_question)
            
        return questions
    
    def _associate_images_to_questions(self, questions: List[Dict], images: List[Dict], 
                                     pages_data: List[Dict]) -> List[Dict]:
        """Asocia imágenes a preguntas basándose en proximidad"""
        
        # Agrupar imágenes por página
        images_by_page = {}
        for img in images:
            page = img['page']
            if page not in images_by_page:
                images_by_page[page] = []
            images_by_page[page].append(img)
            
        # Para cada pregunta, buscar imágenes cercanas
        for question in questions:
            page = question['page']
            
            if page in images_by_page:
                # Las imágenes en la misma página probablemente pertenecen a la pregunta
                page_images = images_by_page[page]
                
                # Simple heurística: si hay pocas preguntas en la página,
                # asociar todas las imágenes a la pregunta
                questions_in_page = [q for q in questions if q['page'] == page]
                
                if len(questions_in_page) == 1:
                    # Solo una pregunta en la página, todas las imágenes son suyas
                    question['images'] = [img['id'] for img in page_images]
                    question['has_visual_content'] = True
                else:
                    # Múltiples preguntas, usar proximidad vertical
                    # (esto es una simplificación, se puede mejorar)
                    question['images'] = []
                    question['has_visual_content'] = len(question['images']) > 0
                    
        return questions
    
    def _classify_image_type(self, width: int, height: int) -> str:
        """Clasifica el tipo de imagen basándose en sus dimensiones"""
        aspect_ratio = width / height if height > 0 else 1
        
        if aspect_ratio > 2 or aspect_ratio < 0.5:
            return "table"  # Muy ancho o muy alto, probablemente una tabla
        elif width > 400 and height > 300:
            return "diagram"  # Imagen grande, probablemente un diagrama
        elif width < 200 and height < 200:
            return "icon"  # Imagen pequeña, probablemente decorativa
        else:
            return "graph"  # Por defecto, asumir gráfico

    def _apply_classification(
        self,
        questions: List[Dict[str, Any]],
        subject: str,
        classifier_kwargs: Dict[str, Any]
    ) -> None:
        """Enriquece preguntas con clasificación taxonómica."""

        if TaxonomyClassifier is None:
            raise RuntimeError(
                "TaxonomyClassifier no disponible. Verifica dependencias en scripts/requirements.txt"
            )

        classifier = TaxonomyClassifier(**classifier_kwargs)

        for question in questions:
            try:
                classification = classifier.classify_question(
                    question_text=question.get("content", ""),
                    subject=subject,
                    options=question.get("options", [])
                )

                question["ai_classification"] = classification
                question["area_tematica"] = classification.get("area_tematica")
                question["tema"] = classification.get("tema")
                question["habilidad"] = classification.get("habilidad")
                question["classification_confidence"] = classification.get("overall_confidence")
            except Exception as exc:  # pragma: no cover - logging defensivo
                logger.error(
                    "Error clasificando pregunta %s: %s",
                    question.get("id", "unknown"),
                    exc,
                )
                question.setdefault("ai_classification", {})
                question["ai_classification"]["error"] = str(exc)


SUBJECT_MAP = {
    "C-biologia": "CB",
    "C-fisica": "CF",
    "C-quimica": "CQ",
    "CB": "CB",
    "CF": "CF",
    "CQ": "CQ",
    "H": "H",
    "L": "L",
    "M": "M1",
    "M1": "M1",
    "M2": "M2",
}


def infer_subject_from_name(pdf_path: Path) -> Optional[str]:
    """Intenta deducir la materia a partir del nombre del archivo."""

    stem = pdf_path.stem
    for prefix, subject in SUBJECT_MAP.items():
        if stem.lower().startswith(prefix.lower()):
            return subject
    return None


def main():
    """CLI flexible para procesar PDFs individuales o por lotes."""
    import argparse

    parser = argparse.ArgumentParser(description="Procesar PDFs PAES con OCR")
    parser.add_argument("pdf", nargs="?", help="Ruta al archivo PDF a procesar")
    parser.add_argument("--subject", help="Código de materia (M1, M2, L, etc.)")
    parser.add_argument("--skip", type=int, default=0, help="Páginas iniciales a omitir")
    parser.add_argument("--output", default="./output", help="Directorio donde guardar resultados")
    parser.add_argument("--input-dir", help="Procesar todos los PDFs en esta carpeta")
    parser.add_argument("--pattern", default="*.pdf", help="Patrón glob para buscar PDFs cuando se usa --input-dir")
    parser.add_argument("--auto-classify", action="store_true", help="Clasificar preguntas automáticamente (requiere subject)")
    parser.add_argument("--temario", default=str(PROJECT_ROOT / "content" / "temario_paes_vs.csv"), help="Ruta al CSV del temario PAES")
    parser.add_argument("--model", default="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli", help="Modelo HuggingFace para clasificación zero-shot")
    parser.add_argument("--device", type=int, default=-1, help="Dispositivo para transformers (-1=CPU, 0=GPU)")

    args = parser.parse_args()

    if not args.pdf and not args.input_dir:
        parser.error("Debe indicar un PDF o un directorio con --input-dir")

    processor = PDFProcessor(output_dir=args.output)

    def process_single(pdf_path: Path, subject_hint: Optional[str]) -> Dict[str, Any]:
        subject = args.subject or subject_hint
        if args.auto_classify and not subject:
            logger.warning("No se pudo inferir la materia para %s; omitiendo clasificación", pdf_path.name)

        classifier_kwargs = None
        if args.auto_classify and subject:
            classifier_kwargs = {
                "temario_path": args.temario,
                "model_name": args.model,
                "device": args.device,
            }

        return processor.process_pdf(
            pdf_path=str(pdf_path),
            subject=subject,
            skip_pages=args.skip,
            auto_classify=args.auto_classify and subject is not None,
            classifier_kwargs=classifier_kwargs,
        )

    summary: List[Tuple[str, Dict[str, Any]]] = []

    if args.input_dir:
        input_dir = Path(args.input_dir)
        pdf_files = sorted(input_dir.glob(args.pattern))
        if not pdf_files:
            logger.warning("No se encontraron PDFs en %s con patrón %s", input_dir, args.pattern)
        for pdf in pdf_files:
            subject_inferred = infer_subject_from_name(pdf)
            logger.info("Procesando %s (subject=%s)", pdf.name, subject_inferred or args.subject)
            result = process_single(pdf, subject_inferred)
            summary.append((pdf.name, result))
    else:
        pdf_path = Path(args.pdf)
        summary.append((pdf_path.name, process_single(pdf_path, infer_subject_from_name(pdf_path))))

    print("\nResumen del procesamiento:")
    for name, result in summary:
        print(f"- {name}: {result['total_questions']} preguntas, {result['total_images']} imágenes, {result['total_tables']} tablas")


if __name__ == "__main__":
    main()
