# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel

# from storage.chat_store import (
#     create_chat, list_chats, get_chat,
#     append_message, delete_chat, rename_chat, pin_chat,
# )
# from app.services.rag_pipeline import RAGPipeline

# router = APIRouter(prefix="/chats", tags=["chats"])
# pipeline = RAGPipeline()


# class QueryBody(BaseModel):
#     question: str


# class RenameBody(BaseModel):
#     title: str


# class PinBody(BaseModel):
#     pinned: bool


# @router.post("")
# def new_chat():
#     return create_chat()


# @router.get("")
# def get_all_chats():
#     return list_chats()


# @router.get("/{chat_id}")
# def get_chat_detail(chat_id: str):
#     chat = get_chat(chat_id)
#     if not chat:
#         raise HTTPException(status_code=404, detail="Chat not found")
#     return chat


# @router.post("/{chat_id}/query")
# def query_in_chat(chat_id: str, body: QueryBody):
#     if not get_chat(chat_id):
#         raise HTTPException(status_code=404, detail="Chat not found")
#     result = pipeline.answer(body.question)
#     append_message(chat_id, body.question, result["answer"], result["sources"])
#     return result


# @router.delete("/{chat_id}")
# def remove_chat(chat_id: str):
#     if not delete_chat(chat_id):
#         raise HTTPException(status_code=404, detail="Chat not found")
#     return {"ok": True}


# @router.patch("/{chat_id}/rename")
# def rename(chat_id: str, body: RenameBody):
#     chat = rename_chat(chat_id, body.title)
#     if not chat:
#         raise HTTPException(status_code=404, detail="Chat not found")
#     return chat


# @router.patch("/{chat_id}/pin")
# def pin(chat_id: str, body: PinBody):
#     chat = pin_chat(chat_id, body.pinned)
#     if not chat:
#         raise HTTPException(status_code=404, detail="Chat not found")
#     return chat

import os
import tempfile

from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
)
from pydantic import BaseModel
from faster_whisper import WhisperModel


from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db

from fastapi import Depends

from app.dependencies import get_current_user
from app.models.user import User

from app.services.chat_service import (
    create_chat,
    list_chats,
    get_chat,
    delete_chat,
    rename_chat,
)

from storage.chat_store import (
    pin_chat,
)

from app.services.message_service import (
    create_message,
    list_messages,
)

from app.services.rag_pipeline import RAGPipeline


router = APIRouter(
    prefix="/chats",
    tags=["chats"]
)

pipeline = RAGPipeline()

# Load Whisper once
whisper_model = WhisperModel(
    "small.en",
    compute_type="int8"
)


class QueryBody(BaseModel):
    question: str

class RegenerateBody(BaseModel):
    question: str
    sources: list
    
class RenameBody(BaseModel):
    title: str


class PinBody(BaseModel):
    pinned: bool


@router.post("")
async def new_chat(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_chat(
        db,
        str(current_user.id),
    )

@router.get("")
async def get_all_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_chats(
        db,
        str(current_user.id),
    )

@router.get("/{chat_id}")
async def get_chat_detail(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await get_chat(
        db,
        chat_id,
        str(current_user.id),
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    return chat


@router.post("/{chat_id}/query")
async def query_in_chat(
    chat_id: str,
    body: QueryBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await get_chat(
        db,
        chat_id,
        str(current_user.id),
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    result = pipeline.answer(body.question)

    await create_message(
        db,
        chat_id,
        "user",
        body.question,
    )

    await create_message(
        db,
        chat_id,
        "assistant",
        result["answer"],
    )

    return result

@router.get("/{chat_id}/messages")
async def get_messages(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await get_chat(
        db,
        chat_id,
        str(current_user.id),
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    messages = await list_messages(
        db,
        chat_id,
    )

    return messages

# NEW: Whisper transcription
@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...)
):

    suffix = os.path.splitext(
        audio.filename
    )[1] or ".webm"

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as tmp:

        contents = await audio.read()
        tmp.write(contents)
        temp_path = tmp.name

    try:

        segments, info = (
            whisper_model.transcribe(
                temp_path,
                beam_size=5
            )
        )

        text = " ".join(
            seg.text
            for seg in segments
        ).strip()

        return {
            "text": text
        }

    finally:
        if os.path.exists(
            temp_path
        ):
            os.remove(temp_path)


@router.delete("/{chat_id}")
async def remove_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await delete_chat(
        db,
        chat_id,
        str(current_user.id),
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    return {"ok": True}


@router.patch("/{chat_id}/rename")
async def rename(
    chat_id: str,
    body: RenameBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await rename_chat(
        db,
        chat_id,
        str(current_user.id),
        body.title,
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    return chat


@router.patch("/{chat_id}/pin")
def pin(
    chat_id: str,
    body: PinBody,
    current_user: User = Depends(get_current_user),
):
    chat = pin_chat(
        chat_id,
        body.pinned,
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    return chat

@router.post("/{chat_id}/regenerate")
async def regenerate_answer(
    chat_id: str,
    body: RegenerateBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await get_chat(
        db,
        chat_id,
        str(current_user.id),
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat not found",
        )

    result = pipeline.answer(
        body.question,
        retrieved_override=body.sources,
        temperature=0.7,
    )

    return result