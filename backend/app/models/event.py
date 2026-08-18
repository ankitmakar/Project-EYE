from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=lambda: f"evt-{uuid.uuid4().hex[:12]}")
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    source: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # linux-auth, syslog, windows, nginx, etc.
    host: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    source_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=True)
    destination_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=True)
    username: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # auth_failure, port_scan, etc.
    severity: Mapped[str] = mapped_column(String(20), index=True, default="info", nullable=False) # info, low, medium, high, critical
    message: Mapped[str] = mapped_column(Text, nullable=False)
    raw_event: Mapped[str] = mapped_column(Text, nullable=False)
    meta_info: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_events_source_host", "source", "host"),
        Index("ix_events_type_timestamp", "event_type", "timestamp"),
    )
