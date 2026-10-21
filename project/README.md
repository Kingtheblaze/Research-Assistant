# Autonomous Multi-Agent AI Research Assistant

A controllable, evidence-grounded research synthesis system built on **LangGraph**, **Pydantic v2**, and local **LM Studio** (or OpenAI-compatible) LLMs. Given an academic research topic, the system automatically decomposes the inquiry, scouts and cross-checks preprints and papers (via arXiv and Semantic Scholar), clusters findings into a thematic literature map, articulates unresolved research gaps, formulates grounded hypotheses, verifies claims against extracted snippets, and writes cited markdown reports with **human-in-the-loop checkpoints**.

```
                           [ User Research Topic ]
                                      │
                                      ▼
                             ┌─────────────────┐
                             │  Planner Agent  │ (Decompose sub-queries & criteria)
                             └────────┬────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │ Scout Agent #1  │  │ Scout Agent #2  │  │ Scout Agent #3  │ (Parallel)
        │   arXiv Atom    │  │ Semantic Scholar│  │ CrossRef/Local  │
        └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
                 └────────────────────┼────────────────────┘
                                      ▼
                             ┌─────────────────┐
                             │  Critic Agent   │ (Dedupe, filter, rank by relevance)
                             └────────┬────────┘
                                      │
                                      ▼
                        ╔═════════════════════════════╗
                        ║     HUMAN CHECKPOINT 1      ║
                        ║ (Accept / Edit / Re-scout)  ║
                        ╚═════════════════════════════╝
                                      │
                                      ▼
                             ┌─────────────────┐
                             │Synthesizer Agent│ (Literature map, gap, hypotheses)
                             └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ Claim Verifier  │ (Snippet-level entailment check)
                             └────────┬────────┘
                                      │
                                      ▼
                        ╔═════════════════════════════╗
                        ║     HUMAN CHECKPOINT 2      ║
                        ║ (Accept / Edit / Regenerate)║
                        ╚═════════════════════════════╝
                                      │
                                      ▼
                             ┌─────────────────┐
                             │  Report Writer  │ (Cited, publication-grade markdown)
                             └────────┬────────┘
                                      │
                                      ▼
                            [ Verified Report.md ]
```

---

## 1. Prerequisites & Quickstart

### Python Version
- **Python 3.11+** recommended.

### Installation
Clone or navigate to the project directory and create a virtual environment:
```bash
cd project
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 2. Local LLM Setup (LM Studio)

By default, the assistant is configured to run locally against **LM Studio** without external API costs or data leakage:

1. **Download & Install LM Studio**: From [lmstudio.ai](https://lmstudio.ai).
2. **Download an Instruct Model**:
   - Recommended: `Qwen2.5-7B-Instruct`, `Mistral-7B-Instruct-v0.3`, or `Llama-3.1-8B-Instruct`.
3. **Start the Local Server**:
   - In LM Studio, click the **Local Server** (double-arrow `<->` icon) tab on the left.
   - Select your loaded model from the top dropdown.
   - Click **Start Server** (Server will listen at `http://localhost:1234/v1`).
4. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure:
   ```env
   LM_STUDIO_BASE_URL="http://localhost:1234/v1"
   OPENAI_API_KEY="lm-studio"
   MODEL_NAME="qwen2.5-7b-instruct"
   TEMPERATURE=0.2
   ```

*Note: If LM Studio is not active, the system automatically falls back to deterministic rule-based synthesis for offline testing and continuous integration.*

---

## 3. Running the Applications

### A. Interactive Streamlit Interface (with Checkpoints)
To launch the interactive dashboard with human-in-the-loop controls:
```bash
streamlit run project/app/ui/streamlit_app.py
```
- Input your research topic.
- Review and edit scouted literature at **Checkpoint 1**.
- Inspect gap statements and claim verification flags at **Checkpoint 2**.
- Download publication-grade markdown reports and state JSON logs.

### B. Command-Line Interface (CLI)
Run end-to-end literature synthesis directly from the terminal:
```bash
# Interactive mode (prompts for checkpoints):
python project/run_cli.py --topic "Multi-Agent Coordination Under Latency Constraints" --output data/runs/report.md

# Non-interactive batch mode (auto-accept checkpoints):
python project/run_cli.py --topic "Retrieval-Augmented Generation Hallucination Mitigation" --auto-accept
```

---

## 4. Evaluation Suite & Benchmark Comparison

The system implements a quantitative evaluation module comparing the **Multi-Agent Assistant** against an unverified **Single-Agent Baseline** using the same underlying tools.

Run the benchmark suite:
```bash
python project/run_evaluation.py
```

### Metrics Computed:
| Metric | Description | Target |
| :--- | :--- | :--- |
| **Literature Recall@5** | Fraction of gold benchmark papers retrieved in top-5 | $\ge 75\%$ |
| **Citation Precision** | Ratio of valid cited papers to total cited papers | $100\%$ |
| **Claim Support Rate** | Percentage of claims confirmed by snippet verification | $\ge 85\%$ |
| **Hallucinated Citation Rate**| Citations in text not found in scouted corpus | $0.0\%$ |
| **Relevance Precision@5** | Fraction of top-5 papers with relevance $\ge 0.70$ | $\ge 80\%$ |
| **Gap Quality (1-5)** | Specificity and grounding of the research gap statement | $\ge 4.0$ |
| **Hypothesis Usefulness (1-5)**| Falsifiability and grounding of generated hypotheses | $\ge 4.0$ |
| **Latency** | End-to-end execution wall time in seconds | Traceable |

---

## 5. Running Automated Unit & Integration Tests

Execute the pytest suite:
```bash
pytest project/tests -v
```
All schemas, agents, checkpoint routers, and metric calculations are covered.

---

## 6. Directory Structure
```
project/
├── app/
│   ├── agents/            # Planner, Scout, Critic, Synthesizer, Verifier, Writer
│   │   ├── planner.py
│   │   ├── scout.py
│   │   ├── critic.py
│   │   ├── synthesizer.py
│   │   ├── verifier.py
│   │   ├── writer.py
│   │   └── llm_client.py
│   ├── graph/             # LangGraph stateful graph & Single-Agent baseline
│   │   ├── orchestrator.py
│   │   └── single_agent_baseline.py
│   ├── metrics/           # Evaluation metrics engine
│   │   └── evaluator.py
│   ├── schemas/           # Pydantic v2 schemas
│   │   └── state.py
│   ├── tools/             # arXiv, Semantic Scholar, PyMuPDF, Embeddings
│   │   ├── arxiv_search.py
│   │   ├── semantic_scholar.py
│   │   ├── pdf_extractor.py
│   │   └── embeddings.py
│   └── ui/                # Streamlit user interface
│       └── streamlit_app.py
├── configs/
│   └── default.yaml       # Configurable models, thresholds, and endpoints
├── data/
│   ├── gold_benchmarks.json
│   └── sample_runs/
│       ├── sample_research_report.md
│       └── sample_multi_agent_run.json
├── tests/
│   ├── test_schemas.py
│   ├── test_agents.py
│   └── test_metrics.py
├── requirements.txt
├── run_cli.py
├── run_evaluation.py
└── README.md
```
