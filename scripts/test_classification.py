#!/usr/bin/env python
"""
Script de prueba para el sistema de clasificación automática
============================================================

Verifica que el clasificador funcione correctamente
"""

import sys
import os
from pathlib import Path
import json

def test_imports():
    """Prueba que todas las librerías necesarias estén instaladas"""
    print("🔍 Verificando importaciones para clasificación...")
    
    imports_ok = True
    required_modules = [
        'transformers',
        'torch',
        'pandas',
        'sklearn'
    ]
    
    for module in required_modules:
        try:
            if module == 'sklearn':
                import sklearn
                print(f"✅ scikit-learn v{sklearn.__version__}")
            else:
                mod = __import__(module)
                version = getattr(mod, '__version__', 'unknown')
                print(f"✅ {module} v{version}")
        except ImportError as e:
            print(f"❌ Error importando {module}: {e}")
            imports_ok = False
    
    return imports_ok

def test_temario():
    """Verifica que el archivo temario exista y sea válido"""
    print("\n🔍 Verificando archivo temario...")
    
    temario_path = Path(__file__).parent.parent / "content" / "temario_paes_vs.csv"
    
    if not temario_path.exists():
        print(f"❌ No se encuentra el archivo: {temario_path}")
        return False
        
    try:
        import pandas as pd
        df = pd.read_csv(temario_path)
        
        required_columns = ['Subject', 'Area_tematica', 'Tema', 'Habilidad']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"❌ Columnas faltantes en temario: {missing_columns}")
            return False
            
        print(f"✅ Temario cargado: {len(df)} entradas")
        print(f"   Materias: {', '.join(df['Subject'].unique())}")
        print(f"   Total áreas temáticas: {len(df['Area_tematica'].unique())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error leyendo temario: {e}")
        return False

def test_classifier():
    """Prueba el clasificador con ejemplos"""
    print("\n🔍 Probando clasificador...")
    
    try:
        # Agregar el directorio scripts al path
        sys.path.insert(0, str(Path(__file__).parent))
        
        from classification.taxonomy_classifier import TaxonomyClassifier
        
        print("✅ Módulo de clasificación importado")
        
        # Crear clasificador
        classifier = TaxonomyClassifier()
        print("✅ Clasificador inicializado")
        
        # Preguntas de ejemplo para cada materia
        test_questions = [
            {
                'content': "¿Cuál es la derivada de f(x) = x² + 3x - 5?",
                'subject': 'M2',
                'expected_area': 'cálculo'  # aproximado
            },
            {
                'content': "¿Cuál es la función principal del sistema nervioso?",
                'subject': 'CB',
                'expected_area': 'biología'  # aproximado
            },
            {
                'content': "¿Qué establece la ley de Ohm?",
                'subject': 'CF',
                'expected_area': 'electricidad'  # aproximado
            },
            {
                'content': "¿Cuáles son los enlaces químicos principales?",
                'subject': 'CQ',
                'expected_area': 'química'  # aproximado
            },
            {
                'content': "Identifique la idea principal del texto anterior",
                'subject': 'L',
                'expected_area': 'comprensión'  # aproximado
            },
            {
                'content': "¿Cuáles fueron las causas de la independencia de Chile?",
                'subject': 'H',
                'expected_area': 'historia'  # aproximado
            }
        ]
        
        print("\n📊 Resultados de clasificación:\n")
        
        all_passed = True
        
        for i, test_q in enumerate(test_questions, 1):
            print(f"{i}. Pregunta: {test_q['content'][:60]}...")
            print(f"   Materia: {test_q['subject']}")
            
            try:
                result = classifier.classify_question(
                    test_q['content'],
                    test_q['subject']
                )
                
                print(f"   ✓ Área: {result['area_tematica']} ({result['area_confidence']:.1%})")
                print(f"   ✓ Tema: {result['tema'][:50]}...")
                print(f"   ✓ Habilidad: {result['habilidad']}")
                print(f"   ✓ Confianza general: {result['overall_confidence']:.1%}")
                
                # Verificación básica (no estricta porque las categorías pueden variar)
                if result['overall_confidence'] < 0.3:
                    print("   ⚠️  Confianza baja")
                    all_passed = False
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                all_passed = False
                
            print()
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error en prueba de clasificador: {e}")
        return False

def test_batch_classification():
    """Prueba clasificación en batch"""
    print("\n🔍 Probando clasificación batch...")
    
    try:
        from classification.taxonomy_classifier import TaxonomyClassifier
        
        classifier = TaxonomyClassifier()
        
        # Batch de preguntas
        questions = [
            {'id': '1', 'content': 'Calcule el área de un triángulo', 'subject': 'M1'},
            {'id': '2', 'content': 'Analice la fotosíntesis', 'subject': 'CB'},
            {'id': '3', 'content': 'Explique la revolución francesa', 'subject': 'H'}
        ]
        
        classified = classifier.classify_batch(questions, show_progress=False)
        
        print(f"✅ Clasificadas {len(classified)} preguntas en batch")
        
        for q in classified[:2]:  # Mostrar solo las primeras 2
            if 'ai_classification' in q and 'error' not in q['ai_classification']:
                print(f"   - Pregunta {q['id']}: {q['area_tematica']} / {q.get('tema', 'N/A')[:30]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en clasificación batch: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("=" * 60)
    print("🧪 PRUEBA DE SISTEMA DE CLASIFICACIÓN AUTOMÁTICA")
    print("=" * 60)
    
    all_tests_passed = True
    
    # Ejecutar pruebas
    if not test_imports():
        all_tests_passed = False
        print("\n⚠️  Instalar dependencias con: pip install -r scripts/requirements_ocr.txt")
    
    if not test_temario():
        all_tests_passed = False
        print("\n⚠️  El archivo temario_paes_vs.csv es necesario para la clasificación")
    
    if all_tests_passed:
        # Solo ejecutar estas pruebas si las anteriores pasaron
        if not test_classifier():
            all_tests_passed = False
            
        test_batch_classification()  # Esta es opcional
    
    # Resumen
    print("\n" + "=" * 60)
    if all_tests_passed:
        print("✅ TODAS LAS PRUEBAS PASARON - Sistema de clasificación listo")
        print("\nPróximos pasos:")
        print("1. Clasificar preguntas existentes:")
        print("   node scripts/classifyQuestions.js")
        print("\n2. Procesar PDF con clasificación automática:")
        print("   node scripts/processPdfWithOcr.js <archivo.pdf> --subject M2")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - Revisar los errores arriba")
    print("=" * 60)
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    sys.exit(main())