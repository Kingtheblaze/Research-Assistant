"""
Unit tests for Pydantic v2 schemas and data validation.
"""

import pytest
from project.app.schemas.state import (
    Paper,
    ResearchPlan,
    LiteratureCluster,
    LiteratureMap,
    Hypothesis,
    ClaimVerification,
    ResearchState
)


def test_paper_schema_validation():
    paper = Paper(
        id="arXiv:2308.08155",
        title="Communicative Agents for Software Development",
        authors=["Chen Qian", "Xin Cong"],
        year=2023,
        abstract="We propose ChatDev, a virtual chat-powered software development company.",
        url="https://arxiv.org/abs/2308.08155",
        source="arxiv",
        key_claims=["Decomposes development into phases"],
        relevance_score=0.92
    )
    assert paper.id == "arXiv:2308.08155"
    assert paper.relevance_score == 0.92
    assert len(paper.authors) == 2


def test_research_state_serialization():
    state = ResearchState(
        topic="Multi-Agent LLM Coordination",
        gap_statement="Lack of claim-level verification.",
        logs=["Test log message"]
    )
    dumped_json = state.model_dump_json()
    assert "Multi-Agent LLM Coordination" in dumped_json
    assert "Lack of claim-level verification." in dumped_json

    restored = ResearchState.model_validate_json(dumped_json)
    assert restored.topic == state.topic
    assert restored.gap_statement == state.gap_statement


def test_claim_verification_schema():
    record = ClaimVerification(
        claim_id="c-001",
        claim_text="Tree-search reasoning improves problem-solving.",
        cited_paper_id="arXiv:2305.10601",
        status="supported",
        similarity_score=0.88,
        evidence_snippet="Tree of Thoughts frames reasoning as tree search.",
        verdict_explanation="High textual and semantic overlap confirmed."
    )
    assert record.status == "supported"
    assert record.similarity_score >= 0.8
