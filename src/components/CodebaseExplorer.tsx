import React, { useState } from "react";
import { PYTHON_CODE_FILES } from "../data/mockData";
import { FileCode, Copy, Check, Terminal, Download, Sparkles, Folder, FileText } from "lucide-react";

export const CodebaseExplorer: React.FC = () => {
  const fileKeys = Object.keys(PYTHON_CODE_FILES);
  const [selectedKey, setSelectedKey] = useState<string>("tools/openalex_search.py" in PYTHON_CODE_FILES ? "tools/openalex_search.py" : fileKeys[0]);
  const [copied, setCopied] = useState(false);

  const activeFile = PYTHON_CODE_FILES[selectedKey] || PYTHON_CODE_FILES[fileKeys[0]];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = selectedKey.split("/").pop() || "code.py";
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-zinc-100 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Python Production Codebase (`project/`)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Production-ready Python 3.11+ LangGraph stateful multi-agent system with OpenAlex 250M+ connector, federated scout, and claim verifier.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-700/60 text-emerald-400 font-medium">OpenAlex 250M+</span>
          <span className="bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/60">Python 3.11+</span>
          <span className="bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/60">LangGraph 0.2+</span>
        </div>
      </div>

      {/* Explorer Split */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] shadow-sm">
        {/* File List */}
        <div className="md:col-span-4 border-r border-zinc-800 bg-zinc-950/70 p-3 space-y-1">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Project Modules ({fileKeys.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">OpenAlex Ready</span>
          </div>

          <div className="space-y-1">
            {fileKeys.map((key) => {
              const item = PYTHON_CODE_FILES[key];
              const isSelected = selectedKey === key;
              const isOpenAlex = key.includes("openalex") || key.includes("scout");
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700/80 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                    <span className="font-mono truncate">{key}</span>
                  </div>
                  {isOpenAlex && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 shrink-0">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code View Pane */}
        <div className="md:col-span-8 flex flex-col bg-zinc-950 text-zinc-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div>
              <span className="font-mono text-xs text-emerald-400 font-medium">{activeFile.path}</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">{activeFile.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-700/60"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-700/60 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="flex-1 p-4 overflow-x-auto overflow-y-auto max-h-[520px]">
            <pre className="font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
