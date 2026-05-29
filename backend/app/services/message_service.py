from uuid import uuid4
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.message import Message


async def create_message(
    db: AsyncSession,
    chat_id: str,
    role: str,
    content: str,
):
    message = Message(
        id=uuid4(),
        chat_id=chat_id,
        role=role,
        content=content,
        created_at=datetime.utcnow(),
    )

    db.add(message)

    await db.commit()
    await db.refresh(message)

    return message


async def list_messages(
    db: AsyncSession,
    chat_id: str,
):
    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )

    return result.scalars().all()