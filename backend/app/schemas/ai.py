from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AIAnalyzeAlertRequest(BaseModel):
    alert_id: str
    analysis_type: str = Field(default="full_investigation", description="full_investigation | quick_summary | hypothesis_only")
    context_notes: Optional[str] = None

class AIInvestigateIncidentRequest(BaseModel):
    incident_id: str
    focus_area: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    summary: str
    observed_evidence: List[str] = Field(default_factory=list, description="Concrete verifiable facts directly extracted from logs")
    ai_inferences: List[str] = Field(default_factory=list, description="Analytical conclusions and probabilities derived from evidence")
    root_cause: str
    mitre_mapping: List[str] = Field(default_factory=list)
    threat_hypothesis: str
    recommended_actions: List[str] = Field(default_factory=list)
    confidence: float
    prompt_shield_status: str = "Passed (No Injection Detected)"
    execution_time_ms: int
    provider_used: str

class AIInvestigationChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIInvestigationChatMessage]
    alert_id: Optional[str] = None
    incident_id: Optional[str] = None
