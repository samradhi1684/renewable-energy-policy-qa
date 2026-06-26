import uuid

from sqlalchemy import (
    Column,
    String,
    ForeignKey
)

from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base



class SharedChat(Base):

    __tablename__ = "shared_chats"

    share_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    chat_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chats.id"),
        nullable=False
    )