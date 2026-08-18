from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.exceptions import ResourceNotFoundException
from app.models.alert import Alert
from app.models.incident import Incident
from app.schemas.alert import AlertUpdate, EscalateAlertRequest

class AlertService:
    @staticmethod
    async def get_alerts(
        db: AsyncSession,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        host: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Alert], int]:
        query = select(Alert).options(selectinload(Alert.assigned_analyst))

        if status:
            query = query.where(Alert.status == status.lower())
        if severity:
            query = query.where(Alert.severity == severity.lower())
        if host:
            query = query.where(Alert.host.ilike(f"%{host}%"))

        count_q = select(func.count()).select_from(query.subquery())
        count_res = await db.execute(count_q)
        total = count_res.scalar_one()

        query = query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit)
        res = await db.execute(query)
        alerts = list(res.scalars().all())

        return alerts, total

    @staticmethod
    async def get_alert_by_id(db: AsyncSession, alert_id: str) -> Alert:
        query = select(Alert).options(selectinload(Alert.assigned_analyst)).where(
            (Alert.id == alert_id) | (Alert.alert_id == alert_id)
        )
        res = await db.execute(query)
        alert = res.scalar_one_or_none()
        if not alert:
            raise ResourceNotFoundException("Alert", alert_id)
        return alert

    @staticmethod
    async def update_alert(db: AsyncSession, alert_id: str, update_data: AlertUpdate) -> Alert:
        alert = await AlertService.get_alert_by_id(db, alert_id)

        if update_data.status is not None:
            alert.status = update_data.status
        if update_data.analyst_notes is not None:
            alert.analyst_notes = update_data.analyst_notes
        if update_data.assigned_to_id is not None:
            alert.assigned_to_id = update_data.assigned_to_id
        if update_data.incident_id is not None:
            alert.incident_id = update_data.incident_id
        if update_data.severity is not None:
            alert.severity = update_data.severity

        alert.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def escalate_to_incident(db: AsyncSession, alert_id: str, req: EscalateAlertRequest) -> Incident:
        alert = await AlertService.get_alert_by_id(db, alert_id)

        if req.incident_id:
            # Link to existing incident
            inc_q = select(Incident).where((Incident.id == req.incident_id) | (Incident.incident_id == req.incident_id))
            inc_res = await db.execute(inc_q)
            incident = inc_res.scalar_one_or_none()
            if not incident:
                raise ResourceNotFoundException("Incident", req.incident_id)
        else:
            # Create new incident
            import uuid
            inc_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
            title = req.title or f"Incident escalated from Alert {alert.alert_id}: {alert.rule_name}"
            incident = Incident(
                incident_id=inc_id,
                title=title,
                description=f"Escalated from Alert {alert.alert_id} on host {alert.host}.",
                severity=req.severity or alert.severity,
                status="investigating",
                timeline_summary=f"Alert {alert.alert_id} was escalated to formal security incident.",
                ai_analysis={},
                root_cause="Under active analyst triage and investigation.",
                mitigation_steps=[],
                analyst_notes=req.analyst_notes
            )
            db.add(incident)
            await db.flush()

        # Link alert to incident and update status
        alert.incident_id = incident.id
        alert.status = "investigating"
        await db.commit()
        await db.refresh(incident)
        return incident
