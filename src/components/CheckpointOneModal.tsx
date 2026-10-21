import React, { useState } from "react";
import { Paper } from "../types";
import { X, Check, Trash2, RotateCcw, ExternalLink, Database } from "lucide-react";

interface CheckpointOneModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[];
  onAccept: () => void;
  onEditPapers: (filteredPapers: Paper[], note: string) => void;
  onRerunScout: (refineQuery: string) => void;
}

export const CheckpointOneModal: React.FC<CheckpointOneModalProps> = ({
  isOpen,
  onClose,
  papers,
  onAccept,
  onEditPapers,
  onRerunScout,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(papers.map((p) => p.id));
  const [refinementQuery, setRefinementQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"papers" | "rerun">("papers");

  if (!isOpen) return null;

  const togglePaper = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSaveEdits = () => {
    const kept = papers.filter((p) => selectedIds.includes(p.id));
    onEditPapers(kept, `Filtered to ${kept.length} papers by researcher.`);
    onClose();
  };

  const handleRerun = () => {
    if (!refinementQuery.trim()) return;
    onRerunScout(refinementQuery);
    onClose();
  };

  const getSourceBadge = (source: string) => {
    if (source === "openalex") {
      return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">OpenAlex 250M+</span>;
    }
    if (source === "arxiv") {
      return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">arXiv</span>;
    }
    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">S2</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-zinc-100">
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="text-base font-semibold text-zinc-100">
                Human Checkpoint 1: Literature Map & Paper Screening
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Scouts retrieved {papers.length} candidate papers across OpenAlex, arXiv, and Semantic Scholar. Review, filter, or re-scout.
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
            onClick={() => setActiveTab("papers")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "papers"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Candidate Papers ({selectedIds.length} of {papers.length} selected)
          </button>
          <button
            onClick={() => setActiveTab("rerun")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "rerun"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Refine & Re-Scout Query
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "papers" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Toggle selection to include/exclude papers in downstream synthesis:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedIds(papers.map((p) => p.id))}
                    className="text-emerald-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-zinc-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {papers.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePaper(p.id)}
                      className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-zinc-800/80 border-emerald-500/40 shadow-xs"
                          : "bg-zinc-950/60 border-zinc-800 text-zinc-500 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded accent-emerald-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-emerald-400 text-[11px]">{p.id}</span>
                              {getSourceBadge(p.source)}
                              <span className="text-[11px] text-zinc-400 font-mono">
                                Rel: {(p.relevance_score * 100).toFixed(0)}% · Citations: {p.citation_count || 0}
                              </span>
                            </div>
                            <h4 className="font-semibold text-zinc-200 mt-0.5 leading-snug">
                              {p.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                              {p.abstract}
                            </p>
                          </div>
                        </div>

                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-400 hover:text-emerald-400 p-1 shrink-0"
                          title="Open paper"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "rerun" && (
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Refined Sub-Query Guidance for Literature Scouts:
              </label>
              <textarea
                value={refinementQuery}
                onChange={(e) => setRefinementQuery(e.target.value)}
                rows={4}
                placeholder="e.g. Focus specifically on token-level active retrieval and self-correction benchmarks in production LLMs..."
                className="w-full text-xs font-sans bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
              />
              <p className="text-[11px] text-zinc-400">
                This will trigger a re-scout pass across OpenAlex, arXiv, and Semantic Scholar with your refined query constraints.
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
            {activeTab === "rerun" ? (
              <button
                onClick={handleRerun}
                disabled={!refinementQuery.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Trigger Re-Scout</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveEdits}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Save Filtered ({selectedIds.length} Papers)
                </button>
                <button
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Continue to Synthesizer</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
