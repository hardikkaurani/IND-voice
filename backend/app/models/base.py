"""Base model definitions and mixins."""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from backend.app.core.database import Base


class TimestampMixin:
    """Timestamp mixin ensuring consistent UTC timestamps."""
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
