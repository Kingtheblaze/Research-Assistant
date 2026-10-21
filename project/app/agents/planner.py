"""
Planner Agent
Decomposes the research topic into targeted academic sub-queries,
success criteria, and domain tags.
"""

from __future__ import annotations
import logging
from typing import Dict, Any
from project.app.schemas.state import ResearchPlan, ResearchState
from project.app.agents.llm_client import call_structured_llm

logger = logging.getLogger(__name__)


def plan_research(state: ResearchState) -> Dict[str, Any]:
    """
    Planner agent node for LangGraph.
    Decomposes state.topic into a structured ResearchPlan.
    """
    topic = state.topic
    logger.info("Planner Agent activated for topic: '%s'", topic)

    system_prompt = (
        "You are an expert Senior Research Scientist and Literature Review Planner. "
        "Your task is to decompose a research topic into academic search queries and evaluation criteria. "
        "Queries must target: 1) Foundational architectures, 2) Empirical evaluations, 3) Failure modes and challenges, 4) State-of-the-art benchmarks."
    )
    user_prompt = f"Decompose the following research topic into an academic literature review plan:\n\nTopic: {topic}"

    plan = call_structured_llm(user_prompt, ResearchPlan, system_message=system_prompt)

    if not plan:
        # Deterministic domain-aware fallback plan
        logger.info("Generating deterministic research plan for topic: '%s'", topic)
        sub_queries = [
            f"{topic} architectures frameworks",
            f"{topic} empirical evaluation benchmarks",
            f"{topic} challenges failure modes",
            f"{topic} state of the art recent advances"
        ]
        success_criteria = [
            "Identify minimum 5 peer-reviewed papers or preprints from 2021-2024",
            "Extract at least 2 empirical claims per paper",
            "Synthesize consensus methodologies vs disputed architectural choices",
            "Identify an actionable research gap with at least 3 testable hypotheses"
        ]
        plan = ResearchPlan(
            topic=topic,
            sub_queries=sub_queries,
            success_criteria=success_criteria,
            domain_tags=["cs.AI", "cs.CL", "cs.MA", "stat.ML"],
            year_filter_min=2021
        )

    log_entry = f"[Planner Agent] Generated {len(plan.sub_queries)} sub-queries and {len(plan.success_criteria)} success criteria."
    logger.info(log_entry)

    return {
        "plan": plan,
        "logs": state.logs + [log_entry],
        "current_node": "planner"
    }
