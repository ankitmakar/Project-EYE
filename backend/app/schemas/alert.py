from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserRead

class AlertBase(BaseModel):
    rule_id: str
    rule_name: str
    timestamp: datetime
    severity: str = "medium"
    confidence: float = 0.85
    source: str
    host: str
    source_ip: Optional[str] = None
    username: Optional[str] = None
    status: str = "new"
    description: Optional[str] = None
    evidence: Dict[str, Any] = Field(default_factory=dict)
    analyst_notes: Optional[str] = None
    assigned_to_id: Optional[str] = None
    incident_id: Optional[str] = None

class AlertCreate(AlertBase):
    alert_id: Optional[str] = None

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    analyst_notes: Optional[str] = None
    assigned_to_id: Optional[str] = None
    incident_id: Optional[str] = None
    severity: Optional[str] = None

class AlertRead(AlertBase):
    id: str
    alert_id: str
    created_at: datetime
    updated_at: datetime
    assigned_analyst: Optional[UserRead] = None

    model_config = ConfigDict(from_attributes=True)

class EscalateAlertRequest(BaseModel):
    incident_id: Optional[str] = None
    title: Optional[str] = None
    severity: Optional[str] = None
    analyst_notes: Optional[str] = None
