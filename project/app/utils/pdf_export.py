"""
PDF Export Utilities for Research Assistant Reports.
Supports:
- Option A: Markdown to formatted publication PDF using markdown + xhtml2pdf
- Option B: Structured Academic PDF using ReportLab
"""

from __future__ import annotations
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def markdown_to_pdf(md_text: str, output_path: str, title: str = "Autonomous Research Assistant Report") -> str:
    """
    Convert agent markdown report to a clean publication-grade PDF using markdown and xhtml2pdf.
    
    Args:
        md_text: Full markdown draft report from Report Writer agent
        output_path: Filepath where PDF should be saved
        title: Document title for the PDF header
        
    Returns:
        output_path as string on success.
    """
    try:
        import markdown
        from xhtml2pdf import pisa

        html_body = markdown.markdown(
            md_text,
            extensions=["tables", "fenced_code", "toc"]
        )

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>{title}</title>
  <style>
    @page {{
      size: A4;
      margin: 1.8cm 1.6cm 1.8cm 1.6cm;
      @bottom-right {{
        content: counter(page);
        font-family: Helvetica, Arial, sans-serif;
        font-size: 8.5pt;
        color: #666;
      }}
    }}
    body {{
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #111827;
    }}
    h1 {{
      font-size: 17pt;
      color: #1B3A4B;
      margin-bottom: 6px;
      font-weight: bold;
    }}
    h2 {{
      font-size: 12.5pt;
      color: #0F6B5C;
      margin-top: 16px;
      margin-bottom: 6px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 3px;
    }}
    h3 {{
      font-size: 11pt;
      color: #1B3A4B;
      margin-top: 10px;
      margin-bottom: 4px;
    }}
    p, li {{
      margin: 4px 0;
      color: #374151;
    }}
    code {{
      font-family: Courier, monospace;
      font-size: 9pt;
      background-color: #F3F4F6;
      padding: 1px 3px;
    }}
    pre {{
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 8px;
      font-size: 8.5pt;
      margin: 8px 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8.5pt;
    }}
    th {{
      background-color: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 5px 7px;
      text-align: left;
      color: #0F172A;
      font-weight: bold;
    }}
    td {{
      border: 1px solid #E2E8F0;
      padding: 5px 7px;
      vertical-align: top;
    }}
    blockquote {{
      background-color: #F8FAFC;
      border-left: 3px solid #0F6B5C;
      margin: 8px 0;
      padding: 6px 12px;
      font-style: italic;
      color: #4B5563;
    }}
    hr {{
      border: none;
      border-top: 1px solid #CBD5E1;
      margin: 12px 0;
    }}
    .meta {{
      color: #64748B;
      font-size: 8.5pt;
      margin-bottom: 10px;
    }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <div class="meta">Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")} · Autonomous Multi-Agent Research Assistant · Evidence Grounded</div>
  <hr/>
  {html_body}
</body>
</html>"""

        output_path_str = str(output_path)
        Path(output_path_str).parent.mkdir(parents=True, exist_ok=True)

        with open(output_path_str, "wb") as f:
            status = pisa.CreatePDF(html, dest=f)

        if status.err:
            raise RuntimeError(f"xhtml2pdf generated {status.err} errors")
        
        logger.info("Successfully generated PDF report at: %s", output_path_str)
        return output_path_str

    except ImportError:
        logger.warning("xhtml2pdf or markdown not installed; attempting ReportLab or HTML fallback.")
        return export_pdf_fallback(md_text, output_path, title)
    except Exception as e:
        logger.error("Error generating PDF with xhtml2pdf: %s", str(e))
        return export_pdf_fallback(md_text, output_path, title)


def build_structured_pdf(artifacts: Dict[str, Any], topic: str, output_path: str) -> str:
    """
    Build structured academic PDF with fixed sections using ReportLab.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib.colors import HexColor
        from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=1.6 * cm,
            rightMargin=1.6 * cm,
            topMargin=1.6 * cm,
            bottomMargin=1.5 * cm
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="TitleR", fontName="Helvetica-Bold", fontSize=14,
            textColor=HexColor("#1B3A4B"), alignment=TA_CENTER, spaceAfter=6
        ))
        styles.add(ParagraphStyle(
            name="H", fontName="Helvetica-Bold", fontSize=11,
            textColor=HexColor("#0F6B5C"), spaceBefore=10, spaceAfter=4
        ))
        styles.add(ParagraphStyle(
            name="B", fontName="Helvetica", fontSize=9.5,
            alignment=TA_JUSTIFY, leading=12, spaceAfter=4
        ))

        story = []
        story.append(Paragraph("Autonomous Multi-Agent Research Assistant", styles["TitleR"]))
        story.append(Paragraph(f"<b>Topic:</b> {topic}", styles["B"]))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#0F6B5C"), spaceAfter=8))

        sections = [
            ("1. Literature Map", artifacts.get("literature_map") or "N/A"),
            ("2. Research Gap", artifacts.get("gap") or "N/A"),
            ("3. Hypotheses", artifacts.get("hypotheses") or "N/A"),
            ("4. Verification Summary", artifacts.get("verification") or "N/A"),
            ("5. Draft Report", artifacts.get("report") or "N/A"),
        ]

        for sec_title, body in sections:
            story.append(Paragraph(sec_title, styles["H"]))
            for para in str(body).split("\n"):
                if para.strip():
                    clean_para = para.replace("**", "").replace("#", "").strip()
                    story.append(Paragraph(clean_para, styles["B"]))
            story.append(Spacer(1, 4))

        doc.build(story)
        return output_path
    except Exception as e:
        logger.error("ReportLab structured PDF failed: %s", str(e))
        return export_pdf_fallback(str(artifacts), output_path, topic)


def export_pdf_fallback(text: str, output_path: str, title: str) -> str:
    """Fallback text writer if binary PDF libraries are not yet compiled."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    html_out = output_path.replace(".pdf", ".html")
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(f"<!DOCTYPE html><html><head><title>{title}</title></head><body><pre>{text}</pre></body></html>")
    return html_out
