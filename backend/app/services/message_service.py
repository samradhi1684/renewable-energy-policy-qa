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

async def get_recent_messages(
    db: AsyncSession,
    chat_id: str,
    limit: int = 6,
):
    result = await db.execute(
        select(Message)
        .where(
            Message.chat_id == chat_id
        )
        .order_by(
            Message.created_at.desc()
        )
        .limit(limit)
    )

    messages = (
        result.scalars().all()
    )

    # reverse so oldest first
    return list(
        reversed(messages)
    )
    
async def get_message_by_id(
    db: AsyncSession,
    message_id: str,
):
    result = await db.execute(
        select(Message).where(
            Message.id == message_id
        )
    )

    return result.scalar_one_or_none()

async def delete_messages_after(
    db: AsyncSession,
    chat_id: str,
    created_at,
):
    result = await db.execute(
        select(Message)
        .where(
            Message.chat_id == chat_id,
            Message.created_at >= created_at
        )
    )

    messages = result.scalars().all()

    for m in messages:
        await db.delete(m)

    await db.commit()