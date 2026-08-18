from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    severity: Mapped[str] = mapped_column(String(20), index=True, default="high", nullable=False) # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(30), index=True, default="open", nullable=False) # open, investigating, contained, resolved, closed
    
    lead_analyst_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    
    timeline_summary: Mapped[str] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=True)
    mitigation_steps: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    analyst_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    lead_analyst = relationship("User", back_populates="lead_incidents", foreign_keys=[lead_analyst_id])
    alerts = relationship("Alert", back_populates="incident", foreign_keys="Alert.incident_id")

    __table_args__ = (
        Index("ix_incidents_status_severity", "status", "severity"),
    )
