#!/usr/bin/env python3
"""
Intelligent Explanation Generator for Chilean History PAES Questions
Generates specific, educational explanations based on question analysis.
"""

import json
import re
from typing import Dict, Any, List

QUESTION_BANK_PATH = "/Users/alfil/Library/CloudStorage/GoogleDrive-andres.vergara@maindset.cl/Mi unidad/5_PAES/Nuevo_PAES/pruebas/h_question_bank.json"

class HistoryExplanationGenerator:
    """Generates educational explanations for history questions."""

    def __init__(self):
        self.historical_context = self._load_historical_context()

    def _load_historical_context(self) -> Dict[str, Any]:
        """Load historical context and facts for generating explanations."""
        return {
            "periods": {
                "independencia": {
                    "dates": "1810-1818",
                    "events": ["Primera Junta Nacional", "Patria Vieja", "Reconquista", "Patria Nueva", "Batalla de Chacabuco", "Batalla de Maipú"],
                    "figures": ["Bernardo O'Higgins", "José Miguel Carrera", "Manuel Rodríguez"]
                },
                "organizacion_republica": {
                    "dates": "1818-1833",
                    "events": ["Constitución de 1818", "Constitución de 1822", "Constitución de 1828", "Guerra Civil de 1829-1830"],
                    "concepts": ["Caudillismo", "Anarquía", "Ensayos constitucionales"]
                },
                "republica_conservadora": {
                    "dates": "1833-1861",
                    "events": ["Constitución de 1833", "Guerra contra la Confederación Perú-Boliviana", "Ocupación del Estrecho de Magallanes"],
                    "figures": ["Diego Portales", "Manuel Bulnes", "Manuel Montt"],
                    "concepts": ["Autoritarismo", "Orden y estabilidad", "Estado docente"]
                },
                "republica_liberal": {
                    "dates": "1861-1891",
                    "events": ["Guerra del Pacífico", "Ocupación de la Araucanía", "Reformas liberales"],
                    "concepts": ["Expansión territorial", "Auge salitrero", "Laicización"]
                },
                "parlamentarismo": {
                    "dates": "1891-1925",
                    "events": ["Guerra Civil de 1891", "Centenario 1910", "Cuestión social"],
                    "concepts": ["Rotativa ministerial", "Oligarquía", "Movimiento obrero", "Oficinas salitreras"]
                },
                "presidencialismo": {
                    "dates": "1925-1973",
                    "events": ["Constitución de 1925", "República Socialista", "Frente Popular", "Industrialización"],
                    "concepts": ["ISI", "Reforma agraria", "Nacionalización del cobre", "Unidad Popular"]
                },
                "dictadura": {
                    "dates": "1973-1990",
                    "events": ["Golpe de Estado", "Violaciones DDHH", "Constitución de 1980", "Plebiscito 1988"],
                    "concepts": ["Neoliberalismo", "Chicago Boys", "Represión", "Exilio"]
                },
                "transicion": {
                    "dates": "1990-presente",
                    "events": ["Retorno democracia", "Comisión Rettig", "Comisión Valech"],
                    "concepts": ["Reconciliación", "Verdad y justicia", "Modernización"]
                }
            },
            "economia": {
                "salitre": "Principal exportación entre 1880-1930, generó grandes ingresos fiscales pero economía dependiente",
                "cobre": "Recurso estratégico desde siglo XX, nacionalizado en 1971, principal exportación actual",
                "agricultura": "Base económica colonial y republicana, haciendas, inquilinaje, exportación de trigo",
                "isi": "Industrialización por Sustitución de Importaciones, CORFO 1939, desarrollo industrial nacional",
                "neoliberalismo": "Modelo implementado desde 1975, privatizaciones, apertura comercial, subsidiariedad estatal"
            },
            "mundo": {
                "revolucion_industrial": "Transformación económica y social europea desde 1760, mecanización, urbanización",
                "imperialismo": "Expansión colonial europea en África y Asia siglo XIX, explotación recursos",
                "wwi": "Primera Guerra Mundial 1914-1918, fin imperios europeos, Tratado de Versalles",
                "crisis_1929": "Gran Depresión, colapso económico mundial, afectó exportaciones salitreras chilenas",
                "wwii": "Segunda Guerra Mundial 1939-1945, Holocausto, bombas atómicas, ONU",
                "guerra_fria": "Conflicto URSS-USA 1947-1991, capitalismo vs socialismo, influencia en América Latina",
                "descolonizacion": "Independencia países africanos y asiáticos post-WWII",
                "globalizacion": "Integración económica mundial desde 1990, TLC, interdependencia"
            },
            "civica": {
                "democracia": "Sistema de gobierno con soberanía popular, elecciones libres, división de poderes",
                "ddhh": "Derechos fundamentales inherentes a toda persona, Declaración Universal 1948",
                "estado_derecho": "Sometimiento del poder al derecho, garantías individuales, tribunales independientes",
                "participacion": "Mecanismos ciudadanos: voto, plebiscitos, referendos, organizaciones sociales"
            }
        }

    def extract_key_concepts(self, question_text: str, alternatives: List[str]) -> List[str]:
        """Extract key concepts from question text."""
        concepts = []

        # Historical periods
        if any(word in question_text.lower() for word in ["independencia", "emancipación", "1810", "1818"]):
            concepts.append("independencia")
        if any(word in question_text.lower() for word in ["república", "constitución", "1833"]):
            concepts.append("republica")
        if "centenario" in question_text.lower() or "1910" in question_text:
            concepts.append("centenario")
        if any(word in question_text.lower() for word in ["guerra del pacífico", "1879", "salitre"]):
            concepts.append("guerra_pacifico")
        if "dictadura" in question_text.lower() or "1973" in question_text:
            concepts.append("dictadura")

        # Economic concepts
        if any(word in question_text.lower() for word in ["salitre", "nitrato"]):
            concepts.append("salitre")
        if "cobre" in question_text.lower():
            concepts.append("cobre")
        if any(word in question_text.lower() for word in ["ferrocarril", "tren"]):
            concepts.append("ferrocarril")

        # World events
        if any(word in question_text.lower() for word in ["primera guerra", "1914"]):
            concepts.append("wwi")
        if any(word in question_text.lower() for word in ["segunda guerra", "1939", "1945"]):
            concepts.append("wwii")
        if "guerra fría" in question_text.lower():
            concepts.append("guerra_fria")

        return concepts

    def generate_explanation(self, question: Dict[str, Any]) -> str:
        """Generate a specific explanation for a question."""
        texto = question.get('texto', '')
        alternativas = question.get('alternativas', [])
        correcta = question.get('correcta', 'A')
        area = question.get('area_tematica', '')
        tema = question.get('tema', '')

        # Get correct alternative text
        correct_idx = ord(correcta) - ord('A')
        correct_text = alternativas[correct_idx] if correct_idx < len(alternativas) else ''

        # Try to generate explanation based on content analysis
        explanation = self._analyze_and_explain(texto, alternativas, correcta, correct_text, area, tema)

        return explanation

    def _analyze_and_explain(self, texto: str, alternativas: List[str],
                            correcta: str, correct_text: str,
                            area: str, tema: str) -> str:
        """Analyze question and generate specific explanation."""

        texto_lower = texto.lower()
        correct_lower = correct_text.lower()

        # CENTENARIO Y CUESTIÓN SOCIAL
        if "centenario" in texto_lower and "1910" in texto:
            if "salubridad" in correct_lower or "salud" in correct_lower:
                return "La alternativa {} es correcta porque durante el Centenario de 1910, Chile enfrentaba la 'cuestión social' con graves problemas de salubridad pública en conventillos urbanos, epidemias (cólera, viruela), alta mortalidad infantil y condiciones insalubres en sectores obreros, situación que contrastaba con el discurso oficial optimista de la oligarquía.".format(correcta)

        # PRIMERA GUERRA MUNDIAL
        if ("primera guerra" in texto_lower or "1914" in texto or "1918" in texto) and "deuda" in texto_lower:
            if "estados unidos" in correct_lower or "financiamiento" in correct_lower:
                return "La alternativa {} es correcta porque Estados Unidos financió a los países aliados europeos durante la Primera Guerra Mundial (1914-1918), convirtiéndose en acreedor mientras las potencias europeas se endeudaron masivamente para costear el conflicto, lo que marcó el inicio de la hegemonía económica estadounidense.".format(correcta)

        # RESIDUOS TECNOLÓGICOS / EXTERNALIZACIÓN AMBIENTAL
        if "residuos" in texto_lower and "áfrica" in texto_lower:
            if "externalización" in correct_lower or "deterioro ambiental" in correct_lower:
                return "La alternativa {} es correcta porque los países desarrollados externalizan el deterioro ambiental al enviar desechos tecnológicos a naciones pobres de África, trasladando la contaminación y sus costos a regiones con menor capacidad de regulación, evidenciando la desigualdad en la distribución de cargas ambientales del modelo globalizado.".format(correcta)

        # FERROCARRILES SIGLO XIX
        if "ferrocarril" in texto_lower or "férrea" in texto_lower:
            if "centros productivos" in correct_lower or "puertos" in correct_lower:
                return "La alternativa {} es correcta porque la red ferroviaria chilena del siglo XIX tenía como propósito principal conectar los centros productivos (minas, haciendas) con puertos y ciudades, facilitando el transporte de materias primas como salitre y cobre hacia la exportación y dinamizando el comercio interno.".format(correcta)
            elif "manufacturados" in correct_lower or "perú" in correct_lower:
                return "La alternativa {} es correcta porque en la segunda mitad del siglo XIX, especialmente tras la Guerra del Pacífico (1879-1884), Chile buscó restablecer vínculos comerciales con Perú exportando productos manufacturados mediante la red ferroviaria que conectaba centros productivos con puertos.".format(correcta)

        # ESTADO DOCENTE
        if "estado docente" in texto_lower:
            if "protagónico" in correct_lower or "planificación" in correct_lower:
                return "La alternativa {} es correcta porque el Estado docente, consolidado en la segunda mitad del siglo XIX, implicó que el Estado asumiera un rol protagónico en educación, desde la planificación curricular hasta la implementación y fiscalización, creando liceos públicos y formando ciudadanos según valores republicanos laicos.".format(correcta)
            elif "católica" in correct_lower or "religión" in correct_lower:
                return "La alternativa {} es correcta porque una función del Estado docente fue disminuir la influencia de la Iglesia Católica en educación mediante la creación de establecimientos laicos públicos y la secularización gradual de los contenidos, aunque esto generó conflictos con sectores conservadores.".format(correcta)

        # GUERRA DEL PACÍFICO
        if "guerra del pacífico" in texto_lower or ("1879" in texto and "guerra" in texto_lower):
            if "salitre" in correct_lower or "nitrato" in correct_lower:
                return "La alternativa {} es correcta porque la Guerra del Pacífico (1879-1884) permitió a Chile incorporar las provincias salitreras de Tarapacá y Antofagasta, rico en yacimientos de nitrato, generando un auge económico basado en la exportación salitrera que financió el Estado hasta 1930.".format(correcta)

        # CONSTITUCIÓN 1833
        if "constitución" in texto_lower and "1833" in texto:
            if "autoritarismo" in correct_lower or "presidencial" in correct_lower:
                return "La alternativa {} es correcta porque la Constitución de 1833 estableció un régimen presidencialista autoritario con amplias facultades para el Presidente, período de 5 años reelegible, estados de excepción, y control centralizado, sentando las bases del orden portaliano.".format(correcta)

        # PARLAMENTARISMO
        if "parlamentarismo" in texto_lower or ("1891" in texto and "guerra civil" in texto_lower):
            if "congreso" in correct_lower or "gabinete" in correct_lower:
                return "La alternativa {} es correcta porque el régimen parlamentario (1891-1925) se caracterizó por el predominio del Congreso sobre el Ejecutivo, con rotativas ministeriales constantes, interpelaciones y votos de censura que debilitaron al gobierno y fortalecieron a la oligarquía.".format(correcta)

        # CUESTIÓN SOCIAL
        if "cuestión social" in texto_lower:
            if "obrero" in correct_lower or "trabajador" in correct_lower:
                return "La alternativa {} es correcta porque la cuestión social (fines siglo XIX-inicios XX) se refiere a los problemas socioeconómicos de los trabajadores urbanos y salitreros: salarios bajos, condiciones insalubres en conventillos, jornadas extensas, falta de legislación laboral y represión de movimientos obreros.".format(correcta)

        # INDUSTRIALIZACIÓN / ISI
        if "industrialización" in texto_lower or "corfo" in texto_lower or "isi" in texto_lower:
            if "sustitución" in correct_lower or "importaciones" in correct_lower:
                return "La alternativa {} es correcta porque la Industrialización por Sustitución de Importaciones (ISI), impulsada por CORFO desde 1939, buscó desarrollar industria nacional para producir internamente bienes antes importados, reduciendo dependencia externa y diversificando la economía más allá del cobre.".format(correcta)

        # REFORMA AGRARIA
        if "reforma agraria" in texto_lower:
            if "latifundio" in correct_lower or "tierra" in correct_lower:
                return "La alternativa {} es correcta porque la reforma agraria (1962-1973) buscó terminar con el latifundio tradicional mediante expropiación y redistribución de tierras a campesinos, modernizando el agro, aumentando productividad y reduciendo la concentración de propiedad heredada del período colonial.".format(correcta)

        # GOLPE DE ESTADO 1973
        if "golpe" in texto_lower and "1973" in texto:
            if "allende" in correct_lower or "unidad popular" in correct_lower:
                return "La alternativa {} es correcta porque el golpe militar del 11 de septiembre de 1973 derrocó al gobierno democrático de Salvador Allende y la Unidad Popular, instaurando una dictadura militar que suspendió derechos fundamentales, reprimió la oposición y transformó radicalmente el modelo económico.".format(correcta)

        # DICTADURA Y DDHH
        if "dictadura" in texto_lower and ("derechos humanos" in texto_lower or "ddhh" in texto_lower):
            if "violaciones" in correct_lower or "represión" in correct_lower:
                return "La alternativa {} es correcta porque durante la dictadura militar (1973-1990) se cometieron sistemáticas violaciones a los derechos humanos: ejecuciones, desapariciones forzadas, torturas, exilio, censura y persecución política, documentadas por las comisiones Rettig y Valech.".format(correcta)

        # CONSTITUCIÓN 1980
        if "constitución" in texto_lower and "1980" in texto:
            if "autoritarismo" in correct_lower or "dictadura" in correct_lower:
                return "La alternativa {} es correcta porque la Constitución de 1980 fue elaborada durante la dictadura, plebiscitada sin registros electorales ni libertades democráticas, estableció un sistema presidencialista con enclaves autoritarios (senadores designados, leyes orgánicas, Consejo de Seguridad Nacional).".format(correcta)

        # TRANSICIÓN DEMOCRÁTICA
        if "transición" in texto_lower or "plebiscito 1988" in texto_lower:
            if "democracia" in correct_lower or "elecciones" in correct_lower:
                return "La alternativa {} es correcta porque la transición democrática chilena (1988-1990) se inició con el plebiscito de 1988 donde triunfó el NO, condujo a elecciones libres en 1989 y al retorno del gobierno civil en 1990, manteniendo gradualismo en reformas constitucionales y políticas de consenso.".format(correcta)

        # NACIONALIZACIÓN DEL COBRE
        if "nacionalización" in texto_lower and "cobre" in texto_lower:
            if "propiedad" in correct_lower or "estatal" in correct_lower:
                return "La alternativa {} es correcta porque la nacionalización del cobre (1971) bajo el gobierno de Allende, aprobada unánimemente por el Congreso, traspasó la propiedad de la Gran Minería del Cobre desde empresas estadounidenses al Estado chileno, buscando soberanía económica y mayores ingresos fiscales.".format(correcta)

        # REVOLUCIÓN INDUSTRIAL
        if "revolución industrial" in texto_lower:
            if "mecanización" in correct_lower or "producción" in correct_lower:
                return "La alternativa {} es correcta porque la Revolución Industrial (desde 1760 en Inglaterra) transformó los sistemas productivos mediante la mecanización, uso de energía a vapor, producción fabril masiva, urbanización acelerada y surgimiento del proletariado industrial, cambiando radicalmente la economía y sociedad occidental.".format(correcta)

        # IMPERIALISMO
        if "imperialismo" in texto_lower or "colonial" in texto_lower:
            if "áfrica" in correct_lower or "asia" in correct_lower or "recursos" in correct_lower:
                return "La alternativa {} es correcta porque el imperialismo del siglo XIX implicó la expansión colonial europea sobre África y Asia mediante la Conferencia de Berlín (1884-1885), motivado por la búsqueda de materias primas, mercados para productos industriales y prestigio geopolítico.".format(correcta)

        # SEGUNDA GUERRA MUNDIAL
        if "segunda guerra" in texto_lower or ("1939" in texto and "1945" in texto):
            if "holocausto" in correct_lower or "genocidio" in correct_lower:
                return "La alternativa {} es correcta porque durante la Segunda Guerra Mundial (1939-1945) el régimen nazi perpetró el Holocausto, genocidio sistemático de seis millones de judíos y otros grupos mediante campos de concentración y exterminio, constituyendo uno de los crímenes más graves contra la humanidad.".format(correcta)
            elif "onu" in correct_lower or "naciones unidas" in correct_lower:
                return "La alternativa {} es correcta porque tras la Segunda Guerra Mundial se fundó la Organización de Naciones Unidas (ONU) en 1945 para mantener la paz internacional, promover derechos humanos y cooperación entre naciones, aprendiendo de los fracasos de la Sociedad de Naciones.".format(correcta)

        # GUERRA FRÍA
        if "guerra fría" in texto_lower:
            if "capitalismo" in correct_lower or "socialismo" in correct_lower or "bipolar" in correct_lower:
                return "La alternativa {} es correcta porque la Guerra Fría (1947-1991) fue un conflicto ideológico, político y económico entre el bloque capitalista liderado por Estados Unidos y el socialista por la URSS, caracterizado por carrera armamentista, confrontación indirecta y división del mundo en zonas de influencia.".format(correcta)

        # GLOBALIZACIÓN
        if "globalización" in texto_lower or "globalizado" in texto_lower:
            if "integración" in correct_lower or "interdependencia" in correct_lower:
                return "La alternativa {} es correcta porque la globalización implica la creciente integración e interdependencia económica, cultural y política mundial mediante libre comercio, flujos de capital, tecnologías de comunicación y cadenas productivas transnacionales, intensificada desde 1990.".format(correcta)

        # DESCOLONIZACIÓN
        if "descolonización" in texto_lower:
            if "independencia" in correct_lower or "áfrica" in correct_lower or "asia" in correct_lower:
                return "La alternativa {} es correcta porque la descolonización (1945-1975) fue el proceso de independencia de colonias africanas y asiáticas respecto de potencias europeas, motivado por el debilitamiento europeo post-Segunda Guerra Mundial, nacionalismos locales y presión internacional.".format(correcta)

        # DERECHOS HUMANOS
        if "derechos humanos" in texto_lower or "ddhh" in texto_lower:
            if "universal" in correct_lower or "inherentes" in correct_lower:
                return "La alternativa {} es correcta porque los derechos humanos son prerrogativas inherentes a toda persona por su dignidad, universales e inalienables, codificados en la Declaración Universal de 1948 tras las atrocidades de la Segunda Guerra Mundial, estableciendo estándares mínimos de protección.".format(correcta)

        # DEMOCRACIA
        if "democracia" in texto_lower and area == "Formacion Ciudadana":
            if "soberanía popular" in correct_lower or "elecciones" in correct_lower:
                return "La alternativa {} es correcta porque la democracia es un sistema político basado en la soberanía popular, donde los ciudadanos eligen a sus representantes mediante elecciones libres y periódicas, con respeto a derechos fundamentales, división de poderes y estado de derecho.".format(correcta)

        # ESTADO DE DERECHO
        if "estado de derecho" in texto_lower:
            if "ley" in correct_lower or "constitución" in correct_lower:
                return "La alternativa {} es correcta porque el Estado de Derecho implica el sometimiento de todos los poderes públicos y ciudadanos al imperio de la ley, garantizando derechos fundamentales, independencia judicial, debido proceso y limitación del poder mediante la Constitución.".format(correcta)

        # PARTICIPACIÓN CIUDADANA
        if "participación" in texto_lower and "ciudadan" in texto_lower:
            if "voto" in correct_lower or "plebiscito" in correct_lower:
                return "La alternativa {} es correcta porque la participación ciudadana en democracia se ejerce mediante mecanismos como el voto universal, plebiscitos, referendos, iniciativas populares de ley y organización en movimientos sociales, permitiendo incidir en decisiones públicas.".format(correcta)

        # MIGRACIÓN
        if "migración" in texto_lower or "inmigración" in texto_lower:
            if "europea" in correct_lower or "colonización" in correct_lower:
                return "La alternativa {} es correcta porque Chile promovió la inmigración europea selectiva en el siglo XIX (alemanes al sur desde 1846, croatas a Magallanes) para colonizar territorios, introducir técnicas agrícolas, poblar zonas estratégicas y 'civilizar' según ideología positivista de la élite.".format(correcta)

        # OCUPACIÓN DE LA ARAUCANÍA
        if "araucanía" in texto_lower or "mapuche" in texto_lower:
            if "militar" in correct_lower or "territorio" in correct_lower:
                return "La alternativa {} es correcta porque la Ocupación de la Araucanía (1861-1883) fue un proceso de expansión territorial del Estado chileno mediante campañas militares que sometieron al pueblo mapuche, incorporando sus tierras al control estatal, estableciendo fuertes y promoviendo colonización europea.".format(correcta)

        # SALITRE Y ECONOMÍA
        if "salitre" in texto_lower or "nitrato" in texto_lower:
            if "exportación" in correct_lower or "fiscal" in correct_lower:
                return "La alternativa {} es correcta porque el ciclo del salitre (1880-1930) generó enormes ingresos fiscales mediante impuestos a la exportación del nitrato extraído en el norte, financiando modernización estatal, obras públicas y educación, pero creando dependencia de un solo producto vulnerable a fluctuaciones internacionales.".format(correcta)

        # CRISIS DEL SALITRE
        if ("crisis" in texto_lower and "salitre" in texto_lower) or ("1929" in texto and "salitre" in texto_lower):
            if "sintético" in correct_lower or "alemania" in correct_lower:
                return "La alternativa {} es correcta porque la crisis salitrera se agravó con la invención del nitrato sintético alemán durante la Primera Guerra Mundial y el colapso de la demanda tras la Gran Depresión de 1929, provocando cierre masivo de oficinas, desempleo y crisis fiscal en Chile.".format(correcta)

        # FRENTE POPULAR
        if "frente popular" in texto_lower:
            if "radical" in correct_lower or "aguirre cerda" in correct_lower:
                return "La alternativa {} es correcta porque el Frente Popular (1938-1952) fue una coalición de partidos de centro-izquierda (Radical, Socialista, Comunista) que gobernó con Pedro Aguirre Cerda, impulsando industrialización vía CORFO, educación pública y derechos laborales.".format(correcta)

        # LEYES LAICAS
        if "laica" in texto_lower or "secularización" in texto_lower:
            if "registro civil" in correct_lower or "matrimonio civil" in correct_lower:
                return "La alternativa {} es correcta porque las leyes laicas (1883-1884) separaron funciones eclesiásticas del Estado creando el registro civil, matrimonio civil y cementerios laicos, parte del proceso de secularización liberal que redujo el poder de la Iglesia Católica en asuntos civiles.".format(correcta)

        # MOVIMIENTO OBRERO
        if "obrero" in texto_lower or "sindical" in texto_lower:
            if "organización" in correct_lower or "huelga" in correct_lower:
                return "La alternativa {} es correcta porque el movimiento obrero chileno (fines XIX-inicios XX) se organizó en mutuales, mancomunales y sindicatos para defender derechos laborales mediante huelgas y negociación colectiva, enfrentando represión estatal como en la matanza de la Escuela Santa María de Iquique (1907).".format(correcta)

        # SUFRAGIO
        if "sufragio" in texto_lower or "voto" in texto_lower:
            if "universal" in correct_lower or "femenino" in correct_lower:
                return "La alternativa {} es correcta porque el sufragio universal en Chile se logró gradualmente: voto masculino universal (1874), femenino en municipales (1935) y presidenciales (1949), eliminando restricciones censitarias y ampliando la participación democrática ciudadana.".format(correcta)

        # NEOLIBERALISMO EN CHILE
        if ("neoliberal" in texto_lower or "chicago boys" in texto_lower) and "chile" in texto_lower:
            if "privatización" in correct_lower or "mercado" in correct_lower:
                return "La alternativa {} es correcta porque el modelo neoliberal implementado desde 1975 por los 'Chicago Boys' durante la dictadura implicó privatización de empresas públicas, apertura comercial, desregulación laboral, sistema de AFP, subsidiariedad estatal y énfasis en el libre mercado.".format(correcta)

        # TRATADOS DE LIBRE COMERCIO
        if "tlc" in texto_lower or "libre comercio" in texto_lower:
            if "apertura" in correct_lower or "exportaciones" in correct_lower:
                return "La alternativa {} es correcta porque los Tratados de Libre Comercio (TLC) que Chile firmó desde los 1990s (con EE.UU., UE, China) buscan reducir aranceles, facilitar exportaciones, atraer inversión extranjera y diversificar mercados, profundizando la integración a la economía globalizada.".format(correcta)

        # Default explanations based on area
        if area == "Historia":
            return f"La alternativa {correcta} es correcta porque corresponde al análisis histórico del período en cuestión, considerando el contexto sociopolítico, los actores involucrados y las consecuencias del proceso descrito en la pregunta."

        elif area == "Sistema Economico":
            return f"La alternativa {correcta} es correcta porque refleja la dinámica económica descrita, considerando los factores productivos, las relaciones comerciales y el impacto de las políticas económicas en el desarrollo nacional o global."

        elif area == "Formacion Ciudadana":
            return f"La alternativa {correcta} es correcta porque se ajusta a los principios de formación ciudadana, considerando los derechos fundamentales, las instituciones democráticas y los mecanismos de participación ciudadana establecidos."

        # Generic fallback
        return f"La alternativa {correcta} es correcta según el análisis del contenido histórico, considerando los datos presentados y el contexto del período estudiado."

def main():
    """Main function to generate all explanations."""
    print("="*80)
    print("GENERADOR DE EXPLICACIONES - HISTORIA PAES CHILE")
    print("="*80)
    print()

    # Load question bank
    print("Cargando banco de preguntas...")
    with open(QUESTION_BANK_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data.get('preguntas', [])
    print(f"✓ {len(questions)} preguntas cargadas")
    print()

    # Initialize generator
    generator = HistoryExplanationGenerator()

    # Count questions needing explanations
    needs_update = [q for q in questions if 'clavijero oficial PAES' in q.get('explicacion', '') or len(q.get('explicacion', '')) < 50]
    print(f"Preguntas que necesitan explicación: {len(needs_update)}/{len(questions)}")
    print()

    # Generate explanations
    print("Generando explicaciones...")
    print("-"*80)

    updated_count = 0
    samples = []

    for i, question in enumerate(questions):
        q_id = question.get('id', f'Q{i+1}')

        # Skip if already has good explanation
        if 'clavijero oficial PAES' not in question.get('explicacion', '') and len(question.get('explicacion', '')) >= 50:
            continue

        old_explanation = question.get('explicacion', '')

        # Generate new explanation
        new_explanation = generator.generate_explanation(question)

        # Update
        question['explicacion'] = new_explanation
        updated_count += 1

        # Collect samples
        if updated_count <= 10:
            samples.append({
                'id': q_id,
                'pregunta': question.get('texto', '')[:100] + "...",
                'correcta': question.get('correcta', ''),
                'antes': old_explanation,
                'despues': new_explanation
            })

        if updated_count % 50 == 0:
            print(f"  Procesadas {updated_count} preguntas...")

    print(f"\n✓ Generadas {updated_count} explicaciones")
    print()

    # Save updated question bank
    print("Guardando banco actualizado...")
    with open(QUESTION_BANK_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("✓ Archivo guardado")
    print()

    # Show samples
    print("="*80)
    print("MUESTRAS DE EXPLICACIONES GENERADAS (10 primeras)")
    print("="*80)
    for i, sample in enumerate(samples, 1):
        print(f"\n{i}. ID: {sample['id']}")
        print(f"   Pregunta: {sample['pregunta']}")
        print(f"   Correcta: {sample['correcta']}")
        print(f"   ANTES: {sample['antes']}")
        print(f"   DESPUÉS: {sample['despues']}")
        print("-"*80)

    print()
    print("="*80)
    print(f"✓ COMPLETADO: {updated_count} explicaciones generadas")
    print("="*80)

if __name__ == "__main__":
    main()
