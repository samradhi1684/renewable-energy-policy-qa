from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
)

from app.adapters.llm_client import LLMClient
from app.services.document_service import (
    extract_pdf_text,
    extract_md_text,
)

router = APIRouter(
    prefix="/document",
    tags=["document"],
)

llm = LLMClient()