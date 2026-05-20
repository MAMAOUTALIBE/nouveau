"""Rendu PDF — WeasyPrint si disponible, sinon fallback minimal pur Python.

Le fallback produit un PDF basique (en-tête + texte) sans dépendance
externe. Suffisant pour les démos. Pour la prod, installer WeasyPrint
(`uv add weasyprint`) qui nécessite Pango/Cairo (apt-get install libpango).
"""

from __future__ import annotations

from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol


class PdfRenderer(Protocol):
    provider_name: str

    def render(self, *, template_name: str, context: dict[str, Any]) -> bytes: ...


# ============================================================================
# WeasyPrint renderer (préféré)
# ============================================================================
class WeasyPrintRenderer(PdfRenderer):
    provider_name = "weasyprint"

    def __init__(self, templates_dir: Path) -> None:
        self.templates_dir = templates_dir

    def render(self, *, template_name: str, context: dict[str, Any]) -> bytes:
        try:
            from jinja2 import (  # pyright: ignore[reportMissingImports]
                Environment,
                FileSystemLoader,
            )
            from weasyprint import HTML  # pyright: ignore[reportMissingImports]
        except ImportError as exc:
            raise RuntimeError(
                "WeasyPrint non installé. `uv add weasyprint jinja2` requis "
                "(+ libpango sur Linux/macOS)."
            ) from exc

        from jinja2 import Environment, FileSystemLoader
        from weasyprint import HTML

        env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True,
        )
        template = env.get_template(template_name)
        html_str = template.render(**context, generated_at=datetime.now(tz=UTC))
        return bytes(HTML(string=html_str).write_pdf())


# ============================================================================
# Fallback : générateur PDF minimal sans dépendances
# ============================================================================
class MinimalPdfRenderer(PdfRenderer):
    """Renderer ultime sans dépendance — produit un PDF lisible en monospace.

    Utile en CI/dev sans Pango/Cairo. Ne supporte ni les templates HTML
    ni les images. Pour une vraie sortie, installer WeasyPrint.
    """

    provider_name = "minimal"

    def render(self, *, template_name: str, context: dict[str, Any]) -> bytes:
        # Sérialise simplement le contexte en texte
        title = str(context.get("title", "Document DRH"))
        lines = [title, "=" * 60, ""]
        for key, value in sorted(context.items()):
            if key == "title":
                continue
            lines.append(f"{key}: {value}")

        return _build_minimal_pdf(lines, title=title)


def _build_minimal_pdf(lines: list[str], *, title: str = "Document") -> bytes:
    """Génère un PDF 1.4 single-page très basique en pur Python (pas de lib)."""
    # PDF objects
    text_lines = "\n".join(lines)
    escaped = text_lines.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content_stream = (
        b"BT\n/F1 11 Tf\n50 800 Td\n14 TL\n"
        + b"\n".join(
            f"({line.replace('(', '').replace(')', '')}) Tj T*".encode("latin-1", "replace")
            for line in escaped.split("\n")[:60]
        )
        + b"\nET\n"
    )

    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        b"<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 5 0 R >> >> "
        b"/Contents 4 0 R >>"
    )
    objects.append(
        b"<< /Length "
        + str(len(content_stream)).encode("latin-1")
        + b" >>\nstream\n"
        + content_stream
        + b"endstream"
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

    out = b"%PDF-1.4\n"
    offsets: list[int] = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode("latin-1") + obj + b"\nendobj\n"
    xref_offset = len(out)
    out += b"xref\n"
    out += f"0 {len(objects) + 1}\n".encode("latin-1")
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode("latin-1")
    out += b"trailer\n"
    out += f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode("latin-1")
    out += b"startxref\n"
    out += f"{xref_offset}\n".encode("latin-1")
    out += b"%%EOF\n"
    _ = title  # paramètre conservé pour évolution future
    return out


# ============================================================================
# Sélection
# ============================================================================
@lru_cache(maxsize=1)
def get_pdf_renderer() -> PdfRenderer:
    templates_dir = Path(__file__).resolve().parent / "templates"
    templates_dir.mkdir(parents=True, exist_ok=True)
    try:
        import weasyprint  # noqa: F401  # pyright: ignore[reportMissingImports]
    except ImportError:
        return MinimalPdfRenderer()
    return WeasyPrintRenderer(templates_dir=templates_dir)
