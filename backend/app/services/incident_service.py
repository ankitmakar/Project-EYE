from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.exceptions import ResourceNotFoundException
from app.models.alert import Alert
from app.models.incident import Incident
from app.schemas.incident import AddIncidentNoteRequest, IncidentCreate, IncidentUpdate

class IncidentService:
    @staticmethod
    async def get_incidents(
        db: AsyncSession,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Incident], int]:
        query = select(Incident).options(
            selectinload(Incident.lead_analyst),
            selectinload(Incident.alerts)
        )

        if status:
            query = query.where(Incident.status == status.lower())
        if severity:
            query = query.where(Incident.severity == severity.lower())

        count_q = select(func.count()).select_from(query.subquery())
        count_res = await db.execute(count_q)
        total = count_res.scalar_one()

        query = query.order_by(desc(Incident.created_at)).offset(offset).limit(limit)
        res = await db.execute(query)
        incidents = list(res.scalars().all())

        return incidents, total

    @staticmethod
    async def get_incident_by_id(db: AsyncSession, incident_id: str) -> Incident:
        query = select(Incident).options(
            selectinload(Incident.lead_analyst),
            selectinload(Incident.alerts)
        ).where(
            (Incident.id == incident_id) | (Incident.incident_id == incident_id)
        )
        res = await db.execute(query)
        incident = res.scalar_one_or_none()
        if not incident:
            raise ResourceNotFoundException("Incident", incident_id)
        return incident

    @staticmethod
    async def create_incident(db: AsyncSession, inc_in: IncidentCreate) -> Incident:
        import uuid
        inc_id = inc_in.incident_id or f"INC-{uuid.uuid4().hex[:8].upper()}"

        incident = Incident(
            incident_id=inc_id,
            title=inc_in.title,
            description=inc_in.description,
            severity=inc_in.severity,
            status=inc_in.status,
            lead_analyst_id=inc_in.lead_analyst_id,
            timeline_summary=inc_in.timeline_summary,
            ai_analysis=inc_in.ai_analysis,
            root_cause=inc_in.root_cause,
            mitigation_steps=inc_in.mitigation_steps,
            analyst_notes=inc_in.analyst_notes
        )
        db.add(incident)
        await db.flush()

        # Link alert IDs if provided
        if inc_in.alert_ids:
            alerts_q = select(Alert).where(Alert.alert_id.in_(inc_in.alert_ids))
            alerts_res = await db.execute(alerts_q)
            for alert in alerts_res.scalars().all():
                alert.incident_id = incident.id
                alert.status = "investigating"

        await db.commit()
        await db.refresh(incident)
        return incident

    @staticmethod
    async def update_incident(db: AsyncSession, incident_id: str, update_data: IncidentUpdate) -> Incident:
        incident = await IncidentService.get_incident_by_id(db, incident_id)

        if update_data.title is not None:
            incident.title = update_data.title
        if update_data.description is not None:
            incident.description = update_data.description
        if update_data.severity is not None:
            incident.severity = update_data.severity
        if update_data.status is not None:
            incident.status = update_data.status
            if update_data.status in ["resolved", "closed"]:
                incident.closed_at = datetime.now(timezone.utc)
        if update_data.lead_analyst_id is not None:
            incident.lead_analyst_id = update_data.lead_analyst_id
        if update_data.timeline_summary is not None:
            incident.timeline_summary = update_data.timeline_summary
        if update_data.root_cause is not None:
            incident.root_cause = update_data.root_cause
        if update_data.mitigation_steps is not None:
            incident.mitigation_steps = update_data.mitigation_steps
        if update_data.analyst_notes is not None:
            incident.analyst_notes = update_data.analyst_notes

        incident.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(incident)
        return incident

    @staticmethod
    async def add_note(db: AsyncSession, incident_id: str, author_username: str, note_data: AddIncidentNoteRequest) -> Incident:
        incident = await IncidentService.get_incident_by_id(db, incident_id)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        formatted_entry = f"[{ts}] {author_username}: {note_data.note}"
        
        if incident.analyst_notes:
            incident.analyst_notes += f"\n{formatted_entry}"
        else:
            incident.analyst_notes = formatted_entry

        incident.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(incident)
        return incident
