"""
Tests for Evaluation metrics computation.
"""

import pytest
from project.app.schemas.state import ResearchState, Paper, ClaimVerification, Hypothesis
from project.app.metrics.evaluator import (
    compute_metrics_for_state,
    evaluate_gap_quality,
    evaluate_hypothesis_usefulness
)


def test_metrics_computation():
    paper1 = Paper(
        id="arXiv:2308.08155",
        title="ChatDev",
        authors=["Qian et al."],
        year=2023,
        abstract="Software dev with communicative agents.",
        url="https://arxiv.org/abs/2308.08155",
        relevance_score=0.92
    )
    paper2 = Paper(
        id="arXiv:2305.10601",
        title="Tree of Thoughts",
        authors=["Yao et al."],
        year=2023,
        abstract="Deliberate problem solving.",
        url="https://arxiv.org/abs/2305.10601",
        relevance_score=0.88
    )

    verif = ClaimVerification(
        claim_id="v1",
        claim_text="Tree search improves reasoning.",
        cited_paper_id="arXiv:2305.10601",
        status="supported",
        similarity_score=0.85,
        evidence_snippet="Tree of Thoughts improves accuracy.",
        verdict_explanation="Supported"
    )

    state = ResearchState(
        topic="Multi-Agent Planning",
        papers=[paper1, paper2],
        verification_results=[verif],
        draft_report="Summary of [arXiv:2308.08155] and [arXiv:2305.10601].",
        gap_statement="A critical unresolved gap in arXiv:2308.08155 remains lack of long-horizon benchmarks."
    )

    gold_papers = ["arXiv:2308.08155", "arXiv:2305.10601", "arXiv:9999.99999"]
    metrics = compute_metrics_for_state(state, gold_paper_ids=gold_papers, k=2)

    assert metrics["literature_recall_at_k"] == round(2/3, 3)
    assert metrics["citation_precision"] == 1.0
    assert metrics["hallucinated_citation_rate"] == 0.0
    assert metrics["claim_support_rate"] == 1.0
    assert metrics["relevance_precision_at_k"] == 1.0
