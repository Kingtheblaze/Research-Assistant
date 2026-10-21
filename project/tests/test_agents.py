"""
Integration tests for Agent nodes and graph execution.
"""

import pytest
from project.app.schemas.state import ResearchState
from project.app.agents.planner import plan_research
from project.app.agents.scout import scout_literature
from project.app.agents.critic import critic_filter_and_rank
from project.app.agents.synthesizer import synthesize_literature
from project.app.agents.verifier import verify_claims
from project.app.agents.writer import write_research_report
from project.app.graph.orchestrator import ResearchAssistantPipeline


def test_planner_agent_decomposition():
    state = ResearchState(topic="Multi-Agent Coordination Under Latency Constraints")
    res = plan_research(state)
    assert "plan" in res
    plan = res["plan"]
    assert len(plan.sub_queries) >= 3
    assert len(plan.success_criteria) >= 2


def test_critic_deduplication_and_ranking():
    state = ResearchState(topic="Multi-Agent Coordination")
    # Run scout first
    state = state.model_copy(update=scout_literature(state))
    assert len(state.papers) > 0

    # Run critic
    state = state.model_copy(update=critic_filter_and_rank(state))
    assert len(state.papers) > 0
    # Verify descending sort order
    scores = [p.relevance_score for p in state.papers]
    assert scores == sorted(scores, reverse=True)


def test_pipeline_step_by_step_checkpoints():
    pipeline = ResearchAssistantPipeline()
    topic = "Retrieval-Augmented Generation Hallucination Mitigation"
    
    # Run to Checkpoint 1
    state = pipeline.run_step_by_step(topic, pause_at_checkpoints=True)
    assert state.waiting_for_human is True
    assert state.pending_checkpoint == "checkpoint_1_literature_map"

    # Resume past Checkpoint 1 to Checkpoint 2
    state = pipeline.resume_after_checkpoint_1(state, action="accept")
    assert state.waiting_for_human is True
    assert state.pending_checkpoint == "checkpoint_2_hypotheses_and_gap"
    assert len(state.hypotheses) >= 3
    assert len(state.verification_results) > 0

    # Resume past Checkpoint 2 to Complete
    state = pipeline.resume_after_checkpoint_2(state, action="accept")
    assert state.waiting_for_human is False
    assert state.current_node == "completed"
    assert len(state.draft_report) > 200
    assert "Executive Summary" in state.draft_report
