from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.alert import Alert
from app.models.event import Event
from app.models.incident import Incident
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
async def generate_soc_summary_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_events = (await db.execute(select(func.count(Event.id)))).scalar_one()
    total_alerts = (await db.execute(select(func.count(Alert.id)))).scalar_one()
    total_incidents = (await db.execute(select(func.count(Incident.id)))).scalar_one()
    open_incidents = (await db.execute(
        select(func.count(Incident.id)).where(Incident.status.in_(["open", "investigating"]))
    )).scalar_one()

    # Top attacked hosts
    top_hosts_q = select(Alert.host, func.count(Alert.id)).group_by(Alert.host).order_by(func.count(Alert.id).desc()).limit(5)
    top_hosts = (await db.execute(top_hosts_q)).all()

    # Top attacking IPs
    top_ips_q = select(Alert.source_ip, func.count(Alert.id)).where(Alert.source_ip.isnot(None)).group_by(Alert.source_ip).order_by(func.count(Alert.id).desc()).limit(5)
    top_ips = (await db.execute(top_ips_q)).all()

    # Top triggered rules
    top_rules_q = select(Alert.rule_name, func.count(Alert.id)).group_by(Alert.rule_name).order_by(func.count(Alert.id).desc()).limit(5)
    top_rules = (await db.execute(top_rules_q)).all()

    return {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user.username,
        "executive_metrics": {
            "total_telemetry_events": total_events,
            "total_alerts_generated": total_alerts,
            "total_incidents": total_incidents,
            "open_incidents": open_incidents,
            "soc_threat_level": "ELEVATED" if open_incidents > 0 else "NORMAL"
        },
        "top_attacked_hosts": [{"host": r[0], "alert_count": r[1]} for r in top_hosts],
        "top_attacking_ips": [{"source_ip": r[0], "alert_count": r[1]} for r in top_ips],
        "top_triggered_rules": [{"rule_name": r[0], "alert_count": r[1]} for r in top_rules]
    }
