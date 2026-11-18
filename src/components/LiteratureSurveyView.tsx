import React, { useState } from "react";
import { TABLE_1_PRIOR_ART, SURVEY_MODULES, RESEARCH_GAPS_AND_OBJECTIVES } from "../data/mockData";
import { PriorArtItem } from "../types";
import {
  BookOpen,
  FileText,
  Search,
  Filter,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
  Target,
  GitBranch,
  ShieldCheck,
  Award,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";

export const LiteratureSurveyView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModuleNumber, setActiveModuleNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(false);

  const categories = [
    { id: "all", label: "All Prior Art (11 Works)" },
    { id: "retrieval_rag", label: "Retrieval & RAG (Module 1)" },
    { id: "hypothesis_generation", label: "Hypothesis Gen (Module 2)" },
    { id: "multi_agent", label: "Multi-Agent Systems (Module 3)" },
    { id: "novelty_evaluation", label: "Novelty & Evaluation (Module 4)" },
  ];

  const filteredPriorArt = TABLE_1_PRIOR_ART.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.approach.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.advantages.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.limitations_relevance.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeModule = SURVEY_MODULES.find((m) => m.number === activeModuleNumber) || SURVEY_MODULES[0];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Course & Literature Survey Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-bold">
                SKILL LAB – Generative AI · CIL75 · 2026
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Official Syllabus Survey Reference
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Autonomous Multi-Agent AI Research Assistant
            </h1>
            <p className="text-sm font-medium text-emerald-400/90 font-mono">
              Evidence-Grounded Research-Gap Identification and Hypothesis Generation
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              An experimentally evaluated research workflow that connects academic literature discovery, cross-paper synthesis, evidence-grounded research-gap identification, hypothesis generation and claim-level verification. The project investigates whether a specialised multi-agent workflow improves research outcomes compared with a controlled single-agent LLM baseline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <a
              href="/assets/aistudio/Autonomous_Multi_Agent_Research_Assistant_Literature_Survey_321e8426.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Survey PDF (8 Pages)</span>
            </a>
            <button
              onClick={() => setShowPdfViewer(!showPdfViewer)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>{showPdfViewer ? "Hide PDF Embed" : "Toggle PDF Embed"}</span>
            </button>
          </div>
        </div>

        {/* Embedded PDF Drawer */}
        {showPdfViewer && (
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Reference Document: /public/assets/aistudio/Autonomous_Multi_Agent_Research_Assistant_Literature_Survey_321e8426.pdf</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">CIL75 2026 Academic Syllabus</span>
            </div>
            <div className="w-full h-[600px] rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950">
              <iframe
                src="/assets/aistudio/Autonomous_Multi_Agent_Research_Assistant_Literature_Survey_321e8426.pdf"
                className="w-full h-full border-none"
                title="CIL75 Literature Survey PDF"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: CORE RESEARCH QUESTION & DEFENSIVE POSITIONING */}
      <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Section 6: Proposed Central Research Question
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50">
            CIL75 Formal Hypothesis
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-100 italic bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800 leading-relaxed font-sans">
          "{RESEARCH_GAPS_AND_OBJECTIVES.researchQuestion}"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400 pt-1">
          <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/70">
            <strong className="text-zinc-200 block mb-1">What the project DOES claim:</strong>
            Evaluating whether an inspectable cross-paper evidence chain linking retrieved passage snippets to gap statements and falsifiable hypotheses outperforms a matched-budget single-agent baseline.
          </div>
          <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/70">
            <strong className="text-zinc-200 block mb-1">What the project DOES NOT claim:</strong>
            The project does <span className="text-amber-300 font-semibold">not</span> claim that multi-agent orchestration, literature search, or idea generation is novel in itself, treating Lewis et al., HypER, and AutoGen as prior art.
          </div>
        </div>
      </div>

      {/* 6 MODULES EXPLORER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>The 6 Surveyed Architectural Modules</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structured analysis from Section 2 of the literature survey
          </p>
        </div>

        {/* Module Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SURVEY_MODULES.map((m) => (
            <button
              key={m.number}
              onClick={() => setActiveModuleNumber(m.number)}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                activeModuleNumber === m.number
                  ? "bg-zinc-800 border-emerald-500/60 shadow-xs"
                  : "bg-zinc-950 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400"
              }`}
            >
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Module 0{m.number}</span>
              <span className="text-xs font-semibold text-zinc-200 line-clamp-2 mt-1 leading-tight">
                {m.title.split(" ")[0]} {m.title.split(" ")[1]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Module Card */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                Module {activeModule.number}:
              </span>
              <h4 className="text-sm font-semibold text-zinc-100">{activeModule.title}</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 w-fit">
              {activeModule.status}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {activeModule.summary}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Core Prior Art:</span>
            {activeModule.keyReferences.map((ref, idx) => (
              <span key={idx} className="font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 text-[11px]">
                {ref}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE 1: COMPARATIVE LITERATURE SURVEY MATRIX */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Table 1: Comparative Literature Survey of Representative Prior Art</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              11 foundational systems, frameworks, and evaluation benchmarks from Section 3 of the CIL75 survey
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search authors, approach, datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 w-56 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-800 pb-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? "bg-zinc-800 text-emerald-300 font-semibold border border-emerald-500/40"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-44">Author / Work</th>
                <th className="py-2.5 px-4 font-semibold w-64">Approach</th>
                <th className="py-2.5 px-4 font-semibold w-48">Dataset / Evaluation</th>
                <th className="py-2.5 px-4 font-semibold w-60">Key Advantages</th>
                <th className="py-2.5 px-4 font-semibold">Limitations / Project Relevance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
              {filteredPriorArt.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors align-top">
                  <td className="py-3 px-4 font-semibold text-emerald-400 font-mono text-[11px]">
                    {item.authors}
                    <span className="block text-[10px] text-zinc-500 font-normal mt-0.5">
                      ({item.year})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-200 leading-relaxed">
                    {item.approach}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                    {item.dataset_evaluation}
                  </td>
                  <td className="py-3 px-4 text-zinc-300 leading-relaxed">
                    {item.advantages}
                  </td>
                  <td className="py-3 px-4 text-amber-200/90 bg-amber-950/10 leading-relaxed font-sans">
                    {item.limitations_relevance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4 & 5: RESEARCH GAPS (G1-G3) & OBJECTIVES (O1-O3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specific Research Gaps (G1, G2, G3) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Section 4.1: Specific Research Gaps (G1 – G3)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">Unresolved Literature Bottlenecks</span>
          </div>

          <div className="space-y-3">
            {RESEARCH_GAPS_AND_OBJECTIVES.gaps.map((gap) => (
              <div key={gap.id} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {gap.id} — {gap.title}
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
                    Mapped to {gap.addressedBy}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {gap.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Refined Project Objectives (O1, O2, O3) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Section 5: Refined Project Objectives (O1 – O3)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">Concrete Deliverables</span>
          </div>

          <div className="space-y-3">
            {RESEARCH_GAPS_AND_OBJECTIVES.objectives.map((obj) => (
              <div key={obj.id} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {obj.id} — {obj.title}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">
                    Active in Pipeline
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {obj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
