#!/usr/bin/env python3
"""
Evaluation Runner for Autonomous Multi-Agent AI Research Assistant.
Compares the Multi-Agent system against the Single-Agent Baseline
across gold benchmark datasets.
"""

import json
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from project.app.metrics.evaluator import run_benchmark_comparison

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")


def main():
    print("================================================================================")
    print("  AUTONOMOUS MULTI-AGENT RESEARCH ASSISTANT — EVALUATION SUITE")
    print("================================================================================")
    print("Comparing Multi-Agent Orchestrator vs. Single-Agent Baseline across benchmarks...\n")

    gold_path = os.path.join(os.path.dirname(__file__), "data/gold_benchmarks.json")
    results_payload = run_benchmark_comparison(gold_path)
    
    results = results_payload.get("results", [])

    for item in results:
        topic = item["topic"]
        ma = item["multi_agent"]
        sa = item["single_agent_baseline"]

        print(f"\nBenchmark Topic: {topic}")
        print(f"Domain: {item.get('domain')}")
        print("-" * 80)
        print(f"{'Metric':<30} | {'Multi-Agent System':<20} | {'Single-Agent Baseline':<20}")
        print("-" * 80)
        print(f"{'Literature Recall@5 (Gold)':<30} | {ma['literature_recall_at_k']*100:<19.1f}% | {sa['literature_recall_at_k']*100:<19.1f}%")
        print(f"{'Citation Precision':<30} | {ma['citation_precision']*100:<19.1f}% | {sa['citation_precision']*100:<19.1f}%")
        print(f"{'Claim Support Rate':<30} | {ma['claim_support_rate']*100:<19.1f}% | {sa['claim_support_rate']*100:<19.1f}%")
        print(f"{'Hallucinated Citation Rate':<30} | {ma['hallucinated_citation_rate']*100:<19.1f}% | {sa['hallucinated_citation_rate']*100:<19.1f}%")
        print(f"{'Gap Quality (1-5)':<30} | {ma['gap_quality_score']:<20.1f} | {sa['gap_quality_score']:<20.1f}")
        print(f"{'Hypothesis Usefulness (1-5)':<30} | {ma['hypothesis_usefulness_score']:<20.1f} | {sa['hypothesis_usefulness_score']:<20.1f}")
        print(f"{'Execution Latency':<30} | {ma['latency_seconds']:<19.1f}s | {sa['latency_seconds']:<19.1f}s")
        print("-" * 80)

    # Save benchmark evaluation summary
    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)
    summary_path = os.path.join(out_dir, "benchmark_evaluation_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results_payload, f, indent=2)

    print(f"\n✅ Benchmark metrics successfully exported to: {summary_path}\n")


if __name__ == "__main__":
    main()
