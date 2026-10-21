"""
Literature Scout Agent
Executes parallel searches across arXiv and Semantic Scholar using sub-queries/topic,
normalizes papers, and extracts candidate claims.
"""

from __future__ import annotations
import logging
import re
from typing import Dict, Any, List, Union
from project.app.schemas.state import Paper, ResearchState
from project.app.tools.arxiv_search import search_arxiv
from project.app.tools.semantic_scholar import search_semantic_scholar

logger = logging.getLogger(__name__)


def dedupe_by_title(papers: List[Any]) -> List[Any]:
    """
    Deduplicates paper collection by normalized alphanumeric title.
    Supports both dict items and Paper Pydantic models.
    """
    seen = set()
    deduped = []
    for p in papers:
        title = p.get("title", "") if isinstance(p, dict) else getattr(p, "title", "")
        norm = re.sub(r"[^\w\s]", "", str(title).lower()).strip()
        if norm and norm not in seen:
            seen.add(norm)
            deduped.append(p)
    return deduped


def literature_scout_node(state: Union[dict, ResearchState]) -> Union[dict, Any]:
    """
    Literature Scout Agent node for LangGraph and Streamlit UI.
    Retrieves papers from arXiv and Semantic Scholar, deduplicates by title,
    and caps results according to UI configuration.
    """
    is_dict = isinstance(state, dict)

    if is_dict:
        topic = state.get("topic", "")
        max_papers = int(state.get("max_candidate_papers", 12))
        year_from = int(state.get("year_from", 2020))
        logs = state.setdefault("logs", [])
    else:
        topic = state.topic
        max_papers = int(getattr(state, "max_candidate_papers", 12))
        year_from = int(getattr(state, "year_from", 2020))
        logs = list(state.logs)

    logger.info(
        "Literature Scout initiating search for topic: '%s' (max=%d, year>=%d)",
        topic, max_papers, year_from
    )

    # --- arXiv ---
    arxiv_papers = search_arxiv(
        query=topic,
        max_results=max_papers,
        year_from=year_from,
    )

    # --- Semantic Scholar (optional second source) ---
    s2_papers = search_semantic_scholar(
        query=topic,
        max_results=max_papers,
        year_from=year_from,
    )

    # merge + basic dedupe by title
    combined = dedupe_by_title(arxiv_papers + s2_papers)

    # respect UI max
    papers = combined[:max_papers]

    log_entry = (
        f"[Scout Agent] {len(papers)} candidate papers retrieved "
        f"(max={max_papers}, year>={year_from})"
    )
    logger.info(log_entry)

    if is_dict:
        state["papers"] = papers
        state["logs"].append(log_entry)
        state["current_node"] = "scout"
        return state
    else:
        return {
            "papers": papers,
            "logs": logs + [log_entry],
            "current_node": "scout"
        }


# Alias for orchestrator compatibility
scout_literature = literature_scout_node
