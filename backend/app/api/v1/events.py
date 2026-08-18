from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.event import (
    BatchIngestRequest,
    EventQueryFilter,
    EventRead,
    IngestResponse,
    RawLogIngestRequest,
)
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events & Telemetry"])

@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_event(
    req: RawLogIngestRequest,
    db: AsyncSession = Depends(get_db),
    x_collector_key: Optional[str] = Header(default=None)
):
    # Support ingestion via pre-shared collector key or open for local simulator
    return await EventService.ingest_single_log(db, req)

@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def ingest_batch(
    batch: BatchIngestRequest,
    db: AsyncSession = Depends(get_db)
):
    if len(batch.events) > settings.MAX_BATCH_INGESTION_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Batch size exceeds maximum limit of {settings.MAX_BATCH_INGESTION_SIZE} items."
        )

    results = []
    total_alerts = 0
    for req in batch.events:
        res = await EventService.ingest_single_log(db, req)
        total_alerts += res.alerts_generated
        results.append(res)

    return {
        "status": "batch_ingested",
        "total_processed": len(batch.events),
        "total_alerts_generated": total_alerts
    }

@router.get("", response_model=Dict[str, Any])
async def list_events(
    source: Optional[str] = None,
    host: Optional[str] = None,
    source_ip: Optional[str] = None,
    username: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filters = EventQueryFilter(
        source=source,
        host=host,
        source_ip=source_ip,
        username=username,
        event_type=event_type,
        severity=severity,
        search=search,
        limit=limit,
        offset=offset
    )
    events, total = await EventService.query_events(db, filters)
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [EventRead.model_validate(e) for e in events]
    }

@router.get("/stats")
async def get_soc_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await EventService.get_metrics(db)
