from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.incident import (
    AddIncidentNoteRequest,
    IncidentCreate,
    IncidentDetailRead,
    IncidentRead,
    IncidentUpdate,
)
from app.services.audit_service import AuditService
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=Dict[str, Any])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incidents, total = await IncidentService.get_incidents(
        db=db,
        status=status,
        severity=severity,
        limit=limit,
        offset=offset
    )
    items = []
    for inc in incidents:
        read_obj = IncidentRead.model_validate(inc)
        read_obj.alerts_count = len(inc.alerts) if inc.alerts else 0
        items.append(read_obj)

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items
    }

@router.get("/{incident_id}", response_model=IncidentDetailRead)
async def get_incident_detail(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = await IncidentService.get_incident_by_id(db, incident_id)
    detail = IncidentDetailRead.model_validate(incident)
    detail.alerts_count = len(incident.alerts) if incident.alerts else 0
    detail.alerts = [
        {
            "alert_id": a.alert_id,
            "rule_name": a.rule_name,
            "severity": a.severity,
            "host": a.host,
            "source_ip": a.source_ip,
            "timestamp": a.timestamp.isoformat(),
            "status": a.status,
            "evidence": a.evidence
        }
        for a in incident.alerts
    ]
    return detail

@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
async def create_incident(
    inc_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    incident = await IncidentService.create_incident(db, inc_in)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_INCIDENT",
        resource_type="incident",
        resource_id=incident.incident_id,
        details={"title": incident.title, "severity": incident.severity}
    )
    return IncidentRead.model_validate(incident)

@router.patch("/{incident_id}", response_model=IncidentRead)
async def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    incident = await IncidentService.update_incident(db, incident_id, update_data)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_INCIDENT",
        resource_type="incident",
        resource_id=incident.incident_id,
        details={"status": incident.status, "severity": incident.severity}
    )
    return IncidentRead.model_validate(incident)

@router.post("/{incident_id}/notes", response_model=IncidentRead)
async def add_incident_note(
    incident_id: str,
    note_data: AddIncidentNoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    incident = await IncidentService.add_note(db, incident_id, current_user.username, note_data)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="ADD_INCIDENT_NOTE",
        resource_type="incident",
        resource_id=incident.incident_id,
        details={"note_snippet": note_data.note[:100]}
    )
    return IncidentRead.model_validate(incident)
