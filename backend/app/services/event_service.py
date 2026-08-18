from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.detection.correlator import CorrelationEngine
from app.detection.engine import detection_engine
from app.ingestion.collector import IngestionPipeline
from app.models.alert import Alert
from app.models.event import Event
from app.models.incident import Incident
from app.schemas.alert import AlertCreate
from app.schemas.event import EventCreate, EventQueryFilter, IngestResponse, RawLogIngestRequest

class EventService:
    @staticmethod
    async def ingest_single_log(db: AsyncSession, request: RawLogIngestRequest) -> IngestResponse:
        # 1. Parse & Normalize
        normalized_event: EventCreate = IngestionPipeline.process_raw_log(
            source=request.source,
            raw_log=request.raw_log,
            host=request.host
        )

        # 2. Store Normalized Event
        db_event = Event(
            event_id=normalized_event.event_id,
            timestamp=normalized_event.timestamp,
            source=normalized_event.source,
            host=normalized_event.host,
            source_ip=normalized_event.source_ip,
            destination_ip=normalized_event.destination_ip,
            username=normalized_event.username,
            event_type=normalized_event.event_type,
            severity=normalized_event.severity,
            message=normalized_event.message,
            raw_event=normalized_event.raw_event,
            meta_info=normalized_event.meta_info
        )
        db.add(db_event)

        # 3. Detection Engine Evaluation
        generated_alerts = detection_engine.evaluate_event(normalized_event)
        
        saved_alerts_payload = []
        created_alert_models: List[Alert] = []

        for alert_create in generated_alerts:
            db_alert = Alert(
                alert_id=alert_create.alert_id,
                rule_id=alert_create.rule_id,
                rule_name=alert_create.rule_name,
                timestamp=alert_create.timestamp,
                severity=alert_create.severity,
                confidence=alert_create.confidence,
                source=alert_create.source,
                host=alert_create.host,
                source_ip=alert_create.source_ip,
                username=alert_create.username,
                status="new",
                description=alert_create.description,
                evidence=alert_create.evidence,
                analyst_notes=None
            )
            db.add(db_alert)
            created_alert_models.append(db_alert)
            saved_alerts_payload.append({
                "alert_id": alert_create.alert_id,
                "rule_name": alert_create.rule_name,
                "severity": alert_create.severity,
                "host": alert_create.host
            })

        # Commit event and alerts to DB
        await db.commit()
        await db.refresh(db_event)

        # 4. Correlation Evaluation
        if generated_alerts:
            # Fetch recent active alerts from last 10 minutes for correlation
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
            recent_q = select(Alert).where(Alert.timestamp >= cutoff)
            recent_res = await db.execute(recent_q)
            recent_alerts_db = recent_res.scalars().all()
            
            # Map to AlertCreate for engine
            recent_creates = [
                AlertCreate(
                    alert_id=a.alert_id,
                    rule_id=a.rule_id,
                    rule_name=a.rule_name,
                    timestamp=a.timestamp,
                    severity=a.severity,
                    confidence=a.confidence,
                    source=a.source,
                    host=a.host,
                    source_ip=a.source_ip,
                    username=a.username,
                    status=a.status,
                    description=a.description,
                    evidence=a.evidence or {}
                ) for a in recent_alerts_db if a.alert_id not in [g.alert_id for g in generated_alerts]
            ]

            incident_create = CorrelationEngine.evaluate_correlation(generated_alerts, recent_creates)
            if incident_create:
                db_incident = Incident(
                    incident_id=incident_create.incident_id,
                    title=incident_create.title,
                    description=incident_create.description,
                    severity=incident_create.severity,
                    status=incident_create.status,
                    timeline_summary=incident_create.timeline_summary,
                    ai_analysis=incident_create.ai_analysis,
                    root_cause=incident_create.root_cause,
                    mitigation_steps=incident_create.mitigation_steps,
                    analyst_notes=incident_create.analyst_notes
                )
                db.add(db_incident)
                await db.flush()

                # Link correlated alerts to the new incident
                for alert_model in created_alert_models:
                    alert_model.incident_id = db_incident.id
                
                await db.commit()

        return IngestResponse(
            status="success",
            event_id=db_event.event_id,
            alerts_generated=len(generated_alerts),
            alerts=saved_alerts_payload
        )

    @staticmethod
    async def query_events(db: AsyncSession, filters: EventQueryFilter) -> Tuple[List[Event], int]:
        query = select(Event)

        if filters.source:
            query = query.where(Event.source == filters.source.lower())
        if filters.host:
            query = query.where(Event.host.ilike(f"%{filters.host}%"))
        if filters.source_ip:
            query = query.where(Event.source_ip == filters.source_ip)
        if filters.username:
            query = query.where(Event.username.ilike(f"%{filters.username}%"))
        if filters.event_type:
            query = query.where(Event.event_type == filters.event_type.lower())
        if filters.severity:
            query = query.where(Event.severity == filters.severity.lower())
        if filters.search:
            s = f"%{filters.search}%"
            query = query.where(
                (Event.message.ilike(s)) | (Event.raw_event.ilike(s)) | (Event.host.ilike(s))
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_count_res = await db.execute(count_query)
        total = total_count_res.scalar_one()

        # Paginate
        query = query.order_by(desc(Event.timestamp)).offset(filters.offset).limit(filters.limit)
        result = await db.execute(query)
        events = list(result.scalars().all())

        return events, total

    @staticmethod
    async def get_metrics(db: AsyncSession) -> Dict[str, Any]:
        # Severity breakdown
        sev_q = select(Event.severity, func.count(Event.id)).group_by(Event.severity)
        sev_res = await db.execute(sev_q)
        sev_counts = {row[0]: row[1] for row in sev_res.all()}

        # Source breakdown
        src_q = select(Event.source, func.count(Event.id)).group_by(Event.source)
        src_res = await db.execute(src_q)
        src_counts = {row[0]: row[1] for row in src_res.all()}

        # Total events
        tot_q = select(func.count(Event.id))
        tot_res = await db.execute(tot_q)
        total_events = tot_res.scalar_one()

        # Total alerts
        alt_q = select(func.count(Alert.id))
        alt_res = await db.execute(alt_q)
        total_alerts = alt_res.scalar_one()

        # Total open incidents
        inc_q = select(func.count(Incident.id)).where(Incident.status.in_(["open", "investigating"]))
        inc_res = await db.execute(inc_q)
        open_incidents = inc_res.scalar_one()

        return {
            "total_events": total_events,
            "total_alerts": total_alerts,
            "open_incidents": open_incidents,
            "severity_breakdown": sev_counts,
            "source_breakdown": src_counts
        }
