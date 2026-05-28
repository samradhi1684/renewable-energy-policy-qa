from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.models.chat import Chat


async def create_chat(
    db: AsyncSession,
    user_id: str,
):
    chat = Chat(
        id=uuid4(),
        user_id=user_id,
        title="New Chat",
        created_at=datetime.utcnow(),
    )

    db.add(chat)

    await db.commit()
    await db.refresh(chat)

    return chat


async def list_chats(
    db: AsyncSession,
    user_id: str,
):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == user_id)
        .order_by(Chat.created_at.desc())
    )

    return result.scalars().all()


async def get_chat(
    db: AsyncSession,
    chat_id: str,
    user_id: str,
):
    result = await db.execute(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == user_id,
        )
    )

    return result.scalar_one_or_none()