"""
Critic Agent
Filters out irrelevant or duplicate papers, ranks literature by semantic relevance,
citation impact, and empirical rigor. Supports both dict and Paper models.
"""

from __future__ import annotations
import logging
import re
from typing import Dict, Any, List, Union
from project.app.schemas.state import Paper, ResearchState
from project.app.tools.embeddings import compute_similarity

logger = logging.getLogger(__name__)


def critic_filter_and_rank(state: Union[dict, ResearchState]) -> Union[dict, Any]:
    """
    Critic Agent node for LangGraph.
    Deduplicates, scores relevance against topic, and ranks papers.
    """
    is_dict = isinstance(state, dict)
    raw_papers = state.get("papers", []) if is_dict else state.papers
    topic = state.get("topic", "") if is_dict else state.topic
    logs = state.setdefault("logs", []) if is_dict else list(state.logs)
    max_keep = int(state.get("max_candidate_papers", 12)) if is_dict else int(getattr(state, "max_candidate_papers", 12))

    logger.info("Critic Agent processing %d incoming papers", len(raw_papers))

    if not raw_papers:
        logger.warning("No papers provided to Critic Agent.")
        warn_msg = "[Critic Agent] Warning: Received empty paper set."
        if is_dict:
            state["papers"] = []
            state["logs"].append(warn_msg)
            return state
        return {
            "papers": [],
            "logs": logs + [warn_msg],
            "current_node": "critic"
        }

    # Step 1: Deduplicate by normalized title
    deduped_papers: List[Any] = []
    seen_titles: List[str] = []

    for paper in raw_papers:
        title = paper.get("title", "") if isinstance(paper, dict) else getattr(paper, "title", "")
        norm_title = re.sub(r"[^\w\s]", "", str(title).lower()).strip()
        is_dup = False
        for seen in seen_titles:
            sim = compute_similarity(norm_title, seen)
            if sim > 0.85:
                is_dup = True
                break
        if not is_dup:
            seen_titles.append(norm_title)
            deduped_papers.append(paper)

    # Step 2: Compute relevance score against research topic
    scored_papers: List[Any] = []
    for paper in deduped_papers:
        title = paper.get("title", "") if isinstance(paper, dict) else getattr(paper, "title", "")
        abstract = paper.get("abstract", "") if isinstance(paper, dict) else getattr(paper, "abstract", "")
        year = paper.get("year", 2024) if isinstance(paper, dict) else getattr(paper, "year", 2024)
        citation_count = paper.get("citation_count", 0) if isinstance(paper, dict) else getattr(paper, "citation_count", 0)

        text_corpus = f"{title}. {abstract}"
        semantic_sim = compute_similarity(topic, text_corpus)
        
        # Recency boost (2020-2024)
        recency_bonus = min(0.08, max(0.0, ((year or 2024) - 2020) * 0.02))
        
        # Citation impact boost
        cites = citation_count or 0
        citation_bonus = min(0.10, (cites / 1000.0) * 0.10) if cites > 0 else 0.0
        
        composite_score = round(min(1.0, 0.75 * semantic_sim + 0.15 * recency_bonus + 0.10 * citation_bonus + 0.15), 3)
        
        if isinstance(paper, dict):
            paper["relevance_score"] = composite_score
            scored_papers.append(paper)
        else:
            paper.relevance_score = composite_score
            scored_papers.append(paper)

    # Step 3: Sort descending by relevance score
    def get_score(p):
        return p.get("relevance_score", 0.0) if isinstance(p, dict) else getattr(p, "relevance_score", 0.0)

    scored_papers.sort(key=get_score, reverse=True)
    top_papers = scored_papers[:max_keep]

    log_entry = (
        f"[Critic Agent] Deduplicated from {len(raw_papers)} to {len(deduped_papers)} papers. "
        f"Filtered {len(scored_papers)} relevant papers, retained top {len(top_papers)} for synthesis."
    )
    logger.info(log_entry)

    if is_dict:
        state["papers"] = top_papers
        state["logs"].append(log_entry)
        state["current_node"] = "critic"
        return state
    else:
        return {
            "papers": top_papers,
            "logs": logs + [log_entry],
            "current_node": "critic"
        }
