"""
LangGraph Orchestrator for Multi-Agent Research Assistant.
Defines the stateful graph with human-in-the-loop checkpoints:
Checkpoint 1: Post-Critic (Literature Map & Papers Review)
Checkpoint 2: Post-Verification (Gap, Hypotheses, and Claim Checks Review)
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from project.app.schemas.state import ResearchState, OverrideEvent
from project.app.agents.planner import plan_research
from project.app.agents.scout import literature_scout_node, scout_literature
from project.app.agents.critic import critic_filter_and_rank
from project.app.agents.synthesizer import synthesize_literature
from project.app.agents.verifier import verify_claims
from project.app.agents.writer import write_research_report

logger = logging.getLogger(__name__)


def checkpoint_1_router(state: ResearchState) -> str:
    """
    Evaluates state at Checkpoint 1.
    If human override requested re-run, branches back to scout; otherwise proceeds to synthesizer.
    """
    if state.waiting_for_human and state.pending_checkpoint == "checkpoint_1":
        return "wait"
    
    # Check for recent override event
    if state.human_overrides:
        last_event = state.human_overrides[-1]
        if last_event.checkpoint_name == "checkpoint_1_literature_map" and last_event.action == "rerun":
            return "scout"
            
    return "synthesizer"


def checkpoint_2_router(state: ResearchState) -> str:
    """
    Evaluates state at Checkpoint 2.
    If human override requested regenerate, branches back to synthesizer; otherwise proceeds to writer.
    """
    if state.waiting_for_human and state.pending_checkpoint == "checkpoint_2":
        return "wait"
        
    if state.human_overrides:
        last_event = state.human_overrides[-1]
        if last_event.checkpoint_name == "checkpoint_2_hypotheses_and_gap" and last_event.action == "rerun":
            return "synthesizer"

    return "writer"


def build_research_graph(checkpointer: Optional[Any] = None) -> Any:
    """
    Constructs the compiled LangGraph StateGraph.
    
    Flow:
    planner -> scout -> critic -> (checkpoint 1) -> synthesizer -> verifier -> (checkpoint 2) -> writer -> END
    """
    workflow = StateGraph(ResearchState)

    # Add core agent nodes
    workflow.add_node("planner", plan_research)
    workflow.add_node("scout", literature_scout_node)
    workflow.add_node("critic", critic_filter_and_rank)
    workflow.add_node("synthesizer", synthesize_literature)
    workflow.add_node("verifier", verify_claims)
    workflow.add_node("writer", write_research_report)

    # Define edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "scout")
    workflow.add_edge("scout", "critic")
    workflow.add_edge("critic", "synthesizer")
    workflow.add_edge("synthesizer", "verifier")
    workflow.add_edge("verifier", "writer")
    workflow.add_edge("writer", END)

    if checkpointer:
        app = workflow.compile(checkpointer=checkpointer)
    else:
        app = workflow.compile()
    return app


class ResearchAssistantPipeline:
    """
    Production wrapper executing the research graph synchronously or
    step-by-step with interactive human-in-the-loop checkpoints.
    """

    def __init__(self, checkpointer: Optional[Any] = None):
        self.graph = build_research_graph(checkpointer=checkpointer)

    def run_step_by_step(
        self,
        topic: str,
        pause_at_checkpoints: bool = True,
        max_candidate_papers: int = 12,
        year_from: int = 2020
    ) -> ResearchState:
        """
        Executes the research process step-by-step.
        If pause_at_checkpoints is True, sets waiting_for_human flags.
        """
        state = ResearchState(
            topic=topic,
            max_candidate_papers=max_candidate_papers,
            year_from=year_from
        )
        logger.info(
            "Initializing ResearchAssistantPipeline for topic: '%s' (max=%d, year>=%d)",
            topic, max_candidate_papers, year_from
        )

        # 1. Planner
        state = state.model_copy(update=plan_research(state))
        
        # 2. Scout
        state = state.model_copy(update=literature_scout_node(state))
        
        # 3. Critic
        state = state.model_copy(update=critic_filter_and_rank(state))
        
        # Checkpoint 1: Literature Map
        if pause_at_checkpoints:
            state.waiting_for_human = True
            state.pending_checkpoint = "checkpoint_1_literature_map"
            state.logs.append("[Checkpoint 1] Paused: Waiting for human review of literature map.")
            return state

        return self.resume_after_checkpoint_1(state, action="accept")

    def resume_after_checkpoint_1(
        self,
        state: ResearchState,
        action: str = "accept",
        edited_papers: Optional[list] = None,
        feedback: Optional[str] = None
    ) -> ResearchState:
        """Resume execution past Checkpoint 1."""
        state.waiting_for_human = False
        state.pending_checkpoint = None

        override = OverrideEvent(
            checkpoint_name="checkpoint_1_literature_map",
            action=action, # "accept", "edit", or "rerun"
            notes=feedback or f"Checkpoint 1 {action}"
        )
        state.human_overrides.append(override)

        if action == "edit" and edited_papers is not None:
            state.papers = edited_papers
            state.logs.append(f"[Checkpoint 1 Override] Human edited paper set to {len(edited_papers)} papers.")
        elif action == "rerun":
            state.logs.append(f"[Checkpoint 1 Override] Human requested re-scouting with feedback: '{feedback}'.")
            state = state.model_copy(update=literature_scout_node(state))
            state = state.model_copy(update=critic_filter_and_rank(state))

        # 4. Synthesizer
        state = state.model_copy(update=synthesize_literature(state))

        # 5. Verifier
        state = state.model_copy(update=verify_claims(state))

        # Checkpoint 2: Hypotheses & Verification
        state.waiting_for_human = True
        state.pending_checkpoint = "checkpoint_2_hypotheses_and_gap"
        state.logs.append("[Checkpoint 2] Paused: Waiting for human review of hypotheses and verification flags.")
        return state

    def resume_after_checkpoint_2(
        self,
        state: ResearchState,
        action: str = "accept",
        edited_gap: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> ResearchState:
        """Resume execution past Checkpoint 2 through final report generation."""
        state.waiting_for_human = False
        state.pending_checkpoint = None

        override = OverrideEvent(
            checkpoint_name="checkpoint_2_hypotheses_and_gap",
            action=action,
            notes=feedback or f"Checkpoint 2 {action}"
        )
        state.human_overrides.append(override)

        if action == "edit" and edited_gap:
            state.gap_statement = edited_gap
            state.logs.append("[Checkpoint 2 Override] Human updated research gap statement.")
        elif action == "rerun":
            state.logs.append(f"[Checkpoint 2 Override] Human requested re-synthesis with feedback: '{feedback}'.")
            state = state.model_copy(update=synthesize_literature(state))
            state = state.model_copy(update=verify_claims(state))

        # 6. Report Writer
        state = state.model_copy(update=write_research_report(state))
        state.current_node = "completed"
        state.logs.append("[Pipeline Complete] Successfully finalized evidence-grounded research synthesis.")
        return state
