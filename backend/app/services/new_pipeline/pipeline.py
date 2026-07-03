from __future__ import annotations

import csv
import json
import logging
import os
import re
import time
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor  # OPTIMIZATION: needed to run embed() and entity extraction concurrently
from functools import lru_cache  # OPTIMIZATION: needed for query-level caching
from typing import Any, Dict, List, Optional, Set, Tuple

import joblib
import numpy as np
import torch
from app.adapters.llm_client import (
    LLMClient,
    RerankerClient,
    EmbeddingClient,
)

llm_client = LLMClient()
reranker_client = RerankerClient(

)
embedding_client = EmbeddingClient(

)


def llm(
    prompt: str,
    max_tokens: int = 512,
    temperature: float = 0.1,
):
    return llm_client.generate(
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=temperature,
    )


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Timing helper
# ---------------------------------------------------------------------------

@contextmanager
def Timer(label: str):
    """Context manager that prints elapsed wall-clock time for a code block."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"[TIMING] {label}: {elapsed:.3f}s")
        logger.info(f"[TIMING] {label}: {elapsed:.3f}s")


def timed(label: str):
    """Decorator version of Timer, for wrapping whole methods."""
    def deco(fn):
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = fn(*args, **kwargs)
            elapsed = time.perf_counter() - start
            print(f"[TIMING] {label}: {elapsed:.3f}s")
            logger.info(f"[TIMING] {label}: {elapsed:.3f}s")
            return result
        return wrapper
    return deco


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

INPUT_CHUNK_INDEX    = "C:\\workspace\\qa-system\\qa-system\\backend\\app\\answering\\indices\\Z_chunk_index.joblib"
INPUT_ENTITY_INDEX   = "C:\\workspace\\qa-system\\qa-system\\backend\\app\\answering\\indices\\Z_entity_index.joblib"

# ---------------------------------------------------------------------------
# Tuning
# ---------------------------------------------------------------------------
MAX_QUERY_ENTITIES       = 7
TOP_K_SEMANTIC           = 50    # semantic pool size
ADJACENT_WINDOW          = 0    # ±N chunks around every matched chunk
TOP_K_AFTER_RERANK       = 10    # final chunks sent to LLM
ENTITY_EMB_CANDIDATES    = 10    # nearest entity-embedding neighbours to map

# OPTIMIZATION: tunable batch size for the cross-encoder forward pass.
# Larger batches amortize CUDA kernel-launch overhead across more pairs.
# Safe to raise/lower based on your GPU's VRAM headroom (32-64 is typical
# for a 7-13B-param-equivalent reranker on a single modern GPU).
CROSS_ENCODER_BATCH_SIZE = 32

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
EMBEDDING_MODEL      = "BAAI/bge-base-en-v1.5"
CROSSENCODER_MODEL   = "BAAI/bge-reranker-v2-m3"


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

logger.info(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    logger.info(f"GPU: {torch.cuda.get_device_name(0)}")

logger.info(f"Device: {device}")

# with Timer("Load embedding model"):
#     logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
#     _embed_model = SentenceTransformer(EMBEDDING_MODEL)
#     _embed_model.max_seq_length = 512
#     # OPTIMIZATION: cast the embedding model to fp16 on GPU. BGE models tolerate
#     # half precision well (this is purely a numeric-precision change in the
#     # forward pass, not an algorithm change) and roughly halves compute time
#     # and memory bandwidth use for the encode() call.
#     if device.type == "cuda":
#         _embed_model = _embed_model.half()

# with Timer("Load cross-encoder model"):
#     logger.info(f"Loading cross-encoder: {CROSSENCODER_MODEL}")
#     _cross_encoder = CrossEncoder(CROSSENCODER_MODEL, device=str(device))
#     # OPTIMIZATION: same fp16 cast for the cross-encoder. This is the most
#     # expensive model in the pipeline per-token (reranker forward pass over
#     # up to ~60 query/chunk pairs), so this has the largest fp16 payoff.
#     if device.type == "cuda":
#         _cross_encoder.model.half()
#     print("CrossEncoder device:")
#     print(next(_cross_encoder.model.parameters()).device)


# ---------------------------------------------------------------------------
# Embedding helper
# ---------------------------------------------------------------------------

# OPTIMIZATION: cache embeddings for repeated/identical queries (common in QA
# chat UIs when users re-ask or refine slightly-edited questions verbatim, or
# when retries happen). lru_cache is safe here because embed() is a pure
# function of `text` given a fixed model. Cache size capped to avoid
# unbounded memory growth. NOTE: this returns the same tensor object on
# cache hits — callers must not mutate it in place (none currently do).
@lru_cache(maxsize=512)
def _embed_cached(text: str) -> torch.Tensor:
    with Timer("embed() — query embedding (remote)"):
        vec = embedding_client.embed(text)
        v = torch.tensor(vec, dtype=torch.float32, device=device)
        result = (v / (v.norm() + 1e-8)).unsqueeze(0)
    return result


def embed(text: str) -> torch.Tensor:
    """Return a normalised (1, DIM) float32 tensor on device."""
    # Routes through the cached version — exact string repeats hit the
    # cache and skip the network round-trip entirely.
    return _embed_cached(text)


# ===========================================================================
# Index  (loaded once at startup)
# ===========================================================================

class Index:
    """
    Holds all pre-built retrieval data in memory.
    Populated by Index.load() before the pipeline runs.
    """

    def __init__(self):
        # Chunk data
        self.chunk_ids:     List[str]  = []
        self.chunk_texts:   List[str]  = []
        self.chunk_id_to_idx: Dict[str, int] = {}
        self.chunk_emb:     Optional[torch.Tensor] = None  # (N, D) normalised

        # Navigation
        self.file_to_chunks: Dict[str, List[str]] = {}   # file_id → ordered chunk ids
        self.chunk_to_file:  Dict[str, str]        = {}
        self.chunk_to_pos:   Dict[str, int]        = {}

        # Entity data
        self.entity_list:    List[str]  = []
        self.entity_emb:     Optional[torch.Tensor] = None  # (M, D) normalised
        self.entity_to_chunks: Dict[str, List[str]] = {}    # normalised → [chunk_id]

    def load(self):
        with Timer("Index.load() — TOTAL"):
            self._load_chunks()
            self._load_entities()
        logger.info("Index ready.")

    def _load_chunks(self):
        with Timer("Index._load_chunks()"):
            if not os.path.exists(INPUT_CHUNK_INDEX):
                raise FileNotFoundError(INPUT_CHUNK_INDEX)

            logger.info("Loading chunk index …")
            d = joblib.load(INPUT_CHUNK_INDEX)

            self.chunk_ids   = d["chunk_ids"]
            self.chunk_texts = d["chunk_texts"]
            self.chunk_id_to_idx = {cid: i for i, cid in enumerate(self.chunk_ids)}

            raw = d["chunk_embeddings"]
            t = torch.tensor(raw, dtype=torch.float32, device=device)
            self.chunk_emb = t / (t.norm(dim=1, keepdim=True) + 1e-8)

            self.file_to_chunks = d["file_to_ordered_chunks"]
            self.chunk_to_file  = d["chunk_id_to_file"]
            self.chunk_to_pos   = d["chunk_id_to_pos"]

            logger.info(
                f"Chunks: {len(self.chunk_ids):,}  "
                f"emb: {self.chunk_emb.shape}  "
                f"files: {len(self.file_to_chunks):,}"
            )

    def _load_entities(self):
        with Timer("Index._load_entities()"):
            if not os.path.exists(INPUT_ENTITY_INDEX):
                logger.warning(f"Entity index not found: {INPUT_ENTITY_INDEX} — entity retrieval disabled")
                return

            logger.info("Loading entity index …")
            d = joblib.load(INPUT_ENTITY_INDEX)

            self.entity_list      = d["entity_list"]
            self.entity_to_chunks = d["entity_to_chunks"]   # already str→list

            raw = d["entity_embeddings"]
            t = torch.tensor(raw, dtype=torch.float32, device=device)
            self.entity_emb = t / (t.norm(dim=1, keepdim=True) + 1e-8)

            logger.info(
                f"Entities: {len(self.entity_list):,}  "
                f"emb: {self.entity_emb.shape}  "
                f"index keys: {len(self.entity_to_chunks):,}"
            )


# ===========================================================================
# Query entity extractor
# ===========================================================================

class EntityExtractor:
    # OPTIMIZATION: cache entity extraction per query string. This is an LLM
    # round-trip (network/inference bound), so repeated/retried queries skip
    # it entirely on cache hit. Same determinism caveat as embed() — only
    # exact repeats hit the cache, so this never changes results for new text.
    @lru_cache(maxsize=512)
    def _extract_cached(self, query: str) -> Tuple[str, ...]:
        with Timer("EntityExtractor.extract() — TOTAL (incl. LLM call)"):
            prompt = f"""Extract the {MAX_QUERY_ENTITIES} most important entities or concepts needed to answer the question below.

Include: named programs/policies/regulations, documents/plans/forms, processes/procedures/deadlines, organisations/agencies/roles, specific technical/domain terms.
Exclude: filler phrases, generic words like "information"/"details", vague qualifiers.

Output ONLY entities, one per line, no numbering or punctuation.

Question:
{query}""".strip()

            try:
                with Timer("EntityExtractor — LLM call"):
                    raw = llm(prompt, max_tokens=80)
                seen: Set[str] = set()
                entities: List[str] = []
                for line in raw.splitlines():
                    e = line.strip(" -•\t")
                    if len(e) >= 3 and not e.isdigit() and e.lower() not in seen:
                        seen.add(e.lower())
                        entities.append(e)
                result = entities[:MAX_QUERY_ENTITIES]
                logger.info(f"Query entities: {result}")
                return tuple(result)  # tuple so it's hashable for lru_cache return-path consistency
            except Exception as ex:
                logger.warning(f"Entity extraction failed: {ex}")
                fallback = re.findall(r'\b[A-Z][a-zA-Z]{3,}(?:\s+[A-Z][a-zA-Z]{3,})*\b', query)[:3]
                return tuple(fallback)

    def extract(self, query: str) -> List[str]:
        return list(self._extract_cached(query))


# ===========================================================================
# Chunk retriever
# ===========================================================================

class ChunkRetriever:
    """
    Builds a candidate pool from two signals, then expands with neighbours.

    Signal A — entity pool
      1. Exact/prefix match in entity_to_chunks inverted index
      2. Top-ENTITY_EMB_CANDIDATES nearest entities by embedding → their chunks

    Signal B — semantic pool
      Top-TOP_K_SEMANTIC chunks by cosine similarity to query embedding

    Merge → deduplicate → adjacent expand → return pool with scores.
    """

    def __init__(self, index: Index):
        self.idx = index

    def retrieve(
        self,
        query: str,
        query_entities: List[str],
        q_emb: torch.Tensor,
    ) -> List[Dict[str, Any]]:

        with Timer("ChunkRetriever.retrieve() — TOTAL"):
            scores: Dict[str, Dict[str, float]] = {}

            self._entity_pool(query_entities, q_emb, scores)
            self._semantic_pool(q_emb, scores)

            # Fuse & sort
            with Timer("ChunkRetriever — fuse + sort"):
                candidates = self._fuse(scores)
                candidates.sort(key=lambda x: x["combined_score"], reverse=True)

            # Adjacent expansion on the entire pool
            expanded = self._expand(candidates)

            # Attach text
            with Timer("ChunkRetriever — attach text + dedupe"):
                result: List[Dict[str, Any]] = []
                seen: Set[str] = set()
                for item in expanded:
                    cid = item["chunk_id"]
                    if cid in seen or cid not in self.idx.chunk_id_to_idx:
                        continue
                    seen.add(cid)
                    idx = self.idx.chunk_id_to_idx[cid]
                    result.append({
                        **item,
                        "chunk_text": self.idx.chunk_texts[idx],
                    })

            logger.info(
                f"Pool: {len(scores)} raw → {len(candidates)} fused → "
                f"{len(result)} after expansion"
            )
        return result

    # ------------------------------------------------------------------
    def _entity_pool(
        self,
        query_entities: List[str],
        q_emb: torch.Tensor,
        scores: Dict[str, Dict[str, float]],
    ):
        """Exact + prefix entity match, then embedding-nearest entities."""
        # NOTE: per your request, the prefix/substring fallback matching logic
        # below is left untouched (no indexing optimization applied here).
        with Timer("ChunkRetriever._entity_pool() — TOTAL"):
            hit_count: Dict[str, float] = {}

            # --- exact / prefix match ---
            with Timer("  _entity_pool — exact/prefix match"):
                for ent in query_entities:
                    key = ent.lower().strip()
                    matched: Set[str] = set(self.idx.entity_to_chunks.get(key, []))

                    # prefix/substring fallback for short entities
                    if not matched and len(key) >= 4:
                        for idx_key, cids in self.idx.entity_to_chunks.items():
                            if key in idx_key or idx_key in key:
                                matched.update(cids)

                    for cid in matched:
                        hit_count[cid] = hit_count.get(cid, 0.0) + 1.0

                for cid, sc in hit_count.items():
                    s = scores.setdefault(cid, {"entity": 0.0, "vector": 0.0})
                    s["entity"] = sc
                    s.setdefault("source", "entity_exact")

            logger.info(f"Exact entity match: {len(hit_count)} chunks")

            # --- embedding-nearest entities → their chunks ---
            if self.idx.entity_emb is None:
                return

            with Timer("  _entity_pool — embedding-nearest entities"):
                k = min(ENTITY_EMB_CANDIDATES, len(self.idx.entity_list))
                with torch.no_grad():
                    sims = torch.mm(q_emb, self.idx.entity_emb.T).squeeze(0)
                top_scores, top_idxs = torch.topk(sims, k=k)

                # OPTIMIZATION: move topk results to CPU/numpy in ONE transfer
                # instead of calling .item() inside the loop. Each .item() call
                # forces an individual CUDA device→host sync; doing it once for
                # the whole tensor avoids k separate synchronization stalls.
                top_scores_np = top_scores.detach().cpu().numpy()
                top_idxs_np = top_idxs.detach().cpu().numpy()

                emb_hit: Dict[str, float] = {}
                for sc_val, idx_val in zip(top_scores_np, top_idxs_np):
                    ent = self.idx.entity_list[int(idx_val)].lower()
                    escore = float(sc_val)
                    for cid in self.idx.entity_to_chunks.get(ent, []):
                        emb_hit[cid] = max(emb_hit.get(cid, 0.0), escore * 0.5)

                for cid, sc in emb_hit.items():
                    s = scores.setdefault(cid, {"entity": 0.0, "vector": 0.0})
                    s["entity"] = max(s["entity"], sc)
                    s.setdefault("source", "entity_emb")

            logger.info(f"Entity-emb match: {len(emb_hit)} chunks")

    # ------------------------------------------------------------------
    def _semantic_pool(
        self,
        q_emb: torch.Tensor,
        scores: Dict[str, Dict[str, float]],
    ):
        """Top-K chunks by cosine similarity."""
        with Timer("ChunkRetriever._semantic_pool()"):
            if self.idx.chunk_emb is None:
                return
            k = min(TOP_K_SEMANTIC, len(self.idx.chunk_ids))
            with torch.no_grad():
                sims = torch.mm(q_emb, self.idx.chunk_emb.T).squeeze(0)
            top_scores, top_idxs = torch.topk(sims, k=k)

            # OPTIMIZATION: same single-transfer pattern as above — avoids
            # TOP_K_SEMANTIC (50) individual .item() device syncs per query.
            top_scores_np = top_scores.detach().cpu().numpy()
            top_idxs_np = top_idxs.detach().cpu().numpy()

            for sc_val, idx_val in zip(top_scores_np, top_idxs_np):
                cid = self.idx.chunk_ids[int(idx_val)]
                vscore = float(sc_val)
                s = scores.setdefault(cid, {"entity": 0.0, "vector": 0.0})
                s["vector"] = max(s.get("vector", 0.0), vscore)
                if "source" not in s:
                    s["source"] = "vector"
                elif s["source"] != "vector":
                    s["source"] = "entity+vector"

            logger.info(f"Semantic pool: top-{k} chunks")

    # ------------------------------------------------------------------
    @staticmethod
    def _fuse(scores: Dict[str, Dict[str, float]]) -> List[Dict[str, Any]]:
        if not scores:
            return []
        max_entity = max((v["entity"] for v in scores.values()), default=1.0) or 1.0
        result = []
        for cid, v in scores.items():
            es = v["entity"] / max_entity
            vs = v["vector"]
            result.append({
                "chunk_id":       cid,
                "entity_score":   v["entity"],
                "vector_score":   vs,
                "combined_score": 0.5 * es + 0.5 * vs,
                "is_adjacent":    False,
                "source":         v.get("source", "unknown"),
            })
        return result

    # ------------------------------------------------------------------
    def _expand(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add ±ADJACENT_WINDOW neighbours for every candidate."""
        with Timer("ChunkRetriever._expand() — adjacent expansion"):
            expanded = list(candidates)
            seen = {c["chunk_id"] for c in candidates}

            for cand in candidates:
                cid = cand["chunk_id"]
                fid = self.idx.chunk_to_file.get(cid)
                pos = self.idx.chunk_to_pos.get(cid)
                if fid is None or pos is None:
                    continue
                file_chunks = self.idx.file_to_chunks.get(fid, [])
                for delta in range(-ADJACENT_WINDOW, ADJACENT_WINDOW + 1):
                    if delta == 0:
                        continue
                    nb_pos = pos + delta
                    if 0 <= nb_pos < len(file_chunks):
                        nb_cid = file_chunks[nb_pos]
                        if nb_cid not in seen:
                            seen.add(nb_cid)
                            expanded.append({
                                "chunk_id":       nb_cid,
                                "entity_score":   cand["entity_score"] * 0.5,
                                "vector_score":   cand["vector_score"]  * 0.5,
                                "combined_score": cand["combined_score"] * 0.6,
                                "is_adjacent":    True,
                                "source":         "adjacent",
                            })

            logger.info(f"Adjacent expansion: {len(candidates)} → {len(expanded)}")
        return expanded


# ===========================================================================
# Cross-encoder reranker
# ===========================================================================

class Reranker:
    def rerank(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = TOP_K_AFTER_RERANK,
    ) -> List[Dict[str, Any]]:
        with Timer(f"Reranker.rerank() — TOTAL ({len(chunks)} chunks)"):
            if not chunks:
                return []


            pairs = [[query, c["chunk_text"]] for c in chunks]

            try:

                with Timer("Remote CrossEncoder.predict()"):

                    ce_scores = reranker_client.predict(pairs)

            except Exception as e:
                logger.exception("Remote reranker API failed")
                raise

            ranked = sorted(
                [
                    {
                        **c,
                        "rerank_score": float(score),
                    }
                    for c, score in zip(chunks, ce_scores)
                ],
                key=lambda x: x["rerank_score"],
                reverse=True,
            )[:top_k]

            logger.info(
                f"Reranker: {len(chunks)} → {len(ranked)}  "
                f"scores: {[round(c['rerank_score'], 3) for c in ranked]}"
            )
        return ranked


# ===========================================================================
# Answer generator
# ===========================================================================

class AnswerGenerator:

    @staticmethod
    def _build_context(chunks: List[Dict[str, Any]]) -> str:
        with Timer("AnswerGenerator._build_context()"):
            """Group by document, sort within group, render as labelled blocks."""
            groups: Dict[str, List[Dict]] = {}
            order: List[str] = []
            for c in chunks:
                m = re.match(r"^(.+)_chunk_\d+$", c["chunk_id"])
                prefix = m.group(1) if m else c["chunk_id"]
                if prefix not in groups:
                    groups[prefix] = []
                    order.append(prefix)
                groups[prefix].append(c)

            def _num(c: Dict) -> int:
                mm = re.search(r"_chunk_(\d+)$", c["chunk_id"])
                return int(mm.group(1)) if mm else 0

            blocks = []
            for rank, prefix in enumerate(order, 1):
                grp = sorted(groups[prefix], key=_num)
                parts = [f"[Document {rank}: {prefix}]"]
                for c in grp:
                    tag = " | ADJACENT" if c.get("is_adjacent") else ""
                    parts.append(
                        f"  [chunk: {c['chunk_id']} | score: {c.get('rerank_score', 'N/A')}{tag}]\n"
                        f"  {c['chunk_text']}"
                    )
                blocks.append("\n".join(parts))
            result = "\n\n".join(blocks)
        return result

    def generate(
        self,
        query: str,
        top_chunks: List[Dict[str, Any]],
        question_type: str = "Descriptive",
        conditions: str = "N/A",
    ) -> Tuple[str, str]:
        with Timer("AnswerGenerator.generate() — TOTAL (incl. LLM call)"):
            is_yes_no = question_type.lower().startswith("yes")
            context   = self._build_context(top_chunks)

            if not context:
                return ("No — No relevant information found." if is_yes_no
                        else "No relevant information found."), ""

            cond_block = (
                f"\nConditions:\n{conditions}\n"
                if is_yes_no and conditions and conditions != "N/A" else ""
            )

            if is_yes_no:
                prompt = f"""Answer the yes/no question using ONLY the information below.

Question:
{query}
{cond_block}
--- Supporting Text ---
{context}

Respond ONLY as "Yes — <one-sentence reason>" or "No — <one-sentence reason>".
If evidence is absent: No — No explicit supporting evidence found.

Output:""".strip()
            else:
                prompt = f"""Answer using ONLY the context below.

Question:
{query}

--- Supporting Text ---
{context}

Direct, factual answer (1-5 sentences). Do not speculate or mention sources.

Answer:""".strip()

            try:
                max_tok = 300 if is_yes_no else 3000
                with Timer("  AnswerGenerator — LLM call"):
                    raw = llm(prompt, max_tokens=max_tok)

                if is_yes_no:
                    m = re.match(
                        r"^(Yes|No)\s*(?:—|–|--|-)?\s*(.+)$",
                        raw, re.IGNORECASE | re.DOTALL,
                    )
                    answer = (
                        f"{m.group(1).capitalize()} — {m.group(2).strip()}" if m
                        else "No — No explicit supporting evidence found."
                    )
                else:
                    answer = raw

                logger.info(f"Answer: {answer[:120]}")
                return answer, prompt

            except Exception as e:
                logger.error(f"Answer generation failed: {e}")
                return (
                    "No — Error during generation" if is_yes_no
                    else "Unable to generate answer.",
                    "",
                )


# ===========================================================================
# Pipeline
# ===========================================================================

class Pipeline:
    def __init__(self, index: Index):
        self.extractor  = EntityExtractor()
        self.retriever  = ChunkRetriever(index)
        self.reranker   = Reranker()
        self.generator  = AnswerGenerator()
        # OPTIMIZATION: small dedicated thread pool to run embed() and
        # extractor.extract() concurrently — they are independent given only
        # the raw query string, but were previously run sequentially even
        # though one is a local GPU encode and the other is a network/LLM
        # round-trip. Overlapping them removes the smaller of the two
        # durations from the critical path almost for free.
        self._io_pool = ThreadPoolExecutor(max_workers=2)

    def run(
        self,
        query: str,
        question_type: str = "Descriptive",
        conditions: str = "N/A",
    ) -> Dict[str, Any]:
        logger.info(f"\n{'='*70}\nQUERY: {query}\n{'='*70}")
        print(f"\n{'='*70}\n[TIMING] PIPELINE RUN START — QUERY: {query}\n{'='*70}")

        pipeline_start = time.perf_counter()

        # OPTIMIZATION: launch embedding (GPU-bound) and entity extraction
        # (LLM round-trip, network-bound) concurrently instead of sequentially.
        # Previously: embed() then extractor.extract() — durations added.
        # Now: both run in parallel — total wait ≈ max(embed, extract) instead
        # of embed + extract. This is a pure scheduling change; neither
        # function's internal logic or output is modified.
        with Timer("Pipeline — concurrent embed() + extract()"):
            emb_future = self._io_pool.submit(embed, query)
            entities_future = self._io_pool.submit(self.extractor.extract, query)
            q_emb = emb_future.result()
            query_entities = entities_future.result()

        # 2. Build candidate pool (entity + semantic, then adjacent expand)
        pool = self.retriever.retrieve(query, query_entities, q_emb)

        if not pool:
            is_yn = question_type.lower().startswith("yes")
            total = time.perf_counter() - pipeline_start
            print(f"[TIMING] PIPELINE RUN TOTAL (empty pool): {total:.3f}s")
            return {
                "predicted_answer": "No — No relevant information found." if is_yn
                                    else "No relevant information found.",
                "prompt":           "",
                "query_entities":   query_entities,
                "top_chunks":       [],
            }

        # 3. Rerank
        top_chunks = self.reranker.rerank(query, pool)

        # 4. Generate answer
        answer, prompt = self.generator.generate(
            query, top_chunks, question_type, conditions
        )

        total = time.perf_counter() - pipeline_start
        print(f"[TIMING] PIPELINE RUN TOTAL: {total:.3f}s")
        print(f"{'='*70}\n")

        return {
            "predicted_answer": answer,
            "prompt":           prompt,
            "query_entities":   query_entities,
            "top_chunks":       top_chunks,
        }


    def answer(
        self,
        question: str,
        chat_history=None,
        web_search: bool = False,
        retrieved_override=None,
        temperature: float = 0.2,
    ):
        """
        Wrapper so the new pipeline behaves like the old RAGPipeline.
        chat_history, web_search and retrieved_override are accepted
        for compatibility with the existing API.
        """
        with Timer("Pipeline.answer() — TOTAL (incl. run + source formatting)"):
            result = self.run(query=question)

            sources = []

            for chunk in result["top_chunks"]:
                sources.append(
                    {
                        "chunk_id": chunk["chunk_id"],
                        "document_id": chunk["chunk_id"].split("_chunk_")[0],
                        "chunk_text": chunk["chunk_text"],
                        "score": chunk.get("rerank_score", 0),
                        "token_start": 0,
                        "token_end": 0,
                        "evidence": "",
                        "highlight_spans": [],
                    }
                )

            result_out = {
                "answer": result["predicted_answer"],
                "sources": sources,
            }
        return result_out
        

    def generate_chat_title(self, question: str):
        with Timer("Pipeline.generate_chat_title()"):
            prompt = f"""
Generate a short chat title (maximum 5 words).

Question:
{question}

Title:
""".strip()

            result = llm(
                prompt,
                max_tokens=20,
            )
        return result
# ===========================================================
# Global pipeline
# ===========================================================

index = Index()
index.load()

pipeline = Pipeline(index)