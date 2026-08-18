from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

class RawLogIngestRequest(BaseModel):
    source: str = Field(description="Log source identifier: linux-auth, syslog, windows, nginx, app")
    raw_log: str = Field(description="Raw log string or json string payload")
    host: Optional[str] = Field(default=None, description="Target hostname/asset identifier if known")

class BatchIngestRequest(BaseModel):
    events: List[RawLogIngestRequest]

class EventBase(BaseModel):
    timestamp: datetime
    source: str
    host: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    username: Optional[str] = None
    event_type: str
    severity: str = "info"
    message: str
    raw_event: str
    meta_info: Dict[str, Any] = Field(default_factory=dict)

class EventCreate(EventBase):
    event_id: Optional[str] = None

class EventRead(EventBase):
    id: str
    event_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EventQueryFilter(BaseModel):
    source: Optional[str] = None
    host: Optional[str] = None
    source_ip: Optional[str] = None
    username: Optional[str] = None
    event_type: Optional[str] = None
    severity: Optional[str] = None
    search: Optional[str] = None
    limit: int = 100
    offset: int = 0

class IngestResponse(BaseModel):
    status: str
    event_id: str
    alerts_generated: int
    alerts: List[Dict[str, Any]] = Field(default_factory=list)
