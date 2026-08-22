from fastapi import APIRouter, Depends, Query
from typing import Any, Dict, List
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.threat_intel_service import ThreatIntelService

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence & IOCs"])

@router.get("/iocs")
async def list_iocs(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """List all registered and monitored indicators of compromise."""
    return ThreatIntelService.list_top_iocs()

@router.get("/enrich")
async def enrich_ioc(
    indicator: str = Query(..., description="IP, domain, or hash to enrich"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Enrich an indicator with threat intelligence feeds, attribution, and risk scoring."""
    return ThreatIntelService.enrich_ioc(indicator)

@router.post("/evidence/hash")
async def verify_evidence_hash(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Calculate and verify digital forensics SHA-256 and MD5 hash integrity."""
    raw_data = payload.get("data", "")
    return ThreatIntelService.calculate_evidence_hash(raw_data)
