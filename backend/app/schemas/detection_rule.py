from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class DetectionRuleBase(BaseModel):
    rule_id: str
    name: str
    description: Optional[str] = None
    severity: str = "medium"
    confidence: float = 0.85
    enabled: bool = True
    version: str = "1.0"
    category: str = "authentication"
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    yaml_content: str

class DetectionRuleCreate(DetectionRuleBase):
    pass

class DetectionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    enabled: Optional[bool] = None
    category: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    yaml_content: Optional[str] = None

class DetectionRuleRead(DetectionRuleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RuleTestRequest(BaseModel):
    yaml_content: str
    sample_logs: list[str] = Field(description="List of raw or normalized sample logs to test against")
