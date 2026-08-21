from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogRead

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=Dict[str, Any])
async def list_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    query = select(AuditLog)

    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    if username:
        query = query.where(AuditLog.username.ilike(f"%{username}%"))
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type.lower())

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    query = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit)
    res = await db.execute(query)
    logs = list(res.scalars().all())

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [AuditLogRead.model_validate(l) for l in logs]
    }
