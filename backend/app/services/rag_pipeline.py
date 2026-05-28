from app.adapters.llm_client import LLMClient
from app.adapters.retriever import Retriever


class RAGPipeline:

    def __init__(self):

        self.retriever = Retriever()

        self.llm = LLMClient()

    def answer(
        self,
        question: str,
        top_k: int = 5
    ):

        retrieved = self.retriever.retrieve(
            question,
            top_k=top_k
        )

        context = "\n\n---\n\n".join(
            item["chunk_text"]
            for item in retrieved
        )

        prompt = f"""
You are a document question answering assistant.

Instructions:
- Use ONLY the provided context.
- Do NOT use outside knowledge.
- If the answer is not present in the context, respond:
  "The answer is not contained in the retrieved documents."
- Quote important numbers, dates, names, and percentages exactly.
- Keep answers concise and factual.

Context:
{context}

Question:
{question}

Answer:
"""

        answer = self.llm.generate(
            prompt
        )

        sources = retrieved

        return {
            "question": question,
            "answer": answer,
            "sources": sources
        }