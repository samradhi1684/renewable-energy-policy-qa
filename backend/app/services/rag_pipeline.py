import re
import json
from rapidfuzz import fuzz

from app.adapters.llm_client import LLMClient
from app.adapters.retriever import Retriever
from app.adapters.embedder import Embedder
from app.services.web_search import search_web



class RAGPipeline:

    def __init__(self):
        self.retriever = Retriever()
        self.llm = LLMClient()
        self.embedder = Embedder()

    def generate_chat_title(
        self,
        question: str
    ) -> str:

        prompt = f"""
    You generate conversation titles.

    Rules:
    - 2 to 6 words
    - No quotation marks
    - No explanations
    - Return ONLY the title

    Question:
    {question}
    
    

    Title:
    """

        raw = self.llm.generate(
            prompt,
            temperature=0.1
        )

        if hasattr(raw, "content"):
            raw = raw.content

        return str(raw).strip()[:60]
    def rewrite_query(
        self,
        question: str,
        chat_history=None,
    ):
        if not chat_history or len(chat_history) < 2:
            return question
            return question

        history_text = "\n".join(
            [
                f"{m.role}: {m.content}"
                for m in chat_history
            ]
        )

        prompt = f"""
    You rewrite follow-up questions.

    Your job:

    Convert the user's latest question
    into a fully standalone question.

    Use conversation history.

    Example:


    Conversation:
    user: Explain VW mitigation program

    Question:
    Summarize that

    Output:
    Summarize the Volkswagen Mitigation Program.

    Rules:

    - Return ONLY rewritten question
    - No explanation
    - Keep original meaning


    Conversation History:

    {history_text}

    Latest Question:

    {question}

    Rewritten Question:
    """

        rewritten = self.llm.generate(
            prompt,
            temperature=0.1
        )

        return rewritten.strip()
    
    def answer(
        self,
        question: str,
        chat_history=None,
        top_k: int = 5,
        retrieved_override=None,
        temperature=0.2,
        web_search=False,
    ):

        web_context = ""
        web_results = []
        
        history_text = ""

        if chat_history:

            history_lines = []

            for msg in chat_history:

                history_lines.append(
                    f"{msg.role}: {msg.content}"
                )

            history_text = "\n".join(
                history_lines
            )

        if web_search:

            print("RUNNING TAVILY SEARCH")
            try:
                search_question = self.rewrite_query(
                    question,
                    chat_history
                )

                print(
                    "ORIGINAL:",
                    question
                )

                print(
                    "REWRITTEN:",
                    search_question
                )
                web_results = search_web(
                    search_question
                )
               
                web_sources = [
                    {
                        "title": r["title"],
                        "url": r["url"],
                        "content": r["content"]
                    }
                    for r in web_results[:5]
                ]
                print(
                "WEB RESULTS:",
                len(web_results)
            )

                web_context = "\n\n".join(
                    [
                        f"Title: {r['title']}\n"
                        f"Content: {r['content']}"
                        for r in web_results[:5]
                    ]
                )

            except Exception as e:

                print(
                    "Web search failed:",
                    e
                )

                web_context = ""

        if retrieved_override is not None:

            retrieved = retrieved_override

        else:
            search_question = self.rewrite_query(
                question,
                chat_history
            )

            print(
                "REWRITTEN:",
                search_question
            )

            retrieved = self.retriever.retrieve(
                search_question,
                top_k=top_k
            )

        evidence_map = {}
        evidence_lines = []
        sentence_idx = 0

        for item_idx, item in enumerate(
            retrieved
        ):

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

        web_section = ""

        if web_context:

            web_section = f"""

    Recent Web Information:
    {web_context}
    """

        prompt = f"""
You are a Renewable Energy Policy assistant.

You are having an ongoing conversation
with the user.

Use previous conversation context
to understand follow-up questions.

Answer using:

1. Policy documents
2. Recent web information

Rules:

- Understand references like:
  it, this, that, they, those

- Use conversation history
  to understand context

- Use policy evidence whenever possible

- Use web information for
  recent trends, statistics,
  updates and developments

- Do not invent facts

Return JSON only.

{{
  "answer":"...",
  "citations":["S1","S2"]
}}

Conversation History:

{history_text}

Policy Evidence:

{numbered_context}

{web_section}

Current User Question:

{question}
"""

        raw = self.llm.generate(
            prompt,
            temperature=temperature
        )

        if hasattr(raw, "content"):
            raw = raw.content

        raw = str(raw).strip()

        try:

            parsed = json.loads(raw)

        except Exception:

            cleaned = (
                raw.replace(
                    "```json",
                    ""
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

            try:

                parsed = json.loads(
                    cleaned
                )

            except Exception:

                parsed = {
                    "answer": cleaned,
                    "citations": [],
                }

        if isinstance(parsed, str):

            try:

                parsed = json.loads(
                    parsed
                )

            except Exception:

                parsed = {
                    "answer": parsed,
                    "citations": [],
                }

        answer = parsed.get(
            "answer",
            ""
        )

        citations = parsed.get(
            "citations",
            []
        )

        if (
            isinstance(answer, str)
            and answer.strip().startswith("{")
            and '"citations"' in answer
        ):

            try:

                nested = json.loads(
                    answer
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

        sources = []

        for idx, item in enumerate(
            retrieved
        ):

            spans = []
            cited_sentences = []

            for cid in citations:

                if cid not in evidence_map:
                    continue

                ev = evidence_map[cid]

                if ev["item_idx"] != idx:
                    continue

                sent = ev["sentence"]

                start = item[
                    "chunk_text"
                ].lower().find(
                    sent.lower()
                )

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
                    spans,
            })

        sources = sorted(
            sources,
            key=lambda x: x["score"],
            reverse=True
        )[:3]

        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "web_sources": web_results[:5]
                if web_search
                else [],
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