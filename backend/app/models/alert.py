from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=lambda: f"ALT-{uuid.uuid4().hex[:8].upper()}")
    rule_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, default=lambda: datetime.now(timezone.utc), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), index=True, default="medium", nullable=False) # low, medium, high, critical
    confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    
    source: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    host: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    source_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=True)
    username: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    
    status: Mapped[str] = mapped_column(String(30), index=True, default="new", nullable=False) # new, acknowledged, investigating, resolved, closed
    description: Mapped[str] = mapped_column(Text, nullable=True)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    analyst_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    assigned_to_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assigned_analyst = relationship("User", back_populates="assigned_alerts", foreign_keys=[assigned_to_id])
    incident = relationship("Incident", back_populates="alerts", foreign_keys=[incident_id])

    __table_args__ = (
        Index("ix_alerts_status_severity", "status", "severity"),
    )
