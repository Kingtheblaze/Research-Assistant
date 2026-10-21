"""
Embedding and Similarity Tools
Computes dense semantic embeddings using sentence-transformers,
with a lightweight n-gram cosine fallback for resource-constrained environments.
"""

from __future__ import annotations
import logging
import math
import re
from typing import List, Tuple
import numpy as np

logger = logging.getLogger(__name__)

_MODEL_INSTANCE = None


def get_embedding_model(model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
    """Lazy loader for sentence-transformers model."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers model: %s", model_name)
            _MODEL_INSTANCE = SentenceTransformer(model_name)
        except Exception as exc:
            logger.warning("Could not load SentenceTransformer (%s). Utilizing fast fallback vectorizer.", str(exc))
            _MODEL_INSTANCE = "fallback"
    return _MODEL_INSTANCE


def compute_similarity(text1: str, text2: str) -> float:
    """
    Compute semantic cosine similarity score between two texts in [0.0, 1.0].
    Uses SentenceTransformer if loaded, otherwise an n-gram Jaccard/TF-IDF cosine fallback.
    """
    model = get_embedding_model()
    if model != "fallback" and model is not None:
        try:
            embeddings = model.encode([text1, text2], normalize_embeddings=True)
            sim = float(np.dot(embeddings[0], embeddings[1]))
            # Bound to [0.0, 1.0]
            return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))
        except Exception as e:
            logger.debug("SentenceTransformer inference failed: %s; using fallback.", str(e))

    return compute_fallback_similarity(text1, text2)


def compute_fallback_similarity(text1: str, text2: str) -> float:
    """Fast lexical and n-gram overlap cosine similarity."""
    t1 = re.sub(r"[^\w\s]", "", text1.lower())
    t2 = re.sub(r"[^\w\s]", "", text2.lower())
    words1 = t1.split()
    words2 = t2.split()
    
    if not words1 or not words2:
        return 0.0

    # Build term frequency vectors
    vocab = list(set(words1 + words2))
    v1 = np.array([words1.count(w) for w in vocab], dtype=float)
    v2 = np.array([words2.count(w) for w in vocab], dtype=float)

    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    cosine = float(np.dot(v1, v2) / (norm1 * norm2))
    
    # Also incorporate character bigram Jaccard for word-form variations
    bigrams1 = set([t1[i:i+2] for i in range(len(t1)-1)])
    bigrams2 = set([t2[i:i+2] for i in range(len(t2)-1)])
    jaccard = len(bigrams1.intersection(bigrams2)) / max(1, len(bigrams1.union(bigrams2)))

    # Combined score
    score = 0.65 * cosine + 0.35 * jaccard
    return round(max(0.0, min(1.0, score)), 4)


def rank_texts_by_query(query: str, texts: List[str]) -> List[Tuple[int, float]]:
    """
    Rank candidate texts by semantic similarity to a query.
    Returns list of (index, score) sorted in descending order of score.
    """
    scores = []
    for idx, text in enumerate(texts):
        score = compute_similarity(query, text)
        scores.append((idx, score))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores
