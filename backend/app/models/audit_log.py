from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    username: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # LOGIN, LOGOUT, UPDATE_ALERT, UPDATE_INCIDENT, etc.
    resource_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # alert, incident, rule, user, auth
    resource_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="SUCCESS", nullable=False) # SUCCESS, DENIED, ERROR

    __table_args__ = (
        Index("ix_audit_logs_action_timestamp", "action", "timestamp"),
    )
