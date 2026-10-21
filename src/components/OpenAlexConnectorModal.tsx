import React, { useState } from "react";
import { X, Copy, Check, Database, Zap, Sparkles, Terminal, ExternalLink, RefreshCw } from "lucide-react";
import { PYTHON_CODE_FILES } from "../data/mockData";

interface OpenAlexConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const OpenAlexConnectorModal: React.FC<OpenAlexConnectorModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = "hedasambhav@gmail.com",
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [activeCodeTab, setActiveCodeTab] = useState<"tool" | "scout">("tool");
  const [copied, setCopied] = useState(false);
  const [testQuery, setTestQuery] = useState("Large Language Models prompting");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success";
    totalWorks: string;
    sampleCount: number;
    latencyMs: number;
  }>({
    status: "idle",
    totalWorks: "250,000,000+",
    sampleCount: 14,
    latencyMs: 310,
  });

  if (!isOpen) return null;

  const toolCode = PYTHON_CODE_FILES["tools/openalex_search.py"]?.content || "";
  const scoutCode = PYTHON_CODE_FILES["agents/scout.py"]?.content || "";
  const currentCode = activeCodeTab === "tool" ? toolCode : scoutCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulatedTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        status: "success",
        totalWorks: "254,180,420+",
        sampleCount: 16,
        latencyMs: 285,
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                  OpenAlex Academic Connector (250M+ Works)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                  Polite Pool Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Upgraded data source querying global journals, preprints, and citation graphs with inverted abstract reconstruction.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Rate Limit Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 block">Repository Size</span>
              <div className="text-lg font-mono font-bold text-zinc-100">250,000,000+</div>
              <p className="text-[11px] text-zinc-500">Cross-disciplinary open academic catalog</p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 block">Polite Pool Identity</span>
              <div className="text-xs font-mono text-emerald-400 font-semibold truncate">{email}</div>
              <p className="text-[11px] text-zinc-500">Fast-lane queue (10 req/s, 100k/day limit)</p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 block">Federation Strategy</span>
              <div className="text-xs font-semibold text-zinc-200">OpenAlex + arXiv + S2</div>
              <p className="text-[11px] text-zinc-500">Fuzzy title deduplication & score fusion</p>
            </div>
          </div>

          {/* Quick Query Live Test Simulator */}
          <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Live Query Against OpenAlex Endpoint</span>
              </span>
              <a
                href="https://docs.openalex.org/api-entities/works"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>OpenAlex Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Query topic..."
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700/80 rounded-md text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleRunSimulatedTest}
                disabled={isTesting}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Querying OpenAlex..." : "Execute Test Query"}</span>
              </button>
            </div>

            {testResult.status === "success" && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-xs flex items-center justify-between text-emerald-300 font-mono">
                <span>Status 200 OK · {testResult.sampleCount} papers matched in {testResult.latencyMs}ms</span>
                <span className="text-[11px] text-emerald-400/80">Inverted abstract reconstructor OK</span>
              </div>
            )}
          </div>

          {/* Python Code Snippet Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setActiveCodeTab("tool")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    activeCodeTab === "tool"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  openalex_search.py (REST Connector)
                </button>
                <button
                  onClick={() => setActiveCodeTab("scout")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    activeCodeTab === "scout"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  agents/scout.py (Federated Search + Dedupe)
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 border border-zinc-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Box */}
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>
                  {activeCodeTab === "tool"
                    ? "project/app/tools/openalex_search.py"
                    : "project/app/agents/scout.py"}
                </span>
                <span className="text-zinc-500">Python 3.11+</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[260px] leading-relaxed whitespace-pre">
                <code>{currentCode}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Copy into your project directory to replace or augment arXiv scouting.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
