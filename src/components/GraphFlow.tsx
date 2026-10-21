import React from "react";
import { CheckCircle2, Loader2, AlertCircle, PauseCircle, ArrowRight } from "lucide-react";

interface GraphFlowProps {
  currentNode: string;
  waitingForHuman: boolean;
  pendingCheckpoint: string | null | undefined;
  papersCount: number;
  claimsCount: number;
  onOpenCheckpoint: () => void;
}

export const GraphFlow: React.FC<GraphFlowProps> = ({
  currentNode,
  waitingForHuman,
  pendingCheckpoint,
  papersCount,
  claimsCount,
  onOpenCheckpoint,
}) => {
  const steps = [
    { id: "planner", label: "Planner", desc: "Decomposes sub-queries" },
    { id: "scout", label: "Scouts", desc: "Parallel arXiv & S2" },
    { id: "critic", label: "Critic", desc: "Dedupe & rank" },
    { id: "checkpoint_1", label: "Checkpoint 1", desc: "Literature Map Gate", isCheckpoint: true },
    { id: "synthesizer", label: "Synthesizer", desc: "Map, gap, hypotheses" },
    { id: "verifier", label: "Claim Verifier", desc: "Snippet entailment" },
    { id: "checkpoint_2", label: "Checkpoint 2", desc: "Hypothesis Gate", isCheckpoint: true },
    { id: "writer", label: "Report Writer", desc: "Grounded markdown" },
  ];

  const getNodeStatus = (stepId: string) => {
    const order = ["init", "planner", "scout", "critic", "checkpoint_1", "synthesizer", "verifier", "checkpoint_2", "writer", "completed"];
    const currentIndex = order.indexOf(currentNode);
    const stepIndex = order.indexOf(stepId);

    if (waitingForHuman) {
      if (pendingCheckpoint === "checkpoint_1_literature_map" && stepId === "checkpoint_1") {
        return "waiting";
      }
      if (pendingCheckpoint === "checkpoint_2_hypotheses_and_gap" && stepId === "checkpoint_2") {
        return "waiting";
      }
    }

    if (currentNode === "completed") return "done";
    if (currentIndex > stepIndex) return "done";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">LangGraph Execution Flow</h2>
          <p className="text-xs text-slate-500">Stateful orchestrator-worker graph with human oversight gates</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-500">Scouted Papers: <strong className="text-slate-900">{papersCount}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Verified Claims: <strong className="text-slate-900">{claimsCount}</strong></span>
        </div>
      </div>

      {/* Steps Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {steps.map((step, idx) => {
          const status = getNodeStatus(step.id);
          const isWaiting = status === "waiting";
          const isActive = status === "active";
          const isDone = status === "done";

          let borderClass = "border-slate-200 bg-slate-50 text-slate-400";
          if (isWaiting) {
            borderClass = "border-amber-400 bg-amber-50/70 text-amber-900 ring-2 ring-amber-300/60";
          } else if (isActive) {
            borderClass = "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-200";
          } else if (isDone) {
            borderClass = "border-emerald-300 bg-emerald-50/40 text-emerald-900";
          }

          return (
            <div
              key={step.id}
              onClick={() => {
                if (isWaiting) onOpenCheckpoint();
              }}
              className={`p-3 rounded-lg border text-left transition-all ${borderClass} ${
                isWaiting ? "cursor-pointer animate-pulse" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider">0{idx + 1}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {isActive && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                {isWaiting && <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
              </div>
              <div className="text-xs font-semibold truncate">{step.label}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{step.desc}</div>
              {isWaiting && (
                <div className="mt-2 text-[10px] font-medium text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-center">
                  Review Gate
                </div>
              )}
            </div>
          );
        })}
      </div>

      {waitingForHuman && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              Execution paused at <strong>{pendingCheckpoint === "checkpoint_1_literature_map" ? "Checkpoint 1 (Literature Map)" : "Checkpoint 2 (Hypotheses & Claims)"}</strong>.
              Review candidate findings before resuming.
            </p>
          </div>
          <button
            onClick={onOpenCheckpoint}
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
          >
            Open Checkpoint Inspector
          </button>
        </div>
      )}
    </div>
  );
};
