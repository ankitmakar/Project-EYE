from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserRead

class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "high"
    status: str = "open"
    lead_analyst_id: Optional[str] = None
    timeline_summary: Optional[str] = None
    ai_analysis: Dict[str, Any] = Field(default_factory=dict)
    root_cause: Optional[str] = None
    mitigation_steps: List[str] = Field(default_factory=list)
    analyst_notes: Optional[str] = None

class IncidentCreate(IncidentBase):
    incident_id: Optional[str] = None
    alert_ids: List[str] = Field(default_factory=list)

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    lead_analyst_id: Optional[str] = None
    timeline_summary: Optional[str] = None
    root_cause: Optional[str] = None
    mitigation_steps: Optional[List[str]] = None
    analyst_notes: Optional[str] = None

class IncidentRead(IncidentBase):
    id: str
    incident_id: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    lead_analyst: Optional[UserRead] = None
    alerts_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class IncidentDetailRead(IncidentRead):
    alerts: List[Dict[str, Any]] = Field(default_factory=list)

class AddIncidentNoteRequest(BaseModel):
    note: str
