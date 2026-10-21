#!/usr/bin/env python3
"""
CLI runner for Autonomous Multi-Agent AI Research Assistant.
Usage:
    python project/run_cli.py --topic "Multi-Agent Coordination in LLMs" --output report.md
"""

import argparse
import json
import logging
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from project.app.graph.orchestrator import ResearchAssistantPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("research_cli")


def main():
    parser = argparse.ArgumentParser(description="Autonomous Multi-Agent AI Research Assistant")
    parser.add_argument("--topic", type=str, required=True, help="Research topic or scientific inquiry")
    parser.add_argument("--output", type=str, default="data/research_report.md", help="Destination file for markdown draft")
    parser.add_argument("--save-state", type=str, default="data/research_state.json", help="Destination file for serialized state")
    parser.add_argument("--max-papers", type=int, default=12, help="Maximum candidate papers to retrieve and keep")
    parser.add_argument("--year-from", type=int, default=2023, help="Minimum publication year threshold")
    parser.add_argument("--auto-accept", action="store_true", help="Automatically accept human checkpoints for non-interactive batch runs")
    args = parser.parse_args()

    logger.info("Initializing research pipeline for topic: '%s'", args.topic)
    pipeline = ResearchAssistantPipeline()

    if args.auto_accept:
        logger.info("Running in batch auto-accept mode...")
        state = pipeline.run_step_by_step(args.topic, pause_at_checkpoints=False, max_candidate_papers=args.max_papers, year_from=args.year_from)
        state = pipeline.resume_after_checkpoint_2(state, action="accept")
    else:
        # Step 1: Up to Checkpoint 1
        state = pipeline.run_step_by_step(args.topic, pause_at_checkpoints=True, max_candidate_papers=args.max_papers, year_from=args.year_from)
        print(f"\n=======================================================")
        print(f"🛑 HUMAN CHECKPOINT 1: LITERATURE MAP ({len(state.papers)} papers scouted)")
        print(f"=======================================================")
        for idx, p in enumerate(state.papers[:5], start=1):
            print(f"[{idx}] {p.id}: {p.title} ({p.year}) - Rel: {p.relevance_score:.2f}")
        
        choice = input("\nAction [A]ccept / [E]dit / [R]e-run: ").strip().lower()
        if choice == "r":
            refine = input("Refinement query: ").strip()
            state = pipeline.resume_after_checkpoint_1(state, action="rerun", feedback=refine)
        else:
            state = pipeline.resume_after_checkpoint_1(state, action="accept")

        # Step 2: Up to Checkpoint 2
        print(f"\n=======================================================")
        print(f"🛑 HUMAN CHECKPOINT 2: HYPOTHESES & VERIFICATION")
        print(f"=======================================================")
        print(f"GAP STATEMENT:\n{state.gap_statement}\n")
        print("HYPOTHESES:")
        for h in state.hypotheses:
            print(f"- {h.statement} (Grounding: {h.grounding_paper_ids})")
        
        choice2 = input("\nAction [A]ccept / [E]dit gap / [R]egenerate: ").strip().lower()
        if choice2 == "e":
            new_gap = input("Enter revised gap statement: ").strip()
            state = pipeline.resume_after_checkpoint_2(state, action="edit", edited_gap=new_gap)
        elif choice2 == "r":
            state = pipeline.resume_after_checkpoint_2(state, action="rerun", feedback="Regenerate with higher testability")
        else:
            state = pipeline.resume_after_checkpoint_2(state, action="accept")

    # Save output artifacts
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(state.draft_report)
    print(f"\n✅ Final markdown research report saved to: {args.output}")

    if args.save_state:
        os.makedirs(os.path.dirname(os.path.abspath(args.save_state)), exist_ok=True)
        with open(args.save_state, "w", encoding="utf-8") as f:
            f.write(state.model_dump_json(indent=2))
        print(f"✅ Serialized state JSON saved to: {args.save_state}")

    # Persist to SQLite runs.db
    from project.app.tools.persistence import save_run_state
    run_id = save_run_state(state)
    print(f"✅ Persisted run to SQLite DB: {os.getenv('SQLITE_DB_PATH', './data/runs.db')} (ID: {run_id})")


if __name__ == "__main__":
    main()
