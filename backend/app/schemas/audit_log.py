from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict

class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    username: str
    ip_address: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    status: str = "SUCCESS"

class AuditLogRead(BaseModel):
    id: str
    timestamp: datetime
    user_id: Optional[str] = None
    username: str
    ip_address: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    status: str

    model_config = ConfigDict(from_attributes=True)
