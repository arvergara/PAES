#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to review and correct Chilean history PAES questions
"""

import json
import re
from typing import Dict, List, Tuple

def get_correct_answer_and_explanation(question: Dict) -> Tuple[str, str]:
    """
    Analyze a question and return the correct answer and explanation.
    Returns: (correct_answer_letter, explanation_text)
    """

    texto = question['texto']
    alternativas = question['alternativas']
    current_answer = question['correcta']

    # Map alternative letters to text
    alt_dict = {}
    for alt in alternativas:
        letter = alt[0]
        text = alt.split(') ', 1)[1] if ') ' in alt else alt[1:]
        alt_dict[letter] = text.strip()

    # Question-specific analysis
    q_id = question['id']

    # Question H_combined_001: Centenario 1910 - social problems
    if 'centenario de la Independencia' in texto and '626.' in texto:
        # The context is 1910, during Parliamentary Republic
        # The contrast was health problems (cuestión social)
        return 'A', 'Durante el centenario de 1910, mientras el discurso oficial celebraba el progreso, Chile enfrentaba graves problemas de salubridad pública como parte de la "cuestión social", con epidemias, hacinamiento en conventillos y precarias condiciones higiénicas en las ciudades. Esta contradicción fue denunciada por intelectuales como Luis Emilio Recabarren y Alejandro Venegas.'

    # Question H_combined_002: E-waste to Africa
    elif 'residuos llegan todos los meses a países pobres de África' in texto:
        # This is about externalizing environmental damage
        return 'A', 'La práctica descrita evidencia la externalización del deterioro ambiental, donde países desarrollados del Primer Mundo trasladan sus desechos tecnológicos a naciones pobres, evitando así los costos ambientales y sanitarios de su procesamiento. Esto refleja un patrón de injusticia ambiental en el sistema económico global.'

    # Question H_combined_003: Railway network in 19th century Chile
    elif 'extensión de la red ferroviaria' in texto and 'segunda mitad del siglo XIX' in texto:
        # Railways connected production centers to ports
        return 'A', 'El principal propósito de la red ferroviaria chilena en el siglo XIX fue unir centros productivos (minas, haciendas) con ciudades y puertos para facilitar el comercio. Esto permitió la exportación eficiente de productos mineros como el salitre y el cobre, y dinamizó el mercado interno conectando regiones productoras con consumidoras.'

    # Question H_combined_004: Estado docente (State education)
    elif 'Estado docente' in texto and 'segunda mitad del siglo XIX' in texto:
        # Estado docente means state takes leading role in education
        return 'A', 'El Estado docente implicó que el Estado asumiera un papel protagónico en educación, desde la planificación de programas hasta la implementación en escuelas y liceos. Este modelo buscaba formar ciudadanos con valores nacionales comunes, laicos y científicos, marcando una diferencia con la educación religiosa tradicional.'

    # Question H_combined_005: WWI debts to USA
    elif 'DEUDAS EUROPEAS CON ESTADOS UNIDOS, 1919' in texto:
        # US became creditor nation, strengthening its economy
        return 'C', 'El otorgamiento de créditos por parte de Estados Unidos a los países aliados durante la Primera Guerra Mundial fortaleció enormemente su economía, transformándolo de nación deudora a principal acreedor mundial. Esto consolidó su posición como nueva potencia económica global, desplazando la hegemonía británica.'

    # Question H_combined_006: Criticism of international human rights
    elif 'detractores al establecimiento de estos derechos' in texto:
        # Main criticism is sovereignty concerns
        return 'C', 'Una de las principales críticas al derecho internacional de derechos humanos es que amenaza la soberanía nacional, ya que organismos supranacionales pueden intervenir en asuntos internos de los Estados. Los detractores argumentan que esto limita la autonomía de las naciones para definir sus propias leyes y políticas.'

    # Question H_combined_007: DC and UP governments difficulty
    elif 'Democracia Cristiana (1964-1970) y de la Unidad Popular (1970-1973)' in texto:
        # Both faced strong political polarization
        return 'C', 'Tanto el gobierno de Eduardo Frei Montalva (DC) como el de Salvador Allende (UP) enfrentaron una fuerte polarización política en la sociedad chilena. Esta división ideológica entre izquierda, centro y derecha dificultó la implementación de reformas estructurales y generó conflictos que culminaron en la crisis de 1973.'

    # Question H_combined_008: Reducing global warming
    elif 'reducir el calentamiento global' in texto and 'gases de efecto invernadero' in texto:
        # Reducing fossil fuels is direct measure
        return 'D', 'La reducción de combustibles fósiles (petróleo, carbón, gas) contribuye directamente a disminuir las emisiones de gases de efecto invernadero, principal causa del calentamiento global. Al quemar estos combustibles se libera CO2 a la atmósfera, por lo que su reducción es fundamental para cumplir metas climáticas.'

    # Question H_combined_009: Araucanía occupation strategy
    elif 'ocupación de la Araucanía' in texto and 'siglo XIX' in texto:
        # Reducciones were used to consolidate territory
        return 'A', 'El establecimiento de reducciones indígenas fue una estrategia clave del Estado chileno para consolidar la ocupación de la Araucanía. Estas reducciones concentraban a las comunidades mapuches en territorios limitados, permitiendo la colonización del resto de las tierras por colonos chilenos y extranjeros, desarticulando así la organización territorial mapuche.'

    # Question H_combined_010: Freedom of association poster
    elif 'libertad de asociación' in texto and 'afiches' in texto:
        # Unionization relates to freedom of association
        return 'A', 'La libertad de asociación se refiere al derecho de las personas a organizarse colectivamente. "La sindicalización nos hace más fuertes" es un título adecuado porque los sindicatos son organizaciones que ejercen este derecho, permitiendo a trabajadores asociarse libremente para defender sus intereses comunes.'

    # Question H_combined_011: Welfare State after WWII
    elif 'Estado de Bienestar' in texto and 'Segunda Guerra Mundial' in texto:
        # Welfare state implied expansion of public spending
        return 'A', 'El modelo de Estado de Bienestar implicó la expansión del gasto fiscal para financiar programas sociales (salud, educación, pensiones), infraestructura pública y políticas de pleno empleo. Este aumento del gasto estatal buscaba garantizar derechos sociales y reducir desigualdades mediante la intervención activa del Estado en la economía.'

    # Question H_combined_012: End of Binomial system
    elif 'Sistema Binominal' in texto and 'Modelo Proporcional Inclusivo' in texto:
        # The goal was to distribute power in more than 2 coalitions
        return 'B', 'El sistema binominal favorecía a dos grandes coaliciones políticas, excluyendo a fuerzas minoritarias. La motivación principal para cambiarlo fue distribuir el poder político en más de dos coaliciones, permitiendo una representación más proporcional y diversa que reflejara mejor el pluralismo político de la sociedad chilena.'

    # Question H_combined_013: Chilean measures against discrimination
    elif 'discriminación homofóbica' in texto and 'Estado chileno' in texto:
        # Chile has promoted anti-discrimination laws
        return 'B', 'El Estado chileno ha promulgado leyes y normativas que establecen explícitamente la no discriminación por orientación sexual, como la Ley Antidiscriminación (Ley Zamudio) de 2012. Estas normativas sancionan actos discriminatorios y buscan proteger a las minorías sexuales en diversos ámbitos, incluido el educativo.'

    # Question H_combined_014: Post-WWII economic boom impact
    elif 'extraordinaria aceleraci n del crecimiento económico' in texto and 'Tony Judt' in texto:
        # Led to welfare state strengthening
        return 'C', 'El auge económico posterior a la Segunda Guerra Mundial permitió el fortalecimiento de un modelo de Estado capitalista con fuerte inversión en beneficios sociales. Los gobiernos occidentales usaron la prosperidad para financiar sistemas de salud, educación y seguridad social universales, creando el Estado de Bienestar europeo.'

    # Question H_combined_015: Free market principles
    elif 'economía de libre mercado' in texto and 'principios básicos' in texto:
        # Self-regulation through supply and demand
        return 'E', 'La autorregulación del mercado mediante la oferta y la demanda es un principio fundamental de la economía de libre mercado. Este mecanismo permite que los precios se ajusten automáticamente según la disponibilidad de productos (oferta) y el interés de los consumidores (demanda), sin intervención estatal directa.'

    # Question H_combined_016: African decolonization and socialism
    elif 'Frantz Fanon' in texto and 'descolonización africana' in texto:
        # Fanon argues socialism would allow more stable coexistence
        return 'C', 'Frantz Fanon plantea que la ideología socialista permitiría una convivencia más estable para los nuevos estados africanos, al haber eliminado rivalidades territoriales en Europa Oriental. El autor sugiere que el socialismo podría ofrecer un modelo de organización que evitara los conflictos nacionalistas que caracterizaron al colonialismo europeo.'

    # Question H_combined_017: 19th century imperialism economic aspects
    elif 'imperialismo' in texto and 'fines del siglo XIX' in texto:
        # Unequal exchange between metropolis and colonies
        return 'D', 'Las relaciones de intercambio desigual entre metrópolis y colonias fue característica central del imperialismo. Las colonias proporcionaban materias primas baratas y mercados cautivos para productos manufacturados de las metrópolis, generando una relación económica asimétrica que beneficiaba sistemáticamente a las potencias colonizadoras.'

    # Question H_combined_018: Road concessions in 1990s Chile
    elif 'sistema de concesiones' in texto and 'década de 1990' in texto:
        # Goal was to improve communication infrastructure
        return 'B', 'La política de concesiones viales de los años 90 tuvo como finalidad principal impulsar el mejoramiento de vías de comunicación para facilitar el traslado de bienes y personas. Esto buscaba modernizar la infraestructura del país sin comprometer recursos fiscales directos, utilizando inversión privada para expandir y mejorar la red de carreteras.'

    # Question H_combined_019: 1929 crisis impact on Latin America
    elif 'crisis económica de 1929' in texto and 'países latinoamericanos' in texto:
        # Dependence on world market fluctuations
        return 'E', 'Los países latinoamericanos experimentaron un impacto profundo de la crisis de 1929 debido a su dependencia de las fluctuaciones del mercado mundial. Sus economías exportadoras de materias primas dependían de la demanda externa, especialmente estadounidense, por lo que la caída de precios y demanda internacional los afectó severamente.'

    # Question H_combined_020: Citizen control of public authorities
    elif 'control del ejercicio de la función pública' in texto:
        # NGO requesting data from Transparency Council
        return 'D', 'La solicitud de una ONG al Consejo para la Transparencia evidencia un mecanismo de control ciudadano sobre autoridades públicas. La Ley de Transparencia permite a organizaciones y ciudadanos acceder a información sobre gestión pública, ejerciendo así un control democrático sobre las acciones de los funcionarios y ministerios del Estado.'

    # Question H_combined_021: Chilean imports in 2000
    elif '2000' in texto and 'importaciones nacionales' in texto:
        # List shows diversity of transport products
        return 'D', 'El listado de importaciones de 2000 muestra diversidad de productos para transporte, incluyendo automóviles, vehículos de mercancía, camionetas y autobuses. Esta variedad refleja la demanda del mercado chileno por diferentes tipos de vehículos para satisfacer necesidades de transporte personal, comercial y público.'

    # Question H_combined_022: Industrial establishments Santiago 1870-1894
    elif 'ESTABLECIMIENTOS INDUSTRIALES EN SANTIAGO' in texto and '1870-1894' in texto:
        # I and II are correct - acceleration after Pacific War and stimulation from saltpeter
        return 'D', 'Las afirmaciones I y II son correctas: la creación de industrias se aceleró tras la Guerra del Pacífico (1879-1884) y la actividad fabril fue estimulada por la riqueza salitrera. Los ingresos del salitre permitieron inversión en infraestructura y consumo, dinamizando la industrialización de Santiago en las últimas décadas del siglo XIX.'

    # Question H_combined_023: OECD and greenhouse gas emissions
    elif 'OCDE' in texto and 'gases de efecto invernadero' in texto:
        # Increase clean energy generation
        return 'E', 'Aumentar la generación de energía a partir de fuentes limpias (solar, eólica, hidroeléctrica) es una iniciativa clave para reducir emisiones de gases de efecto invernadero. Chile, como miembro de la OCDE, debe transitar desde combustibles fósiles hacia energías renovables para cumplir compromisos climáticos internacionales.'

    # Question H_combined_024: Ferrocarril Trasandino 1872-1910
    elif 'Ferrocarril Trasandino' in texto and '1872 y 1910' in texto:
        # Diplomatic agreements in border disputes context
        return 'C', 'Los acuerdos diplomáticos en el contexto de las controversias fronterizas entre Chile y Argentina fueron fundamentales para concretar el Ferrocarril Trasandino. El Tratado de 1881 y posteriores acuerdos limítrofes crearon condiciones de cooperación que permitieron esta obra binacional de integración comercial.'

    # If we don't have specific analysis, keep current answer but flag it
    return current_answer, 'Explanation TBD - NEEDS REVIEW'


def process_questions(input_file: str, output_file: str) -> Dict:
    """
    Process all questions in the file and return statistics.
    """

    print(f"Loading questions from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_questions = len(data['preguntas'])
    answers_changed = 0
    explanations_added = 0
    uncertain_questions = []

    print(f"Processing {total_questions} questions...")

    for i, question in enumerate(data['preguntas'], 1):
        if i % 50 == 0:
            print(f"  Processed {i}/{total_questions} questions...")

        old_answer = question['correcta']
        new_answer, explanation = get_correct_answer_and_explanation(question)

        # Update answer if different
        if new_answer != old_answer:
            question['correcta'] = new_answer
            answers_changed += 1

        # Update explanation if we have one
        if explanation != 'Explanation TBD':
            if 'NEEDS REVIEW' in explanation:
                uncertain_questions.append({
                    'id': question['id'],
                    'texto': question['texto'][:100] + '...',
                    'current_answer': new_answer
                })
            else:
                question['explicacion'] = explanation
                explanations_added += 1

    # Save corrected file
    print(f"\nSaving corrected questions to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    stats = {
        'total_questions': total_questions,
        'answers_changed': answers_changed,
        'explanations_added': explanations_added,
        'uncertain_questions': uncertain_questions
    }

    return stats


if __name__ == '__main__':
    input_file = '/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json'
    output_file = input_file  # Overwrite original

    stats = process_questions(input_file, output_file)

    print("\n" + "="*60)
    print("PROCESSING COMPLETE")
    print("="*60)
    print(f"Total questions reviewed: {stats['total_questions']}")
    print(f"Answers changed: {stats['answers_changed']}")
    print(f"Explanations added: {stats['explanations_added']}")
    print(f"Uncertain questions: {len(stats['uncertain_questions'])}")

    if stats['uncertain_questions']:
        print("\nQuestions needing manual review:")
        for q in stats['uncertain_questions'][:10]:  # Show first 10
            print(f"  - {q['id']}: {q['texto']}")
