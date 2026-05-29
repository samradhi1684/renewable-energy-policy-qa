import re
import json
from rapidfuzz import fuzz

from app.adapters.llm_client import LLMClient
from app.adapters.retriever import Retriever
from app.adapters.embedder import Embedder


class RAGPipeline:

    def __init__(self):
        self.retriever = Retriever()
        self.llm = LLMClient()
        self.embedder = Embedder()

    def answer(
    self,
    question: str,
    top_k: int = 5,
    retrieved_override=None,
    temperature=0.2
):

        if retrieved_override is not None:
            retrieved = retrieved_override
        else:
            retrieved = self.retriever.retrieve(
                question,
                top_k=top_k
            )
        # Build numbered evidence
        evidence_map = {}
        evidence_lines = []
        sentence_idx = 0

        for item_idx, item in enumerate(retrieved):

            sentences = _split_sentences(
                item["chunk_text"]
            )

            for sent in sentences:

                sid = f"S{sentence_idx}"

                evidence_map[sid] = {
                    "sentence": sent,
                    "item_idx": item_idx,
                }

                evidence_lines.append(
                    f"[{sid}] {sent}"
                )

                sentence_idx += 1

        numbered_context = "\n".join(
            evidence_lines
        )

        prompt = f"""
You are a Policy QA assistant.

Use ONLY the provided evidence.

Answer the question.

Also provide citation ids.

Return JSON only.

Format:

{{
  "answer":"...",
  "citations":["S1","S3"]
}}

Evidence:
{numbered_context}

Question:
{question}
"""

        raw = self.llm.generate(
        prompt,
        temperature=temperature
)

        # unwrap model response
        if hasattr(raw, "content"):
            raw = raw.content

        raw = str(raw).strip()

        # ---------- robust JSON parsing ----------

        try:
            parsed = json.loads(raw)

        except Exception:

            cleaned = (
                raw.replace("```json", "")
                   .replace("```", "")
                   .strip()
            )

            try:
                parsed = json.loads(cleaned)

            except Exception:
                parsed = {
                    "answer": cleaned,
                    "citations": []
                }

        # double-encoded JSON
        if isinstance(parsed, str):

            try:
                parsed = json.loads(parsed)

            except Exception:
                parsed = {
                    "answer": parsed,
                    "citations": []
                }

        print("RAW:", raw)
        print("PARSED:", parsed)

        answer = parsed.get(
            "answer",
            ""
        )

        citations = parsed.get(
            "citations",
            []
        )

        # ---------- nested JSON inside answer ----------

        if (
            isinstance(answer, str)
            and answer.strip().startswith("{")
            and '"citations"' in answer
        ):

            try:

                nested = json.loads(answer)

                print(
                    "NESTED PARSED:",
                    nested
                )

                answer = nested.get(
                    "answer",
                    answer
                )

                citations = nested.get(
                    "citations",
                    citations
                )

            except Exception:
                pass

        # ---------- build source highlights ----------

        sources = []

        for idx, item in enumerate(retrieved):

            spans = []
            cited_sentences = []

            for cid in citations:

                if cid not in evidence_map:
                    continue

                ev = evidence_map[cid]

                if ev["item_idx"] != idx:
                    continue

                sent = ev["sentence"]

                # exact match
                start = item[
                    "chunk_text"
                ].lower().find(
                    sent.lower()
                )

                # fuzzy fallback
                if start == -1:

                    best_score = 0
                    best_start = -1
                    sent_len = len(sent)

                    for i in range(
                        len(item["chunk_text"])
                    ):

                        window = item[
                            "chunk_text"
                        ][
                            i:i + sent_len + 30
                        ]

                        score = fuzz.partial_ratio(
                            sent.lower(),
                            window.lower()
                        )

                        if score > best_score:
                            best_score = score
                            best_start = i

                    if best_score >= 75:
                        start = best_start

                if start == -1:
                    continue

                spans.append({
                    "start": start,
                    "end": start + len(sent)
                })

                cited_sentences.append(
                    sent
                )

            sources.append({
                **item,
                "evidence":
                    " ".join(
                        cited_sentences
                    ),
                "highlight_spans":
                    spans
            })
            
            sources = sorted(
            sources,
            key=lambda x: x["score"],
            reverse=True
        )[:3]

        return {
            "question": question,
            "answer": answer,
            "sources": sources
        }


# Helpers

def _split_sentences(text: str) -> list[str]:

    parts = re.split(
        r'(?<=[.!?])\s+',
        text.strip()
    )

    sentences = []

    for part in parts:

        sub = re.split(
            r'\n+|(?<=\w)\s*[-·•]\s*(?=[A-Z])',
            part
        )

        sentences.extend(sub)

    return [
        s.strip()
        for s in sentences
        if len(s.strip()) > 15
    ]