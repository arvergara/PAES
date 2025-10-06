"""Batch runner para el pipeline OCR → clasificación."""

from __future__ import annotations

import sys
import json
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Optional

import click
from rich.console import Console
from rich.progress import Progress

CURRENT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = CURRENT_DIR.parent
PROJECT_ROOT = SCRIPTS_DIR.parent
for candidate in (SCRIPTS_DIR, PROJECT_ROOT):
    if str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

from ocr.pdf_processor import PDFProcessor, infer_subject_from_name  # noqa: E402

console = Console()


@dataclass
class PipelineConfig:
    source: Path
    output: Path
    skip: int
    subject: Optional[str]
    auto_classify: bool
    temario: Path
    model: str
    device: int


def _build_classifier_kwargs(cfg: PipelineConfig, subject: Optional[str]) -> Optional[Dict[str, object]]:
    if not cfg.auto_classify or not subject:
        return None
    return {
        "temario_path": str(cfg.temario),
        "model_name": cfg.model,
        "device": cfg.device,
    }


def _process_single(pdf_path: Path, cfg: PipelineConfig) -> Dict[str, object]:
    subject = cfg.subject or infer_subject_from_name(pdf_path)
    classifier_kwargs = _build_classifier_kwargs(cfg, subject)

    processor = PDFProcessor(output_dir=str(cfg.output))
    result = processor.process_pdf(
        pdf_path=str(pdf_path),
        subject=subject,
        skip_pages=cfg.skip,
        auto_classify=classifier_kwargs is not None,
        classifier_kwargs=classifier_kwargs,
    )
    return {
        "pdf": pdf_path.name,
        "subject": subject,
        "result": result,
    }


def _iter_pdfs(source: Path, pattern: str) -> Iterable[Path]:
    if source.is_file():
        yield source
        return
    for pdf in sorted(source.glob(pattern)):
        if pdf.is_file():
            yield pdf


@click.command(help="Procesa PDFs PAES aplicando OCR, extracción y clasificación opcional")
@click.option("--source", "source_path", type=click.Path(path_type=Path, exists=True), required=True,
              help="Archivo PDF o carpeta con PDFs")
@click.option("--output", "output_path", type=click.Path(path_type=Path), default=PROJECT_ROOT / "output",
              help="Carpeta donde se guardarán los resultados")
@click.option("--pattern", default="*.pdf", show_default=True,
              help="Patrón glob para buscar PDFs cuando la fuente es un directorio")
@click.option("--subject", default=None, help="Materia fija a utilizar (override del nombre del archivo)")
@click.option("--skip", type=int, default=0, show_default=True, help="Páginas iniciales a omitir")
@click.option("--auto-classify/--no-auto-classify", default=True, show_default=True,
              help="Ejecutar clasificación automática si hay subject disponible")
@click.option("--temario", type=click.Path(path_type=Path),
              default=PROJECT_ROOT / "content" / "temario_paes_vs.csv",
              help="Ruta al temario PAES")
@click.option("--model", default="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli", show_default=True,
              help="Modelo zero-shot de Hugging Face")
@click.option("--device", type=int, default=-1, show_default=True,
              help="Dispositivo para Transformers (-1=CPU, 0=GPU)")
@click.option("--jobs", type=int, default=1, show_default=True,
              help="Número de procesos en paralelo")
@click.option("--export-summary", type=click.Path(path_type=Path), default=None,
              help="Ruta opcional para guardar un resumen JSON del procesamiento")
def run_pipeline(
    source_path: Path,
    output_path: Path,
    pattern: str,
    subject: Optional[str],
    skip: int,
    auto_classify: bool,
    temario: Path,
    model: str,
    device: int,
    jobs: int,
    export_summary: Optional[Path],
) -> None:
    output_path.mkdir(parents=True, exist_ok=True)

    cfg = PipelineConfig(
        source=source_path,
        output=output_path,
        skip=skip,
        subject=subject,
        auto_classify=auto_classify,
        temario=temario,
        model=model,
        device=device,
    )

    pdf_files = list(_iter_pdfs(source_path, pattern))
    if not pdf_files:
        console.print(f"[yellow]No se encontraron PDFs en {source_path} con patrón {pattern}.[/yellow]")
        raise SystemExit(1)

    console.print(f"[bold]Procesando {len(pdf_files)} PDFs desde {source_path}[/bold]")

    results = []
    with Progress(console=console) as progress:
        task = progress.add_task("Procesando", total=len(pdf_files))

        if jobs == 1:
            for pdf in pdf_files:
                progress.update(task, description=f"{pdf.name}")
                results.append(_process_single(pdf, cfg))
                progress.advance(task)
        else:
            with ProcessPoolExecutor(max_workers=jobs) as pool:
                futures = {
                    pool.submit(_process_single, pdf, cfg): pdf for pdf in pdf_files
                }
                for future in as_completed(futures):
                    try:
                        results.append(future.result())
                    except Exception as exc:  # pragma: no cover
                        console.print(f"[red]Error procesando {futures[future].name}: {exc}[/red]")
                    finally:
                        progress.advance(task)

    total_questions = sum(item["result"]["total_questions"] for item in results)
    total_images = sum(item["result"]["total_images"] for item in results)
    total_tables = sum(item["result"]["total_tables"] for item in results)

    console.print("\n[green]Resumen:[/green]")
    console.print(f"  • PDFs procesados: {len(results)}")
    console.print(f"  • Preguntas extraídas: {total_questions}")
    console.print(f"  • Imágenes detectadas: {total_images}")
    console.print(f"  • Tablas detectadas: {total_tables}")

    if export_summary:
        export_summary.parent.mkdir(parents=True, exist_ok=True)
        export_summary.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        console.print(f"\n[blue]Resumen guardado en {export_summary}[/blue]")


if __name__ == "__main__":  # pragma: no cover
    run_pipeline()
