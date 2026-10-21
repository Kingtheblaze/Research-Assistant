"""
Senior-Level Streamlit UI for Autonomous Multi-Agent AI Research Assistant.
Implements expert UI design principles:
- Clear hierarchy: Title -> Status -> Input -> Actions -> Results
- Persistent status strip: LLM connection, persistence backend, run state
- 2-column layout: Left input / Right workflow stepper & human checkpoints
- Clean results tabs: Literature Map, Research Gap, Hypotheses, Verification, Draft Report
- Robust reset logic to prevent topic mismatches and ensure clean markdown reports
- Integrated PDF Export via markdown + xhtml2pdf / ReportLab
"""

import os
import json
import streamlit as st
import pandas as pd
from datetime import datetime
from pathlib import Path

from project.app.graph.orchestrator import ResearchAssistantPipeline
from project.app.schemas.state import ResearchState, Paper
from project.app.tools.persistence import save_run_state, list_saved_runs
from project.app.metrics.evaluator import compute_metrics_for_state, run_benchmark_comparison
from project.app.utils.pdf_export import markdown_to_pdf

st.set_page_config(
    page_title="Research Assistant",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ---- Minimal Expert CSS ----
st.markdown("""
<style>
    .block-container {padding-top: 1.2rem; padding-bottom: 2rem; max-width: 1240px;}
    h1 {font-size: 1.65rem !important; font-weight: 700 !important; letter-spacing: -0.02em; margin-bottom: 0.2rem;}
    .subtitle {color: #6b7280; font-size: 0.95rem; margin-top: -0.4rem; margin-bottom: 1.2rem;}
    .status-pill {
        display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.75rem; border-radius: 999px;
        font-size: 0.78rem; font-weight: 600;
    }
    .ok {background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;}
    .warn {background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;}
    .info {background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;}
    .status-card {
        background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
        padding: 0.65rem 0.9rem; font-size: 0.85rem;
    }
    .step {
        border-left: 3px solid #e5e7eb; padding-left: 0.8rem; margin-bottom: 0.6rem;
        color: #6b7280; font-size: 0.88rem; transition: all 0.2s ease;
    }
    .step.active {border-left-color: #2563eb; color: #111827; font-weight: 600;}
    .step.done {border-left-color: #10b981; color: #065f46; font-weight: 500;}
    .paper-card {
        background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px;
        padding: 0.85rem 1rem; margin-bottom: 0.75rem;
    }
    .badge-supported {
        background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
        padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    }
    .badge-partial {
        background: #fffbeb; color: #b45309; border: 1px solid #fde68a;
        padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    }
    .badge-flagged {
        background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
        padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    }
    .card {
        background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px;
        padding: 0.85rem 1rem; margin-bottom: 0.75rem;
    }
</style>
""", unsafe_allow_html=True)


def init_session_state():
    if "pipeline" not in st.session_state:
        st.session_state.pipeline = ResearchAssistantPipeline()
    if "state" not in st.session_state:
        st.session_state.state = None
    if "stage" not in st.session_state:
        st.session_state.stage = "idle"  # idle -> at_checkpoint_1 -> at_checkpoint_2 -> complete
    if "topic_input" not in st.session_state:
        st.session_state.topic_input = "Large Language Models prompting"
    if "topic" not in st.session_state:
        st.session_state.topic = "Large Language Models prompting"
    if "artifacts" not in st.session_state:
        st.session_state.artifacts = {
            "literature_map": None,
            "gap": None,
            "hypotheses": None,
            "verification": None,
            "report": None,
            "logs": [],
        }


init_session_state()

# ---- Sidebar: SQLite Run History ----
with st.sidebar:
    st.markdown("### 🗄️ Run History")
    runs = list_saved_runs("./data/runs.db")
    if runs:
        for r in runs[:6]:
            with st.expander(f"📄 {r['topic'][:35]}...", expanded=False):
                st.caption(f"Run ID: `{r['run_id']}`")
                st.caption(f"Papers: {r['paper_count']} · Grounding: {r['claim_support_rate']*100:.0f}%")
                st.caption(f"Time: {r['timestamp'][:19]}")
    else:
        st.caption("No past SQLite runs found.")

# ---- 1. Header with Live Status ----
c1, c2 = st.columns([4, 1.2])
with c1:
    st.markdown("# Autonomous Multi-Agent Research Assistant")
    st.markdown('<div class="subtitle">Literature discovery → gap analysis → grounded hypotheses → verified report</div>', unsafe_allow_html=True)
with c2:
    st.markdown(
        '<div style="text-align: right; padding-top: 0.5rem;">'
        '<span class="status-pill ok">● Connected</span>'
        '</div>',
        unsafe_allow_html=True
    )

# ---- 2. Status Strip ----
s1, s2, s3 = st.columns(3)
with s1:
    st.markdown("""
    <div class="status-card">
        <span style="color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">LLM Backend</span><br/>
        <strong>localhost:1234</strong> · <span style="color: #4b5563;">llama-3.1-8b-instruct</span>
    </div>
    """, unsafe_allow_html=True)

with s2:
    st.markdown("""
    <div class="status-card">
        <span style="color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Persistence</span><br/>
        <strong>SQLite</strong> · <span style="color: #4b5563;">./data/runs.db</span>
    </div>
    """, unsafe_allow_html=True)

with s3:
    stage_label = "Idle"
    pill_class = "info"
    if st.session_state.stage == "at_checkpoint_1":
        stage_label = "Checkpoint 1: Literature Screening"
        pill_class = "warn"
    elif st.session_state.stage == "at_checkpoint_2":
        stage_label = "Checkpoint 2: Hypothesis Review"
        pill_class = "warn"
    elif st.session_state.stage == "complete":
        stage_label = "Synthesis Complete"
        pill_class = "ok"

    st.markdown(f"""
    <div class="status-card">
        <span style="color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Workflow State</span><br/>
        <span class="status-pill {pill_class}" style="padding: 0.1rem 0.5rem; font-size: 0.75rem;">● {stage_label}</span>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)

# ---- 3. Main Workspace: 2-Column Layout ----
left, right = st.columns([1.1, 1.3], gap="large")

# LEFT: Input & Controls
with left:
    st.markdown("### Research inquiry")
    topic_val = st.text_area(
        "Topic or research question",
        value=st.session_state.topic_input,
        height=90,
        placeholder="e.g. Large Language Models prompting",
        label_visibility="collapsed",
    )

    st.markdown("**Quick benchmark topics**")
    b1, b2, b3, b4 = st.columns(4)
    if b1.button("LLM Prompting", use_container_width=True):
        st.session_state.topic_input = "Large Language Models prompting"
        st.rerun()
    if b2.button("Multi-Agent", use_container_width=True):
        st.session_state.topic_input = "Multi-Agent Coordination and Communication in Large Language Models"
        st.rerun()
    if b3.button("RAG Mitigation", use_container_width=True):
        st.session_state.topic_input = "Retrieval-Augmented Generation Hallucination Mitigation and Verification"
        st.rerun()
    if b4.button("Web Agents", use_container_width=True):
        st.session_state.topic_input = "Autonomous Web Agents and Long-Horizon Execution"
        st.rerun()

    with st.expander("Advanced options", expanded=False):
        max_papers = st.slider("Max candidate papers", 4, 25, 12)
        year_from = st.number_input("Year from", 2020, 2026, 2023)
        enable_verify = st.checkbox("Snippet-level claim verification", value=True)
        relevance_thresh = st.slider("Min relevance threshold", 0.40, 0.90, 0.55)

    action_col1, action_col2 = st.columns([3, 1.2])
    with action_col1:
        start_clicked = st.button("Start research workflow", type="primary", use_container_width=True)
    with action_col2:
        clear_clicked = st.button("🔄 Clear / New run", use_container_width=True)

    if clear_clicked:
        st.session_state.state = None
        st.session_state.stage = "idle"
        st.session_state.artifacts = {
            "literature_map": None,
            "gap": None,
            "hypotheses": None,
            "verification": None,
            "report": None,
            "logs": [],
        }
        st.rerun()

    if start_clicked:
        # Reset state & artifacts to prevent topic mismatch
        new_topic = topic_val.strip()
        st.session_state.topic = new_topic
        st.session_state.topic_input = new_topic
        st.session_state.artifacts = {
            "literature_map": None,
            "gap": None,
            "hypotheses": None,
            "verification": None,
            "report": None,
            "logs": [],
        }
        st.session_state.state = None

        with st.spinner("Executing Planner, Scouts, and Critic Agents..."):
            pipeline = st.session_state.pipeline
            state = pipeline.run_step_by_step(
                new_topic,
                pause_at_checkpoints=True,
                max_candidate_papers=max_papers,
                year_from=year_from
            )
            st.session_state.state = state
            st.session_state.artifacts["literature_map"] = getattr(state, "literature_map", None)
            st.session_state.stage = "at_checkpoint_1"
        st.rerun()

# RIGHT: Live Workflow Stepper & Human Checkpoints
with right:
    st.markdown("### Workflow progress")
    stage = st.session_state.stage

    def get_step_class(step_num):
        if stage == "idle":
            return ""
        if step_num == 1:
            return "done"
        if step_num == 2:
            return "done"
        if step_num == 3:
            return "done" if stage in ["at_checkpoint_2", "complete"] else ("active" if stage == "at_checkpoint_1" else "")
        if step_num == 4:
            return "done" if stage in ["at_checkpoint_2", "complete"] else ""
        if step_num == 5:
            return "done" if stage == "complete" else ("active" if stage == "at_checkpoint_2" else "")
        if step_num == 6:
            return "done" if stage == "complete" else ""
        return ""

    st.markdown(f'<div class="step {get_step_class(1)}">1. Planner Agent · Inquiry decomposition & domain tagging</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="step {get_step_class(2)}">2. Literature Scouts · Parallel arXiv Atom & Semantic Scholar search</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="step {get_step_class(3)}">3. Critic Agent · Relevance ranking & deduplication</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="step {get_step_class(4)}">4. Synthesizer Agent · Thematic clusters, gap formulation & hypotheses</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="step {get_step_class(5)}">5. Verifier Agent · N-gram cosine entailment & claim checks</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="step {get_step_class(6)}">6. Report Writer · Publication-ready cited markdown synthesis</div>', unsafe_allow_html=True)

    # Interactive Human Checkpoint Gates
    if stage == "at_checkpoint_1":
        st.markdown(
            '<div class="status-pill warn" style="margin-bottom: 0.5rem;">'
            '⚠️ Human Checkpoint 1: Literature Screening'
            '</div>',
            unsafe_allow_html=True
        )
        st.caption("Review retrieved candidate papers below before proceeding to synthesis.")
        k1, k2 = st.columns(2)
        if k1.button("✅ Approve literature map", type="primary", use_container_width=True):
            with st.spinner("Synthesizing map, gap statement, and hypotheses..."):
                state = st.session_state.pipeline.resume_after_checkpoint_1(st.session_state.state, action="accept")
                st.session_state.state = state
                st.session_state.artifacts["literature_map"] = getattr(state, "literature_map", None)
                st.session_state.artifacts["gap"] = getattr(state, "gap_statement", None)
                st.session_state.artifacts["hypotheses"] = getattr(state, "hypotheses", None)
                st.session_state.artifacts["verification"] = getattr(state, "verification_results", None)
                st.session_state.stage = "at_checkpoint_2"
            st.rerun()
        if k2.button("🔄 Request re-scout", use_container_width=True):
            with st.spinner("Re-scouting literature..."):
                state = st.session_state.pipeline.resume_after_checkpoint_1(st.session_state.state, action="rerun")
                st.session_state.state = state
                st.session_state.stage = "at_checkpoint_1"
            st.rerun()

    elif stage == "at_checkpoint_2":
        st.markdown(
            '<div class="status-pill warn" style="margin-bottom: 0.5rem;">'
            '⚠️ Human Checkpoint 2: Hypotheses & Gap Review'
            '</div>',
            unsafe_allow_html=True
        )
        st.caption("Inspect grounded hypotheses and claim flags before generating final draft.")
        k1, k2 = st.columns(2)
        if k1.button("✅ Approve & generate report", type="primary", use_container_width=True):
            with st.spinner("Drafting cited research report..."):
                state = st.session_state.pipeline.resume_after_checkpoint_2(st.session_state.state, action="accept")
                save_run_state(state)
                st.session_state.state = state
                st.session_state.artifacts["report"] = getattr(state, "draft_report", None)
                st.session_state.stage = "complete"
            st.rerun()
        if k2.button("🔄 Regenerate hypotheses", use_container_width=True):
            with st.spinner("Regenerating hypotheses..."):
                state = st.session_state.pipeline.resume_after_checkpoint_2(st.session_state.state, action="rerun")
                st.session_state.state = state
                st.session_state.stage = "at_checkpoint_2"
            st.rerun()
    elif stage == "complete":
        st.markdown(
            '<div class="status-pill ok">'
            '🎉 Synthesis Complete & Saved to SQLite'
            '</div>',
            unsafe_allow_html=True
        )
        st.caption("All 6 multi-agent steps are complete. Final verified report is ready below.")

# ---- 4. Results Section ----
st.markdown("### Results")
state: ResearchState = st.session_state.state

paper_count = len(state.papers) if state and state.papers else 0
hyp_count = len(state.hypotheses) if state and state.hypotheses else 0
verif_count = len(state.verification_results) if state and state.verification_results else 0

tabs = st.tabs([
    f"Literature Map ({paper_count})",
    "Research Gap",
    f"Hypotheses ({hyp_count})",
    f"Verification ({verif_count})",
    "Draft Report"
])

# TAB 1: Literature Map
with tabs[0]:
    if state and state.papers:
        if state.literature_map and state.literature_map.clusters:
            st.markdown(f"**Thematic Clusters across {len(state.papers)} Papers (Topic: *{state.topic}*)**")
            for c in state.literature_map.clusters:
                with st.expander(f"📁 {c.theme_name} ({len(c.paper_ids)} papers)", expanded=True):
                    st.write(c.description)
                    st.markdown("**Representative Papers:**")
                    for pid in c.paper_ids:
                        matching_p = next((p for p in state.papers if p.id == pid), None)
                        if matching_p:
                            author_disp = ", ".join(matching_p.authors[:2]) + (" et al." if len(matching_p.authors) > 2 else "")
                            st.markdown(f"- **[{matching_p.id}]** {matching_p.title} *({author_disp}, {matching_p.year})*")

        st.markdown(f"**Retrieved Candidate Papers ({len(state.papers)})**")
        for p in state.papers:
            st.markdown(f"""
            <div class="paper-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: #1e3a8a;">{p.title}</strong><br/>
                        <span style="color: #6b7280; font-size: 0.8rem;">{', '.join(p.authors[:3])} · {p.year} · {p.venue or p.source.upper()}</span>
                    </div>
                    <span style="font-family: monospace; font-size: 0.78rem; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{p.id}</span>
                </div>
                <p style="font-size: 0.83rem; color: #374151; margin-top: 0.4rem; line-height: 1.4;">{p.abstract[:220]}...</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280; margin-top: 0.3rem;">
                    <span>Relevance: <strong>{p.relevance_score:.2f}</strong></span>
                    <a href="{p.url}" target="_blank" style="color: #2563eb; text-decoration: none;">View Paper ↗</a>
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("No papers retrieved yet. Click 'Start research workflow' to initiate Literature Scouts.")

# TAB 2: Research Gap
with tabs[1]:
    if state and state.gap_statement:
        st.markdown(f"""
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #b45309; text-transform: uppercase; margin-bottom: 0.3rem;">Unresolved Empirical Gap</div>
            <p style="font-size: 0.95rem; color: #1f2937; margin: 0; line-height: 1.5;">{state.gap_statement}</p>
        </div>
        """, unsafe_allow_html=True)
        if state.literature_map:
            c1_gap, c2_gap = st.columns(2)
            with c1_gap:
                st.markdown("**Consensus Points in Literature**")
                for cp in state.literature_map.consensus_points:
                    st.markdown(f"- {cp}")
            with c2_gap:
                st.markdown("**Contested / Open Questions**")
                for ctp in state.literature_map.contested_points:
                    st.markdown(f"- {ctp}")
    else:
        st.info("Synthesized research gap will appear after Checkpoint 1.")

# TAB 3: Hypotheses
with tabs[2]:
    if state and state.hypotheses:
        for idx, h in enumerate(state.hypotheses, 1):
            st.markdown(f"""
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: #1d4ed8;">Hypothesis 0{idx}</span>
                    <span style="font-family: monospace; font-size: 0.75rem; color: #6b7280;">Testability: {h.testability_score:.2f} · Novelty: {h.novelty_score:.2f}</span>
                </div>
                <p style="font-size: 0.92rem; font-weight: 600; color: #111827;">{h.statement}</p>
                <p style="font-size: 0.82rem; color: #4b5563; margin-top: 0.3rem;"><strong>Rationale:</strong> {h.rationale}</p>
                <div style="margin-top: 0.4rem; font-size: 0.75rem; color: #6b7280;">
                    Grounding Sources: <code style="color: #2563eb;">{', '.join(h.grounding_paper_ids)}</code>
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("Ranked, source-linked hypotheses will appear here.")

# TAB 4: Verification
with tabs[3]:
    if state and state.verification_results:
        supported_count = len([v for v in state.verification_results if v.status == "supported"])
        st.markdown(f"**Claim Grounding Rate: `{supported_count / len(state.verification_results) * 100:.1f}%`** ({supported_count}/{len(state.verification_results)} claims supported)")
        for v in state.verification_results:
            badge_class = "badge-supported" if v.status == "supported" else ("badge-partial" if v.status == "partially_supported" else "badge-flagged")
            status_text = "Supported" if v.status == "supported" else ("Partial" if v.status == "partially_supported" else "Flagged")
            st.markdown(f"""
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <span class="{badge_class}">● {status_text}</span>
                    <span style="font-family: monospace; font-size: 0.75rem; color: #6b7280;">Source: <strong>{v.cited_paper_id}</strong> · Cosine Sim: {v.similarity_score:.2f}</span>
                </div>
                <p style="font-size: 0.88rem; font-weight: 500; color: #111827; margin: 0.3rem 0;">Claim: "{v.claim_text}"</p>
                <div style="background: #f9fafb; padding: 0.6rem; border-radius: 6px; font-size: 0.8rem; color: #374151; border: 1px solid #f3f4f6;">
                    <strong>Evidence Excerpt:</strong> <em>"{v.evidence_snippet}"</em>
                </div>
                <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.3rem;">
                    Verdict: {v.verdict_explanation}
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("Claim–source support flags will appear here.")

# TAB 5: Draft Report
with tabs[4]:
    if state and state.draft_report:
        p_col1, p_col2 = st.columns(2)
        with p_col1:
            st.download_button(
                "⬇ Export Report (.md)",
                data=state.draft_report,
                file_name=f"research_report_{state.topic.lower().replace(' ', '_')[:30]}.md",
                mime="text/markdown",
                use_container_width=True
            )
        with p_col2:
            if st.button("⬇ Generate PDF Report", type="primary", use_container_width=True):
                out = Path("data/runs") / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                try:
                    pdf_path = markdown_to_pdf(
                        state.draft_report,
                        output_path=str(out),
                        title=f"Research Report: {state.topic}",
                    )
                    if os.path.exists(pdf_path):
                        with open(pdf_path, "rb") as f:
                            pdf_bytes = f.read()
                        st.download_button(
                            "📥 Download Generated PDF",
                            data=pdf_bytes,
                            file_name=out.name,
                            mime="application/pdf" if pdf_path.endswith(".pdf") else "text/html",
                            use_container_width=True
                        )
                        st.success(f"PDF successfully generated: `{pdf_path}`")
                except Exception as exc:
                    st.error(f"PDF generation error: {exc}")

        st.divider()
        st.markdown(state.draft_report)
    else:
        st.info("Final markdown report + Export buttons will appear here once synthesis is complete.")
        e_col1, e_col2 = st.columns(2)
        e_col1.download_button("⬇ Export Report (.md)", data="# Report\n", file_name="research_report.md", disabled=True, use_container_width=True)
        e_col2.button("⬇ Generate PDF Report", disabled=True, use_container_width=True)
