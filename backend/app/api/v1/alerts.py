from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.alert import AlertRead, AlertUpdate, EscalateAlertRequest
from app.schemas.incident import IncidentRead
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=Dict[str, Any])
async def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    host: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts, total = await AlertService.get_alerts(
        db=db,
        status=status,
        severity=severity,
        host=host,
        limit=limit,
        offset=offset
    )
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [AlertRead.model_validate(a) for a in alerts]
    }

@router.get("/{alert_id}", response_model=AlertRead)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = await AlertService.get_alert_by_id(db, alert_id)
    return AlertRead.model_validate(alert)

@router.patch("/{alert_id}", response_model=AlertRead)
async def update_alert_status(
    alert_id: str,
    update_data: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "soc_analyst"]))
):
    alert = await AlertService.update_alert(db, alert_id, update_data)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_ALERT",
        resource_type="alert",
        resource_id=alert.alert_id,
        details={"status": alert.status, "assigned_to": alert.assigned_to_id}
    )
    return AlertRead.model_validate(alert)

@router.post("/{alert_id}/escalate", response_model=IncidentRead)
async def escalate_alert(
    alert_id: str,
    req: EscalateAlertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "soc_analyst"]))
):
    incident = await AlertService.escalate_to_incident(db, alert_id, req)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="ESCALATE_ALERT_TO_INCIDENT",
        resource_type="incident",
        resource_id=incident.incident_id,
        details={"from_alert": alert_id}
    )
    return IncidentRead.model_validate(incident)
