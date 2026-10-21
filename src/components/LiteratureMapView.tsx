import React, { useState } from "react";
import { LiteratureMap, Paper } from "../types";
import { Layers, FileText, CheckCircle2, AlertOctagon, ExternalLink, Search, Filter, Database, BookOpen } from "lucide-react";

interface LiteratureMapViewProps {
  literatureMap?: LiteratureMap;
  papers: Paper[];
  gapStatement: string;
}

export const LiteratureMapView: React.FC<LiteratureMapViewProps> = ({
  literatureMap,
  papers,
  gapStatement,
}) => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(papers[0] || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || p.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "openalex":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
            OpenAlex 250M+
          </span>
        );
      case "arxiv":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/40">
            arXiv
          </span>
        );
      case "semantic_scholar":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-800/40">
            S2 Graph
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Clusters and Consensus Section */}
      {literatureMap && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clusters Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Thematic Literature Clusters ({literatureMap.clusters.length})</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                {literatureMap.total_papers_analyzed} Papers Synthesized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {literatureMap.clusters.map((cluster) => (
                <div
                  key={cluster.cluster_id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4.5 space-y-3 hover:border-zinc-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                      {cluster.cluster_id}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {cluster.paper_ids.length} Grounding Papers
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-100 mt-0.5 leading-snug">
                    {cluster.theme_name}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{cluster.description}</p>

                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">Representative Claim:</span>
                    <p className="text-xs text-zinc-300 italic">
                      "{cluster.representative_claims[0] || 'Empirical evidence across benchmark tasks.'}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cluster.paper_ids.map((pid) => (
                      <button
                        key={pid}
                        onClick={() => {
                          const p = papers.find((item) => item.id === pid);
                          if (p) setSelectedPaper(p);
                        }}
                        className="text-[10px] font-mono bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {pid}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Gap Statement Callout */}
            {gapStatement && (
              <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs space-y-1.5">
                <span className="font-mono font-semibold uppercase tracking-wider text-amber-400 text-[10px] block">
                  Identified Research Gap
                </span>
                <p className="text-zinc-200 leading-relaxed">{gapStatement}</p>
              </div>
            )}
          </div>

          {/* Consensus vs Contested Column */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Methodological Landscape
            </h3>

            {/* Consensus Points */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Consensus Methodologies</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                {literatureMap.consensus_points.map((cp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {cp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contested Points */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Contested Controversies</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                {literatureMap.contested_points.map((ctp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {ctp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Scouted Literature Table and Inspector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/70">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Federated Ranked Literature Corpus ({filteredPapers.length})</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Harvested across OpenAlex (250M+ Works), arXiv API, and Semantic Scholar Graph
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search title, ID, claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-zinc-700 bg-zinc-950 rounded-lg w-56 focus:outline-none focus:border-emerald-500 text-zinc-100 font-mono"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-zinc-700 bg-zinc-950 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Repositories</option>
              <option value="openalex">OpenAlex (250M+ Works)</option>
              <option value="arxiv">arXiv API</option>
              <option value="semantic_scholar">Semantic Scholar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          {/* Table List */}
          <div className="lg:col-span-7 overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/90 border-b border-zinc-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-zinc-400">Repository & ID</th>
                  <th className="py-2.5 px-3 font-semibold text-zinc-400">Title</th>
                  <th className="py-2.5 px-3 font-semibold text-zinc-400">Year</th>
                  <th className="py-2.5 px-3 font-semibold text-zinc-400">Relevance</th>
                  <th className="py-2.5 px-3 font-semibold text-zinc-400">Citations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredPapers.map((paper) => {
                  const isSelected = selectedPaper?.id === paper.id;
                  return (
                    <tr
                      key={paper.id}
                      onClick={() => setSelectedPaper(paper)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-zinc-800/80 text-zinc-100"
                          : "hover:bg-zinc-800/40 text-zinc-300"
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap space-y-1">
                        <div className="font-mono text-emerald-400 font-medium text-[11px]">
                          {paper.id}
                        </div>
                        <div>{getSourceBadge(paper.source)}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-200 max-w-xs truncate">
                        {paper.title}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">{paper.year}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-emerald-400">
                          {(paper.relevance_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">
                        {paper.citation_count || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Details Inspector */}
          <div className="lg:col-span-5 p-5 bg-zinc-950/70 space-y-4 max-h-[480px] overflow-y-auto">
            {selectedPaper ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-emerald-400">{selectedPaper.id}</span>
                      {getSourceBadge(selectedPaper.source)}
                    </div>
                    <a
                      href={selectedPaper.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-emerald-400 hover:underline text-[11px]"
                    >
                      <span>Direct Article</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                    {selectedPaper.title}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {selectedPaper.authors.join(", ")} ({selectedPaper.year})
                    {selectedPaper.venue && ` · ${selectedPaper.venue}`}
                  </p>
                </div>

                <div>
                  <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Abstract (Full Context)
                  </h5>
                  <p className="text-xs text-zinc-300 leading-relaxed max-h-40 overflow-y-auto bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    {selectedPaper.abstract}
                  </p>
                </div>

                {selectedPaper.key_claims && selectedPaper.key_claims.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Extracted Empirical Claims
                    </h5>
                    <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                      {selectedPaper.key_claims.map((claim, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {claim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-xs text-zinc-500">
                Select a paper row to inspect abstract and empirical claims.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
