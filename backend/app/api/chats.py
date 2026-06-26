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

from app.services.format_service import (
    detect_format,
)

from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db

from fastapi import Depends
from app.services.title_service import generate_title

from app.dependencies import get_current_user
from app.models.user import User

from app.services.chat_service import (
    create_chat,
    list_chats,
    get_chat,
    delete_chat,
    rename_chat,
    search_chats,
    create_shared_chat,
    get_shared_chat,
    get_chat_messages,
)

from fastapi import Form
from fastapi import UploadFile
from fastapi import File

from app.adapters.llm_client import LLMClient

from app.services.document_service import (
    extract_pdf_text,
    extract_md_text,
    chunk_text,
)

from app.services.document_retriever import (
    retrieve_chunks,
)

from storage.chat_store import (
    pin_chat,
)

from app.services.message_service import (
    create_message,
    list_messages,
    get_recent_messages,
    get_message_by_id,
    delete_messages_after
)

from app.services.rag_pipeline import RAGPipeline
from fastapi.responses import (
    PlainTextResponse,
    Response,
)

from reportlab.pdfgen import canvas
from io import BytesIO


router = APIRouter(
    prefix="/chats",
    tags=["chats"]
)

pipeline = RAGPipeline()
llm = LLMClient()

# Load Whisper once
whisper_model = WhisperModel(
    "small.en",
    compute_type="int8"
)


class QueryBody(BaseModel):
    question: str
    web_search: bool = False
    
class EditMessageBody(BaseModel):
    message_id: str
    new_question: str

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

@router.get("/search")
async def search_chat_titles(
    q: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await search_chats(
        db,
        str(current_user.id),
        q,
    )
@router.patch("/{chat_id}/edit-message")
async def edit_message(
    chat_id: str,
    body: EditMessageBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    print("EDIT ROUTE HIT")
    print("MESSAGE ID RECEIVED:", body.message_id)
    # old_message = await get_message_by_id(
    #     db,
    #     body.message_id
    # )
    print(
        "MESSAGE ID RECEIVED:",
        body.message_id
    )

    old_message = await get_message_by_id(
        db,
        body.message_id
    )

    print(
        "DB LOOKUP RESULT:",
        old_message
    )

    if not old_message:
        raise HTTPException(
            status_code=404,
            detail="Message not found"
        )
    print(
    "DB CHAT ID:",
    old_message.chat_id,
    type(old_message.chat_id)
    )

    print(
        "ROUTE CHAT ID:",
        chat_id,
        type(chat_id)
    )   
    if str(old_message.chat_id) != chat_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid message"
        )
    # delete everything from edited message onward
    await delete_messages_after(
        db,
        chat_id,
        old_message.created_at
    )

    # now fetch clean history
    history = await get_recent_messages(
        db,
        chat_id
    )

    result = pipeline.answer(
        body.new_question,
        chat_history=history,
        web_search=False
    )

    await create_message(
        db,
        chat_id,
        "user",
        body.new_question
    )

    await create_message(
        db,
        chat_id,
        "assistant",
        result["answer"]
    )

    return result

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

@router.post("/{chat_id}/share")
async def share_chat(
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

    shared = await create_shared_chat(
        db,
        chat_id,
    )

    return {
        "share_id":
            shared.share_id
    }
@router.get("/shared/{share_id}")
async def get_shared_chat_data(
    share_id: str,
    db: AsyncSession = Depends(get_db),
):
    
    shared = await get_shared_chat(
        db,
        share_id
    )

    if not shared:
        raise HTTPException(
            status_code=404,
            detail="Shared chat not found"
        )

    messages = await get_chat_messages(
        db,
        shared.chat_id
    )

    return {
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    }

@router.post("/{chat_id}/query")
async def query_in_chat(
    chat_id: str,
    body: QueryBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):      
    question = body.question
    web_search = body.web_search
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
    print(
        "WEB SEARCH RECEIVED:",
        web_search
    )
    history = await get_recent_messages(
    db,
    chat_id,
    )

    result = pipeline.answer(
            question,
            chat_history=history,
            web_search=web_search,
        )

    user_msg = await create_message(
        db,
        chat_id,
        "user",
        body.question
    )

    assistant_msg = await create_message(
        db,
        chat_id,
        "assistant",
        result["answer"]
    )

    if chat.title == "New Chat":

        try:

            title = pipeline.generate_chat_title(
                question
            )

            await rename_chat(
                db,
                chat_id,
                str(current_user.id),
                title,
            )

        except Exception as e:

            print(
                "Title generation failed:",
                e
            )



    #
    # AUTO TITLE GENERATION
    #
    if chat.title == "New Chat":

        title = generate_title(
            question,
            result["answer"],
        )

        await rename_chat(
            db,
            chat_id,
            str(current_user.id),
            title,
        )

    return {
        **result,
        "user_message_id": str(user_msg.id),
        "assistant_message_id": str(assistant_msg.id)
    }

@router.post("/{chat_id}/query-file")
async def query_with_file(
    chat_id: str,
    question: str = Form(...),
    file: UploadFile = File(...),
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

    if file.filename.endswith(".pdf"):

        text = extract_pdf_text(
            file.file
        )

    elif file.filename.endswith(".md"):

        text = extract_md_text(
            file.file
        )

    else:

        raise HTTPException(
            status_code=400,
            detail="Unsupported file type",
        )

    chunks = chunk_text(text)

    retrieved = retrieve_chunks(
        question,
        chunks,
    )

    context = "\n\n".join(
        r["chunk_text"]
        for r in retrieved
    )

    output_format = detect_format(
        question
    )

    prompt = f"""
Answer using ONLY the context.

OUTPUT FORMAT:
{output_format.value}

CONTEXT:
{context}

QUESTION:
{question}
"""

    answer = llm.generate(
        prompt,
        temperature=0.2,
    )

    return {
        "answer": answer,
        "sources": retrieved,
    }
    
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
    print(messages)
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

@router.get("/{chat_id}/export")
async def export_chat(
    chat_id: str,
    format: str = "txt",
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

    title = chat.title or "chat"

    # TXT
    if format == "txt":

        content = f"Chat: {title}\n\n"

        for msg in messages:

            content += (
                f"[{msg.role.upper()}]\n"
                f"{msg.content}\n\n"
            )

        return PlainTextResponse(
            content=content,
            headers={
                "Content-Disposition":
                f'attachment; filename="{title}.txt"'
            },
        )

    # MARKDOWN
    if format == "md":

        content = f"# {title}\n\n"

        for msg in messages:

            role = (
                "User"
                if msg.role == "user"
                else "Assistant"
            )

            content += (
                f"## {role}\n\n"
                f"{msg.content}\n\n"
            )

        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition":
                f'attachment; filename="{title}.md"'
            },
        )

    # PDF
    if format == "pdf":

        buffer = BytesIO()

        pdf = canvas.Canvas(buffer)

        y = 800

        pdf.setFont(
            "Helvetica-Bold",
            16,
        )

        pdf.drawString(
            40,
            y,
            title,
        )

        y -= 40

        pdf.setFont(
            "Helvetica",
            11,
        )

        for msg in messages:

            role = (
                "USER"
                if msg.role == "user"
                else "ASSISTANT"
            )

            pdf.drawString(
                40,
                y,
                f"{role}:"
            )

            y -= 20

            text = pdf.beginText(
                60,
                y,
            )

            for line in msg.content.split("\n"):
                text.textLine(line)

            pdf.drawText(text)

            y -= (
                len(
                    msg.content.split("\n")
                )
                * 15
            ) + 30

            if y < 80:

                pdf.showPage()

                y = 800

        pdf.save()

        buffer.seek(0)

        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                f'attachment; filename="{title}.pdf"'
            },
        )

    raise HTTPException(
        status_code=400,
        detail="Invalid format",
    )

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

    assistant_msg = await create_message(
        db,
        chat_id,
        "assistant",
        result["answer"]
    )

    return {
        **result,
        "assistant_message_id":
            str(assistant_msg.id)
    }
