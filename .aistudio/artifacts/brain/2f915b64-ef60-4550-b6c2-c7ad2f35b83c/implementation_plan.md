# Autonomous Multi-Agent AI Research Assistant

A controllable, evidence-grounded research synthesis system orchestrating specialized agents via LangGraph to decompose research topics, scout and rank academic literature, detect research gaps, formulate testable hypotheses, verify claims against paper snippets, and write cited reports with human-in-the-loop checkpoints.

### User Review & Critical Decisions

> [!IMPORTANT]
> The system delivers both the production-grade Python LangGraph codebase (`project/`) with Streamlit, CLI, evaluation suites, and LM Studio configuration, along with an interactive live research workbench inside the web preview so you can immediately inspect agent execution, trigger human-in-the-loop checkpoints, view verification evidence, and compare benchmark metrics.

- **Confirmed Architecture**: Orchestrator-worker pattern using LangGraph stateful graph with 6 distinct agent nodes (`Planner` → `Scouts` → `Critic` → `Synthesizer` → `Claim Verifier` → `Report Writer`).
- **Human Checkpoints**: Two interactive approval gates: Checkpoint 1 (Literature Map review/edit/rerun) and Checkpoint 2 (Hypotheses and gap statement review/edit/regenerate).
- **LLM Backend**: Configured for local LM Studio (`http://localhost:1234/v1`) with fallback to OpenAI/Gemini-compatible formats or deterministic offline simulation when local ports are unavailable.
- **Evaluation Suite**: Rigorous quantitative comparison between the Multi-Agent system and a Single-Agent baseline measuring Literature Recall@K, Citation Precision, Claim Support Rate, Hallucinated Citation Rate, and Latency across gold benchmarks.

---

### 1. Overview & Core Concept

- **What It Does**: Given any user-specified research topic (e.g. *"Multi-Agent Coordination Under Latency Constraints"*, *"Retrieval-Augmented Generation Hallucination Mitigation"*), the system automatically decomposes the inquiry into sub-queries, queries academic repositories (arXiv Atom API and Semantic Scholar REST API), extracts and ranks papers, clusters literature into a thematic literature map, isolates unsolved research gaps, generates grounded testable hypotheses, strictly verifies all claims against extracted paper evidence snippets, and synthesizes a fully cited markdown research draft.
- **Target Audience / Persona**: AI researchers, graduate students, R&D engineers, and literature review authors requiring systematic, non-hallucinated academic exploration.
- **Key Value**: Replaces black-box LLM summaries with verifiable, claim-by-claim grounded academic literature synthesis with human oversight at critical junctures.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Topic Input & Parameter Config**: User enters topic, year filter (e.g. $\ge 2022$), maximum papers to scout, and relevance thresholds.
  2. **Live Graph Execution**: Visual node graph displays active agent transitions (`Planner` → `Scouts [Parallel]` → `Critic`).
  3. **Human Checkpoint 1 (Literature Map Gate)**: Execution halts after literature clustering and ranking. The user inspects ranked papers, cluster themes, and relevance scores. Actions: **Accept & Proceed**, **Edit/Remove Papers**, or **Re-run Scout with Query Feedback**.
  4. **Synthesis & Claim Verification**: `Synthesizer` derives gap statements and hypotheses; `Verifier` checks each claim against paper text snippets, tagging each as `Supported`, `Partially Supported`, or `Unsupported`.
  5. **Human Checkpoint 2 (Hypothesis & Gap Gate)**: User inspects grounded hypotheses and gap analysis, modifies statements or approves draft generation.
  6. **Final Report & Artifact Export**: Clean, publication-ready markdown report with verified inline citations, interactive evidence drawer, full bibliography, and one-click JSON run log download.
  7. **Evaluation Benchmark Dashboard**: Direct side-by-side comparison of Multi-Agent vs. Single-Agent baseline metrics across gold benchmark topics.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Publication-grade scientific workbench inspired by DeepMind Research and arXiv Labs.
  - *Color Palette*: Crisp lab white canvas (`#FFFFFF` / `#F8FAFC`), structural hairline dividers (`#E2E8F0`), deep ink typography (`#0F172A`), calibrated scientific cobalt accent (`#1D4ED8` / `#2563EB`), emerald for verified claims (`#059669`), and amber for flagged claims (`#D97706`).
  - *Typography*: Clean neo-grotesque sans (`Plus Jakarta Sans` / `Inter`) paired with tabular monospace (`JetBrains Mono` / `font-mono tabular-nums`) for paper IDs, scores, and timestamps.
- **Interactive Controls & Discipline**:
  - Zero-pill metadata: Paper metadata rendered as clean unboxed text with `·` separators.
  - Interactive filter tabs for paper domains and verification states.
  - No decorative status dots or fake telemetry tickers; all status badges reflect real LangGraph state transitions.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: LangGraph State Machine Architecture**:
  - *Chosen Approach*: LangGraph `StateGraph(ResearchState)` with conditional edges and interruptible breakpoints (`interrupt_before=["synthesizer_checkpoint", "writer_checkpoint"]`).
  - *Why*: Provides native cyclic capability, persistence via `MemorySaver` or SQLite checkpoints, and deterministic resumption after human overrides.
  - *Alternatives Considered*: Custom while-loop orchestrator (lacks standard state checkpointing and graph inspection).
- **Decision 2: Claim Verification Engine**:
  - *Chosen Approach*: Dual-pass verification: N-gram lexical overlap + semantic cosine similarity using sentence-transformers (or lightweight local embeddings) + LLM entailment check against retrieved paper abstract/full-text chunks.
  - *Why*: Guarantees that no synthetic claim is included in the final report without citing an exact sentence or paragraph from retrieved literature.
  - *Alternatives Considered*: Pure LLM self-reflection (prone to recurrent hallucinations).
- **Decision 3: Evaluation Benchmark Suite & Single-Agent Baseline**:
  - *Chosen Approach*: Formal evaluation module in `project/app/metrics/evaluator.py` featuring 3 curated gold benchmark topics with known seminal papers, computing Recall@K, Citation Precision, Claim Support Rate, and Hallucination Rate against both Multi-Agent and Single-Agent baselines.
  - *Why*: Quantitatively demonstrates the necessity and performance gains of multi-agent decomposition and verification.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER TOPIC & CONSTRAINTS                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │     PLANNER AGENT     │
                        │ Decompose Sub-queries │
                        └───────────┬───────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
     ┌───────────────────┐┌───────────────────┐┌───────────────────┐
     │  SCOUT AGENT #1   ││  SCOUT AGENT #2   ││  SCOUT AGENT #3   │
     │    arXiv Atom     ││ Semantic Scholar  ││ CrossRef / Local  │
     └─────────┬─────────┘└─────────┬─────────┘└─────────┬─────────┘
               └────────────────────┼────────────────────┘
                                    ▼
                        ┌───────────────────────┐
                        │     CRITIC AGENT      │
                        │ Dedupe, Filter, Rank  │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   HUMAN CHECKPOINT 1  │
                        │ (Accept / Edit / Rerun│
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   SYNTHESIZER AGENT   │
                        │ Map, Gaps, Hypotheses │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ CLAIM VERIFICATION    │
                        │ Snippet Entailment    │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   HUMAN CHECKPOINT 2  │
                        │ (Accept / Edit / Rerun│
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  REPORT WRITER AGENT  │
                        │ Grounded Markdown Doc │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   FINAL ARTIFACTS     │
                        │ Report, Map, Logs, UI │
                        └───────────────────────┘
```

- **Folder Structure for Python Deliverable (`project/`)**:
  - `project/requirements.txt`: `langgraph>=0.2.0`, `langchain-openai>=0.1.0`, `pydantic>=2.0.0`, `requests`, `pypdf`/`pymupdf`, `sentence-transformers`, `streamlit`, `pyyaml`, `python-dotenv`, `pytest`.
  - `project/configs/default.yaml`: Base URL (`http://localhost:1234/v1`), model name, temperature settings, scout parallel count, similarity thresholds.
  - `project/app/schemas/state.py`: Complete Pydantic v2 schemas: `Paper`, `ResearchPlan`, `LiteratureCluster`, `LiteratureMap`, `Hypothesis`, `ClaimVerification`, `OverrideEvent`, `ResearchState`.
  - `project/app/tools/arxiv_search.py`: Clean arXiv Atom search client with query building, XML parsing, and field extraction.
  - `project/app/tools/semantic_scholar.py`: Semantic Scholar API client with paper recommendation and citation count lookup.
  - `project/app/tools/pdf_extractor.py`: PDF snippet extractor for full-text grounding.
  - `project/app/tools/embeddings.py`: Cosine similarity and semantic retrieval helper.
  - `project/app/agents/`: Individual agent modules (`planner.py`, `scout.py`, `critic.py`, `synthesizer.py`, `verifier.py`, `writer.py`).
  - `project/app/graph/orchestrator.py`: Stateful LangGraph definition with interrupts and resumption logic.
  - `project/app/graph/single_agent_baseline.py`: Monolithic agent execution for controlled evaluation.
  - `project/app/metrics/evaluator.py`: Metric calculation engine.
  - `project/app/ui/streamlit_app.py`: Streamlit interactive application.
  - `project/data/gold_benchmarks.json`: Ground-truth datasets for 3 distinct research topics.
  - `project/data/sample_runs/`: Complete serializable output JSON and reports from end-to-end runs.
  - `project/tests/`: Unit and integration test suite (`test_agents.py`, `test_graph.py`, `test_metrics.py`).
  - `project/README.md`: Step-by-step setup guide for LM Studio, CLI commands, Streamlit launch instructions, and mermaid architecture diagram.
- **Interactive Web Preview**:
  - High-fidelity React workbench implementing the complete workflow:
    - Real-time agent graph visualizer with live step-by-step telemetry.
    - Interactive Human Checkpoints 1 & 2 with live editing and re-run branching.
    - Literature Map clustering view with paper inspection drawers and PDF links.
    - Verified Claim Inspector highlighting grounded vs. flagged statements with exact source paper snippets.
    - Side-by-side Multi-Agent vs. Single-Agent evaluation comparison matrix with charts.
    - Codebase Browser to view and download all Python modules, configs, and sample runs.
