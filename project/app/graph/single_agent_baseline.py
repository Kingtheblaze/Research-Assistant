"""
Single-Agent Baseline Architecture.
Uses the same search tools (arXiv + Semantic Scholar) but operates as a
monolithic single agent without sub-query decomposition, multi-agent critique,
claim verification, or human-in-the-loop checkpoints.
Used for controlled empirical benchmarking.
"""

from __future__ import annotations
import logging
import time
from typing import Dict, Any
from project.app.schemas.state import ResearchState, Paper
from project.app.tools.arxiv_search import search_arxiv
from project.app.tools.semantic_scholar import search_semantic_scholar
from project.app.agents.llm_client import call_llm

logger = logging.getLogger(__name__)


def run_single_agent_baseline(topic: str) -> ResearchState:
    """
    Executes a monolithic single-agent literature review on the given topic.
    1. Issues single search query using the raw topic
    2. Takes retrieved papers directly without critic filtering
    3. Prompts LLM to generate report directly without verification node
    """
    start_time = time.time()
    logger.info("Executing Single-Agent Baseline for topic: '%s'", topic)
    state = ResearchState(topic=topic)
    state.logs.append("[Single Agent] Initiated monolithic literature search.")

    # 1. Single-pass search using raw query (no sub-query decomposition)
    arxiv_papers = search_arxiv(topic, max_results=5)
    s2_papers = search_semantic_scholar(topic, max_results=5)
    raw_papers = arxiv_papers + s2_papers
    state.papers = raw_papers
    state.logs.append(f"[Single Agent] Retrieved {len(raw_papers)} papers without critic filtering.")

    # 2. Monolithic direct generation prompt (no verification node)
    paper_references = "\n".join([f"- [{p.id}] {p.title} ({p.year}): {p.abstract[:150]}" for p in raw_papers])
    prompt = (
        f"Write a research report summarizing the topic: '{topic}'.\n\n"
        f"Here are retrieved papers you may use:\n{paper_references}\n\n"
        f"Include an overview, a research gap, hypotheses, and references."
    )

    llm_output = call_llm(prompt)

    if not llm_output:
        # Fallback baseline text
        llm_output = (
            f"# Baseline Research Report: {topic}\n\n"
            f"## Overview\nThis single-agent baseline summarizes initial literature retrieved on {topic}.\n\n"
            f"## Literature Summary\n"
            + "\n".join([f"- **[{p.id}]** {p.title}: {p.abstract[:180]}..." for p in raw_papers[:4]])
            + f"\n\n## Research Gap\nFurther empirical research is required across real-world deployments of {topic}.\n\n"
            f"## Hypotheses\n1. Larger model scale will correlate with higher task completion on {topic}.\n"
            f"2. Incorporating additional context windows will improve accuracy.\n\n"
            f"## References\n"
            + "\n".join([f"- [{p.id}] {p.title} ({p.year}). URL: {p.url}" for p in raw_papers])
        )

    state.draft_report = llm_output
    state.current_node = "completed"
    elapsed = round(time.time() - start_time, 2)
    state.metrics["latency_seconds"] = elapsed
    state.logs.append(f"[Single Agent] Completed monolithic generation in {elapsed}s.")

    return state
