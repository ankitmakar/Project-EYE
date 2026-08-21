from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.ai import (
    AIAnalysisResponse,
    AIAnalyzeAlertRequest,
    AIInvestigateIncidentRequest,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Investigation Co-Pilot"])

@router.post("/analyze-alert", response_model=AIAnalysisResponse)
async def analyze_alert_with_ai(
    req: AIAnalyzeAlertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    return await AIService.analyze_alert(
        db=db,
        username=current_user.username,
        user_id=current_user.id,
        req=req
    )

@router.post("/investigate-incident", response_model=AIAnalysisResponse)
async def investigate_incident_with_ai(
    req: AIInvestigateIncidentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    return await AIService.investigate_incident(
        db=db,
        username=current_user.username,
        user_id=current_user.id,
        req=req
    )
