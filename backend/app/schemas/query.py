from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class Source(BaseModel):
    chunk_id: str
    document_id: str
    score: float
    chunk_text: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]