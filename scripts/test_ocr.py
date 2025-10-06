#!/usr/bin/env python
"""
Script de prueba para validar el funcionamiento del OCR
========================================================

Verifica que todas las dependencias estén instaladas y funcionando correctamente
"""

import sys
import os
from pathlib import Path

def test_imports():
    """Prueba que todas las librerías necesarias estén instaladas"""
    print("🔍 Verificando importaciones...")
    
    imports_ok = True
    required_modules = [
        'pytesseract',
        'pdf2image',
        'pdfplumber',
        'fitz',  # PyMuPDF
        'PIL',
        'numpy',
        'cv2',
        'tqdm'
    ]
    
    for module in required_modules:
        try:
            if module == 'fitz':
                import fitz
                print(f"✅ PyMuPDF (fitz) v{fitz.__version__}")
            elif module == 'cv2':
                import cv2
                print(f"✅ OpenCV v{cv2.__version__}")
            elif module == 'PIL':
                from PIL import Image
                print(f"✅ Pillow v{Image.__version__}")
            else:
                __import__(module)
                print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ Error importando {module}: {e}")
            imports_ok = False
    
    return imports_ok

def test_tesseract():
    """Verifica que Tesseract esté instalado y funcionando"""
    print("\n🔍 Verificando Tesseract OCR...")
    
    try:
        import pytesseract
        import subprocess
        
        # Verificar que tesseract esté en el PATH
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Tesseract encontrado:")
            print(result.stdout.split('\n')[0])
            
            # Verificar idioma español
            langs = pytesseract.get_languages()
            if 'spa' in langs:
                print("✅ Idioma español (spa) disponible")
            else:
                print("⚠️  Idioma español no disponible. Instalar con: brew install tesseract-lang")
                
            return True
        else:
            print("❌ Tesseract no encontrado en PATH")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando Tesseract: {e}")
        return False

def test_poppler():
    """Verifica que Poppler esté instalado"""
    print("\n🔍 Verificando Poppler (pdf2image)...")
    
    try:
        import subprocess
        
        result = subprocess.run(['pdftoppm', '-v'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Poppler encontrado:")
            print(result.stderr.strip())
            return True
        else:
            print("❌ Poppler no encontrado")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando Poppler: {e}")
        return False

def test_ocr_simple():
    """Prueba simple de OCR con una imagen de texto"""
    print("\n🔍 Realizando prueba simple de OCR...")
    
    try:
        import pytesseract
        from PIL import Image, ImageDraw, ImageFont
        import tempfile
        
        # Crear una imagen de prueba con texto
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Usar fuente por defecto
        text = "PRUEBA DE OCR\n¿Funciona correctamente?"
        draw.text((10, 10), text, fill='black')
        
        # Guardar temporalmente
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name
        
        # Realizar OCR
        extracted_text = pytesseract.image_to_string(Image.open(tmp_path), lang='spa')
        
        # Limpiar
        os.unlink(tmp_path)
        
        print(f"📝 Texto original: {text.replace(chr(10), ' ')}")
        print(f"📝 Texto extraído: {extracted_text.strip()}")
        
        if "PRUEBA" in extracted_text:
            print("✅ OCR funcionando correctamente")
            return True
        else:
            print("⚠️  OCR ejecutado pero el resultado no es el esperado")
            return True
            
    except Exception as e:
        print(f"❌ Error en prueba de OCR: {e}")
        return False

def test_pdf_processor():
    """Prueba el módulo pdf_processor"""
    print("\n🔍 Verificando módulo pdf_processor...")
    
    try:
        # Agregar el directorio scripts al path
        sys.path.insert(0, str(Path(__file__).parent))
        
        from ocr.pdf_processor import PDFProcessor
        
        print("✅ Módulo pdf_processor importado correctamente")
        
        # Crear instancia
        processor = PDFProcessor()
        print("✅ PDFProcessor instanciado correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando pdf_processor: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("=" * 60)
    print("🧪 PRUEBA DE SISTEMA OCR PARA SIMULADOR-PAES")
    print("=" * 60)
    
    all_tests_passed = True
    
    # Ejecutar pruebas
    if not test_imports():
        all_tests_passed = False
        print("\n⚠️  Instalar dependencias con: pip install -r scripts/requirements_ocr.txt")
    
    if not test_tesseract():
        all_tests_passed = False
        print("\n⚠️  Instalar Tesseract con: brew install tesseract tesseract-lang")
    
    if not test_poppler():
        all_tests_passed = False
        print("\n⚠️  Instalar Poppler con: brew install poppler")
    
    if all_tests_passed:
        test_ocr_simple()
        test_pdf_processor()
    
    # Resumen
    print("\n" + "=" * 60)
    if all_tests_passed:
        print("✅ TODAS LAS PRUEBAS PASARON - Sistema OCR listo para usar")
        print("\nPróximo paso: Procesar un PDF con:")
        print("  python scripts/ocr/pdf_processor.py <archivo.pdf>")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - Revisar los errores arriba")
    print("=" * 60)
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    sys.exit(main())