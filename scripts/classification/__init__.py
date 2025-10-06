"""
Classification Module for PAES Questions
========================================

Este módulo proporciona clasificación automática de preguntas PAES usando IA:
- Clasificación por área temática
- Clasificación por tema específico  
- Identificación de habilidades requeridas
"""

from .taxonomy_classifier import TaxonomyClassifier

__all__ = ['TaxonomyClassifier']