"""PDF generation adapters (WeasyPrint + fallback ReportLab)."""

from app.adapters.pdf.renderer import PdfRenderer, get_pdf_renderer

__all__ = ["PdfRenderer", "get_pdf_renderer"]
