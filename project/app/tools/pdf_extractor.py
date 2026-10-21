"""
PDF text and snippet extractor tool.
Uses PyMuPDF (fitz) or fallback text segmentation to extract full-text chunks
and verification evidence from academic preprints.
"""

from __future__ import annotations
import logging
import re
from typing import List, Optional
import requests

logger = logging.getLogger(__name__)


def extract_text_from_pdf_url(pdf_url: str, max_pages: int = 4, timeout: int = 15) -> str:
    """
    Download and extract plain text from an academic PDF URL using PyMuPDF.
    
    Args:
        pdf_url: Direct URL to the PDF file
        max_pages: Maximum initial pages to parse (typically covers intro, related work, methodology)
        timeout: HTTP download timeout
        
    Returns:
        Extracted plain text or empty string on failure.
    """
    logger.info("Attempting PDF text extraction from: %s", pdf_url)
    try:
        response = requests.get(pdf_url, timeout=timeout)
        if response.status_code != 200:
            logger.warning("Failed to download PDF: status code %d", response.status_code)
            return ""
        
        pdf_bytes = response.content
        return extract_text_from_pdf_bytes(pdf_bytes, max_pages=max_pages)
    except Exception as exc:
        logger.warning("PDF extraction failed for %s: %s", pdf_url, str(exc))
        return ""


def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_pages: int = 4) -> str:
    """Extract text from raw PDF bytes using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_pages: List[str] = []
        
        num_pages_to_read = min(len(doc), max_pages)
        for page_idx in range(num_pages_to_read):
            page = doc[page_idx]
            text_pages.append(page.get_text())
            
        full_text = "\n\n".join(text_pages)
        return clean_extracted_text(full_text)
    except ImportError:
        logger.warning("PyMuPDF (fitz) not available; returning raw text string approximation.")
        # Fallback basic ascii extraction if PyMuPDF not compiled
        return clean_extracted_text(pdf_bytes[:15000].decode("latin-1", errors="ignore"))
    except Exception as e:
        logger.error("Error reading PDF bytes: %s", str(e))
        return ""


def clean_extracted_text(text: str) -> str:
    """Remove line breaks, headers, footers, and redundant whitespace."""
    # Remove hyphenated linebreaks (e.g., coordi-\nnation -> coordination)
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    # Collapse multiple whitespaces and newlines
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def find_relevant_snippets(text: str, query_or_claim: str, snippet_size: int = 250, max_snippets: int = 2) -> List[str]:
    """
    Find sentences or paragraphs in extracted text that best match a claim or query.
    """
    if not text:
        return []
        
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 30]
    claim_words = set(re.findall(r"\w+", query_or_claim.lower()))
    
    scored_sentences = []
    for s in sentences:
        s_words = set(re.findall(r"\w+", s.lower()))
        overlap = len(claim_words.intersection(s_words))
        if overlap > 0:
            scored_sentences.append((overlap, s + "."))
            
    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    return [s[1] for s in scored_sentences[:max_snippets]]
