export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  source: "arxiv" | "semantic_scholar" | "openalex" | "local_corpus" | "manual";
  key_claims: string[];
  relevance_score: number;
  citation_count?: number;
  venue?: string;
  full_text_snippet?: string;
}

export interface ResearchPlan {
  topic: string;
  sub_queries: string[];
  success_criteria: string[];
  domain_tags: string[];
  year_filter_min?: number;
}

export interface LiteratureCluster {
  cluster_id: string;
  theme_name: string;
  description: string;
  paper_ids: string[];
  representative_claims: string[];
}

export interface LiteratureMap {
  topic: string;
  total_papers_analyzed: number;
  clusters: LiteratureCluster[];
  consensus_points: string[];
  contested_points: string[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  rationale: string;
  grounding_paper_ids: string[];
  testability_score: number;
  novelty_score: number;
  suggested_methodology?: string;
}

export interface ClaimVerification {
  claim_id: string;
  claim_text: string;
  cited_paper_id: string;
  status: "supported" | "partially_supported" | "unsupported" | "hallucination";
  similarity_score: number;
  evidence_snippet: string;
  verdict_explanation: string;
}

export interface OverrideEvent {
  checkpoint_name: "checkpoint_1_literature_map" | "checkpoint_2_hypotheses_and_gap";
  action: "accept" | "edit" | "rerun";
  timestamp: string;
  notes?: string;
  modified_keys: string[];
}

export interface ResearchMetrics {
  literature_recall_at_k: number;
  citation_precision: number;
  claim_support_rate: number;
  hallucinated_citation_rate: number;
  relevance_precision_at_k: number;
  gap_quality_score: number;
  hypothesis_usefulness_score: number;
  human_override_rate: number;
  latency_seconds: number;
  papers_retrieved_count?: number;
  citations_count?: number;
}

export interface ResearchState {
  topic: string;
  plan?: ResearchPlan;
  papers: Paper[];
  literature_map?: LiteratureMap;
  gap_statement: string;
  hypotheses: Hypothesis[];
  verification_results: ClaimVerification[];
  draft_report: string;
  logs: string[];
  human_overrides: OverrideEvent[];
  metrics: ResearchMetrics;
  current_node: string;
  waiting_for_human: boolean;
  pending_checkpoint?: string | null;
  iteration: number;
}

export interface BenchmarkComparisonItem {
  topic: string;
  domain: string;
  multi_agent: ResearchMetrics;
  single_agent_baseline: ResearchMetrics;
}
