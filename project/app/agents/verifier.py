"""
Citation & Claim Verification Node
Checks every synthesis claim against retrieved paper snippets, extracts exact evidence quotes,
computes semantic similarity, and flags unsupported claims or hallucinated citations.
"""

from __future__ import annotations
import logging
import re
from typing import Dict, Any, List
from project.app.schemas.state import ResearchState, ClaimVerification, Paper
from project.app.tools.embeddings import compute_similarity
from project.app.tools.pdf_extractor import find_relevant_snippets

logger = logging.getLogger(__name__)


def verify_claims(state: ResearchState) -> Dict[str, Any]:
    """
    Verification node for LangGraph.
    Scrutinizes all key claims, hypotheses, and gap statements against retrieved paper text.
    """
    papers_dict: Dict[str, Paper] = {p.id: p for p in state.papers}
    logger.info("Verifier Node active with %d available reference papers.", len(papers_dict))

    verification_records: List[ClaimVerification] = []
    claim_count = 0

    # Extract claims from hypotheses
    for hyp in state.hypotheses:
        for paper_id in hyp.grounding_paper_ids:
            claim_count += 1
            record = verify_single_claim(
                claim_id=f"verif-hyp-{hyp.id}-{paper_id}",
                claim_text=hyp.statement,
                cited_paper_id=paper_id,
                papers_dict=papers_dict
            )
            verification_records.append(record)

    # Extract claims from literature clusters
    if state.literature_map:
        for cluster in state.literature_map.clusters:
            for rep_claim in cluster.representative_claims:
                # Find referenced paper ID in brackets or parentheses
                match = re.search(r"\(?(arXiv:[^\s\)]+|S2:[^\s\)]+)\)?", rep_claim)
                cited_id = match.group(1) if match else (cluster.paper_ids[0] if cluster.paper_ids else "unknown")
                claim_count += 1
                record = verify_single_claim(
                    claim_id=f"verif-cluster-{cluster.cluster_id}-{claim_count}",
                    claim_text=rep_claim,
                    cited_paper_id=cited_id,
                    papers_dict=papers_dict
                )
                verification_records.append(record)

    # Calculate claim verification statistics
    supported = [v for v in verification_records if v.status == "supported"]
    partially = [v for v in verification_records if v.status == "partially_supported"]
    unsupported = [v for v in verification_records if v.status in ("unsupported", "hallucination")]
    
    support_rate = round(len(supported) / max(1, len(verification_records)), 3)

    log_entry = (
        f"[Verifier Node] Verified {len(verification_records)} claims: "
        f"{len(supported)} supported, {len(partially)} partially supported, {len(unsupported)} flagged. "
        f"Claim Support Rate: {support_rate * 100:.1f}%."
    )
    logger.info(log_entry)

    return {
        "verification_results": verification_records,
        "logs": state.logs + [log_entry],
        "current_node": "verifier"
    }


def verify_single_claim(
    claim_id: str,
    claim_text: str,
    cited_paper_id: str,
    papers_dict: Dict[str, Paper]
) -> ClaimVerification:
    """Verify an individual claim against its purported paper source."""
    paper = papers_dict.get(cited_paper_id)
    
    if not paper:
        # Hallucinated or phantom citation
        return ClaimVerification(
            claim_id=claim_id,
            claim_text=claim_text,
            cited_paper_id=cited_paper_id,
            status="hallucination",
            similarity_score=0.0,
            evidence_snippet="[NOT FOUND] Cited paper was not retrieved in literature scout phase.",
            verdict_explanation="Severe Hallucination Warning: Paper ID does not exist in scouted literature corpus."
        )

    # Search for matching evidence snippets in paper's full text and abstract
    search_corpus = f"{paper.abstract} {paper.full_text_snippet or ''}"
    candidate_snippets = find_relevant_snippets(search_corpus, claim_text, max_snippets=2)
    
    best_snippet = candidate_snippets[0] if candidate_snippets else paper.abstract[:200] + "..."
    similarity = compute_similarity(claim_text, best_snippet)

    # Determine status based on calibrated threshold
    if similarity >= 0.65:
        status = "supported"
        explanation = f"Empirical grounding confirmed with high semantic entailment ({similarity:.2f}) against source snippet."
    elif similarity >= 0.45:
        status = "partially_supported"
        explanation = f"Plausible conceptual overlap ({similarity:.2f}); claim extends or generalizes the exact snippet wording."
    else:
        status = "unsupported"
        explanation = f"Insufficient textual evidence in paper abstract/snippet (similarity {similarity:.2f}); claim may be extrapolated."

    return ClaimVerification(
        claim_id=claim_id,
        claim_text=claim_text,
        cited_paper_id=cited_paper_id,
        status=status,
        similarity_score=similarity,
        evidence_snippet=best_snippet,
        verdict_explanation=explanation
    )
