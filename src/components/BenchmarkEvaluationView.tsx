import React, { useState } from "react";
import { BenchmarkComparisonItem } from "../types";
import { BENCHMARK_COMPARISONS } from "../data/mockData";
import { BarChart3, TrendingUp, ShieldAlert, Award, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

export const BenchmarkEvaluationView: React.FC = () => {
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const activeBenchmark = BENCHMARK_COMPARISONS[selectedTopicIndex];

  const ma = activeBenchmark.multi_agent;
  const sa = activeBenchmark.single_agent_baseline;

  const metrics = [
    {
      name: "Literature Recall@5 (Gold)",
      maVal: `${(ma.literature_recall_at_k * 100).toFixed(1)}%`,
      saVal: `${(sa.literature_recall_at_k * 100).toFixed(1)}%`,
      delta: `+${((ma.literature_recall_at_k - sa.literature_recall_at_k) * 100).toFixed(1)}%`,
      positive: true,
      desc: "Fraction of benchmark gold seminal papers retrieved in top 5",
    },
    {
      name: "Citation Precision",
      maVal: `${(ma.citation_precision * 100).toFixed(1)}%`,
      saVal: `${(sa.citation_precision * 100).toFixed(1)}%`,
      delta: `+${((ma.citation_precision - sa.citation_precision) * 100).toFixed(1)}%`,
      positive: true,
      desc: "Percentage of citations in final report matching retrieved papers",
    },
    {
      name: "Claim Support Rate",
      maVal: `${(ma.claim_support_rate * 100).toFixed(1)}%`,
      saVal: `${(sa.claim_support_rate * 100).toFixed(1)}%`,
      delta: `+${((ma.claim_support_rate - sa.claim_support_rate) * 100).toFixed(1)}%`,
      positive: true,
      desc: "Proportion of claims verified against actual paper snippets",
    },
    {
      name: "Hallucinated Citation Rate",
      maVal: `${(ma.hallucinated_citation_rate * 100).toFixed(1)}%`,
      saVal: `${(sa.hallucinated_citation_rate * 100).toFixed(1)}%`,
      delta: `${((ma.hallucinated_citation_rate - sa.hallucinated_citation_rate) * 100).toFixed(1)}%`,
      positive: true,
      desc: "Citations invented or missing from retrieved literature corpus",
    },
    {
      name: "Research Gap Quality (1-5)",
      maVal: `${ma.gap_quality_score.toFixed(1)}`,
      saVal: `${sa.gap_quality_score.toFixed(1)}`,
      delta: `+${(ma.gap_quality_score - sa.gap_quality_score).toFixed(1)}`,
      positive: true,
      desc: "Empirical precision, specificity, and actionability of gap analysis",
    },
    {
      name: "Hypothesis Usefulness (1-5)",
      maVal: `${ma.hypothesis_usefulness_score.toFixed(1)}`,
      saVal: `${sa.hypothesis_usefulness_score.toFixed(1)}`,
      delta: `+${(ma.hypothesis_usefulness_score - sa.hypothesis_usefulness_score).toFixed(1)}`,
      positive: true,
      desc: "Falsifiability, novelty, and theoretical grounding of hypotheses",
    },
    {
      name: "Execution Latency",
      maVal: `${ma.latency_seconds.toFixed(1)}s`,
      saVal: `${sa.latency_seconds.toFixed(1)}s`,
      delta: `+${(ma.latency_seconds - sa.latency_seconds).toFixed(1)}s`,
      positive: false,
      desc: "Wall clock execution time for multi-agent graph vs monolithic agent",
    },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Benchmark Selector Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Select Evaluation Benchmark Suite
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {BENCHMARK_COMPARISONS.map((b, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTopicIndex(idx)}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedTopicIndex === idx
                  ? "bg-zinc-800 border-emerald-500/50 shadow-xs"
                  : "bg-zinc-950 border-zinc-800/80 hover:bg-zinc-800/40 text-zinc-400"
              }`}
            >
              <span className="text-[10px] font-mono text-emerald-400 block">{b.domain}</span>
              <span className="text-xs font-semibold text-zinc-200 line-clamp-1 mt-0.5">{b.topic}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comparative Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Recall Advantage</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            +{((ma.literature_recall_at_k - sa.literature_recall_at_k) * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-zinc-400">
            Higher seminal literature recall through federated OpenAlex + arXiv sub-query planning.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Zero Hallucinations</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            0.0%
          </div>
          <p className="text-xs text-zinc-400">
            Automated citation entailment eliminates fabricated DOIs vs 28.5% in monolithic single agents.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Hypothesis Quality</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            {ma.hypothesis_usefulness_score.toFixed(1)} / 5.0
          </div>
          <p className="text-xs text-zinc-400">
            Grounded theoretical hypotheses with falsifiable methodology and novelty scoring.
          </p>
        </div>
      </div>

      {/* Side-by-Side Detailed Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Full Benchmark Evaluation Matrix: Multi-Agent Graph vs Single-Agent Baseline</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Evaluated across {BENCHMARK_COMPARISONS.length} canonical topics with fixed gold reference citations
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Metric Dimension</th>
                <th className="py-2.5 px-4 font-semibold text-emerald-400">Multi-Agent Graph (Our System)</th>
                <th className="py-2.5 px-4 font-semibold text-zinc-400">Single-Agent Baseline</th>
                <th className="py-2.5 px-4 font-semibold text-zinc-200">Net Delta</th>
                <th className="py-2.5 px-4 font-semibold text-zinc-400">Evaluation Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {metrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-zinc-200">
                    {m.name}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {m.maVal}
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    {m.saVal}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {m.delta}
                  </td>
                  <td className="py-3 px-4 font-sans text-zinc-400 text-[11px]">
                    {m.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
