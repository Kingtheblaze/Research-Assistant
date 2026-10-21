import React, { useState } from "react";
import { Hypothesis, ClaimVerification } from "../types";
import { X, Check, Edit3, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";

interface CheckpointTwoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gapStatement: string;
  hypotheses: Hypothesis[];
  verifications: ClaimVerification[];
  onAccept: () => void;
  onSaveEdits: (newGap: string, newHypotheses: Hypothesis[]) => void;
  onRegenerate: (guidance: string) => void;
}

export const CheckpointTwoModal: React.FC<CheckpointTwoModalProps> = ({
  isOpen,
  onClose,
  gapStatement,
  hypotheses,
  verifications,
  onAccept,
  onSaveEdits,
  onRegenerate,
}) => {
  const [editedGap, setEditedGap] = useState(gapStatement);
  const [editedHypotheses, setEditedHypotheses] = useState<Hypothesis[]>(hypotheses);
  const [guidance, setGuidance] = useState("");
  const [tab, setTab] = useState<"review" | "regenerate">("review");

  if (!isOpen) return null;

  const handleHypothesisTextChange = (idx: number, newText: string) => {
    const updated = [...editedHypotheses];
    updated[idx] = { ...updated[idx], statement: newText };
    setEditedHypotheses(updated);
  };

  const handleSave = () => {
    onSaveEdits(editedGap, editedHypotheses);
    onClose();
  };

  const handleRegen = () => {
    if (!guidance.trim()) return;
    onRegenerate(guidance);
    onClose();
  };

  const supportedCount = verifications.filter((v) => v.status === "supported").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-zinc-100">
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-base font-semibold text-zinc-100">
                Human Checkpoint 2: Hypotheses & Research Gap Gate
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Verify synthesized research gap statement and {hypotheses.length} grounded hypotheses ({supportedCount} citations verified).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 pt-3 border-b border-zinc-800 flex gap-4 text-xs font-medium bg-zinc-950/40">
          <button
            onClick={() => setTab("review")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              tab === "review"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Review & Edit Formulations
          </button>
          <button
            onClick={() => setTab("regenerate")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              tab === "regenerate"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Regenerate with Guidance
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === "review" && (
            <>
              {/* Gap Statement Edit */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Research Gap Statement:
                </label>
                <textarea
                  value={editedGap}
                  onChange={(e) => setEditedGap(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-sans bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
                />
              </div>

              {/* Hypotheses List */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Testable Hypotheses ({editedHypotheses.length}):
                </label>
                {editedHypotheses.map((h, idx) => (
                  <div
                    key={h.id}
                    className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400">Hypothesis 0{idx + 1}</span>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <span>Testability: <strong className="text-zinc-200">{h.testability_score.toFixed(2)}</strong></span>
                        <span>·</span>
                        <span>Novelty: <strong className="text-zinc-200">{h.novelty_score.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={h.statement}
                      onChange={(e) => handleHypothesisTextChange(idx, e.target.value)}
                      className="w-full text-xs font-sans bg-zinc-900 border border-zinc-700/80 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />

                    <p className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Theoretical Rationale:</strong> {h.rationale}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                      <span>Grounding IDs:</span>
                      {h.grounding_paper_ids.map((pid) => (
                        <span key={pid} className="font-mono bg-zinc-900 px-2 py-0.5 rounded text-emerald-400 border border-zinc-800">
                          {pid}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "regenerate" && (
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Synthesis Re-Generation Guidance:
              </label>
              <textarea
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                rows={4}
                placeholder="e.g. Focus hypotheses more on formal verification and less on parameter efficiency..."
                className="w-full text-xs font-sans bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
              />
              <p className="text-[11px] text-zinc-400">
                The Synthesizer agent will re-cluster papers and generate new hypotheses incorporating your guidance.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {tab === "regenerate" ? (
              <button
                onClick={handleRegen}
                disabled={!guidance.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Synthesize</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Save Formulations
                </button>
                <button
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Write Final Report</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
