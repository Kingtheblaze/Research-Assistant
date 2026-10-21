import React from "react";
import { Download, Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadReport: () => void;
  hasReport: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadReport,
  hasReport,
}) => {
  const navItems = [
    { id: "workflow", label: "Research Workflow" },
    { id: "literature_map", label: "Literature Map" },
    { id: "verification", label: "Claim Verification" },
    { id: "evaluation", label: "Comparative Benchmarks" },
    { id: "codebase", label: "Python Codebase" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand title, one line */}
        <a
          href="#workflow"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("workflow");
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Autonomous Research Agent</span>
        </a>

        {/* Zone 2: 4-5 nav links, 1-2 word labels, single-line */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 text-sm ${
                  isActive
                    ? "border-blue-600 text-blue-900 font-semibold"
                    : "border-transparent hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadReport}
            disabled={!hasReport}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              hasReport
                ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
