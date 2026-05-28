from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fastapi import Depends

from app.dependencies import get_current_user
from app.models.user import User

from storage.chat_store import (
    create_chat, list_chats, get_chat,
    append_message, delete_chat, rename_chat, pin_chat,
)
from app.services.rag_pipeline import RAGPipeline

router = APIRouter(prefix="/chats", tags=["chats"])
pipeline = RAGPipeline()


class QueryBody(BaseModel):
    question: str


class RenameBody(BaseModel):
    title: str


class PinBody(BaseModel):
    pinned: bool


@router.post("")
def new_chat(
    current_user: User = Depends(get_current_user),
):
    return create_chat()

@router.get("")
def get_all_chats(
    current_user: User = Depends(get_current_user),
):
    return list_chats()

@router.get("/{chat_id}")
def get_chat_detail(
    chat_id: str,
    current_user: User = Depends(get_current_user),
):
    chat = get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.post("/{chat_id}/query")
def query_in_chat(
    chat_id: str,
    body: QueryBody,
    current_user: User = Depends(get_current_user),
):
    if not get_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    result = pipeline.answer(body.question)
    append_message(chat_id, body.question, result["answer"], result["sources"])
    return result


@router.delete("/{chat_id}")
def remove_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
):
    if not delete_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}


@router.patch("/{chat_id}/rename")
def rename(
    chat_id: str,
    body: RenameBody,
    current_user: User = Depends(get_current_user),
):
    chat = rename_chat(chat_id, body.title)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.patch("/{chat_id}/pin")
def pin(
    chat_id: str,
    body: PinBody,
    current_user: User = Depends(get_current_user),
):
    chat = pin_chat(chat_id, body.pinned)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat