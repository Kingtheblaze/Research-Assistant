"""
Pydantic v2 schemas for the Autonomous Multi-Agent AI Research Assistant.
Defines all node inputs, outputs, and shared LangGraph state.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, HttpUrl
import datetime


class Paper(BaseModel):
    """
    Representation of an academic paper retrieved by Scout Agents
    and ranked by Critic Agent.
    """
    id: str = Field(description="Unique paper identifier, e.g., arXiv:2310.01234 or S2 ID")
    title: str = Field(description="Title of the paper")
    authors: List[str] = Field(default_factory=list, description="List of author names")
    year: int = Field(default=2024, description="Publication year")
    abstract: str = Field(description="Full text abstract")
    url: str = Field(description="Canonical URL to preprint or publication")
    source: Literal["arxiv", "semantic_scholar", "local_corpus", "manual"] = Field(
        default="arxiv",
        description="Source repository"
    )
    key_claims: List[str] = Field(
        default_factory=list,
        description="Extracted empirical or theoretical claims made by the authors"
    )
    relevance_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Relevance score to user research topic computed by Critic"
    )
    citation_count: Optional[int] = Field(default=0, description="Citation count if available")
    venue: Optional[str] = Field(default=None, description="Conference or journal venue")
    full_text_snippet: Optional[str] = Field(
        default=None,
        description="Extracted full-text excerpts or PDF passage for in-depth verification"
    )


class ResearchPlan(BaseModel):
    """Decomposition of the research topic produced by Planner Agent."""
    topic: str = Field(description="The original user query/topic")
    sub_queries: List[str] = Field(
        default_factory=list,
        description="Targeted academic search queries decomposed across methodologies, benchmarks, and challenges"
    )
    success_criteria: List[str] = Field(
        default_factory=list,
        description="Specific conditions required for high-quality literature synthesis"
    )
    domain_tags: List[str] = Field(
        default_factory=list,
        description="Relevant academic domains/fields (e.g., cs.AI, cs.CL, stat.ML)"
    )
    year_filter_min: Optional[int] = Field(
        default=2020,
        description="Lower bound publication year filter"
    )


class LiteratureCluster(BaseModel):
    """Thematic cluster within the literature map."""
    cluster_id: str
    theme_name: str
    description: str
    paper_ids: List[str]
    representative_claims: List[str] = Field(default_factory=list)


class LiteratureMap(BaseModel):
    """Synthesized landscape of literature organized into thematic clusters."""
    topic: str
    total_papers_analyzed: int = 0
    clusters: List[LiteratureCluster] = Field(default_factory=list)
    consensus_points: List[str] = Field(
        default_factory=list,
        description="Points of agreement across the reviewed literature"
    )
    contested_points: List[str] = Field(
        default_factory=list,
        description="Unresolved controversies, conflicting findings, or methodological splits"
    )


class Hypothesis(BaseModel):
    """Ranked, grounded testable hypothesis formulated from literature gaps."""
    id: str
    statement: str = Field(description="Precise, falsifiable hypothesis statement")
    rationale: str = Field(description="Theoretical or empirical foundation based on papers")
    grounding_paper_ids: List[str] = Field(
        default_factory=list,
        description="IDs of papers from the literature map directly supporting this hypothesis"
    )
    testability_score: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Feasibility and testability score (1-5 normalized to 0-1)"
    )
    novelty_score: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Novelty score relative to existing literature"
    )
    suggested_methodology: Optional[str] = Field(
        default=None,
        description="Recommended experimental setup or benchmark protocol to test the hypothesis"
    )


class ClaimVerification(BaseModel):
    """Claim verification record checking synthesis claims against evidence snippets."""
    claim_id: str
    claim_text: str
    cited_paper_id: str
    status: Literal["supported", "partially_supported", "unsupported", "hallucination"] = "supported"
    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Semantic similarity score between synthesized claim and source excerpt"
    )
    evidence_snippet: str = Field(
        description="Exact quote or snippet from paper abstract or full text"
    )
    verdict_explanation: str = Field(
        description="Explanation of why this claim is verified or flagged"
    )


class OverrideEvent(BaseModel):
    """Record of a human-in-the-loop checkpoint intervention."""
    checkpoint_name: Literal["checkpoint_1_literature_map", "checkpoint_2_hypotheses_and_gap"]
    action: Literal["accept", "edit", "rerun"]
    timestamp: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    notes: Optional[str] = None
    modified_keys: List[str] = Field(default_factory=list)


class ResearchState(BaseModel):
    """
    Shared state for the LangGraph orchestrator.
    Carries full execution context across all worker nodes.
    """
    topic: str
    plan: Optional[ResearchPlan] = None
    papers: List[Paper] = Field(default_factory=list)
    literature_map: Optional[LiteratureMap] = None
    gap_statement: str = ""
    hypotheses: List[Hypothesis] = Field(default_factory=list)
    verification_results: List[ClaimVerification] = Field(default_factory=list)
    draft_report: str = ""
    logs: List[str] = Field(default_factory=list)
    human_overrides: List[OverrideEvent] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    
    # Configuration settings from UI
    max_candidate_papers: int = Field(default=12, description="Maximum candidate papers to retrieve and keep")
    year_from: int = Field(default=2023, description="Minimum publication year threshold")
    
    # Internal orchestration control
    current_node: str = "init"
    waiting_for_human: bool = False
    pending_checkpoint: Optional[str] = None
    iteration: int = 0
