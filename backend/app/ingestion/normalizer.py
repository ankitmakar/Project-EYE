import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.schemas.event import EventCreate

class EventNormalizer:
    @staticmethod
    def normalize(parsed: Dict[str, Any], raw_log: str) -> EventCreate:
        event_id = f"evt-{uuid.uuid4().hex[:12]}"
        
        # Ensure timestamp is a valid UTC datetime
        ts = parsed.get("timestamp")
        if not isinstance(ts, datetime):
            ts = datetime.now(timezone.utc)
        elif ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        source = str(parsed.get("source", "generic")).lower()
        host = str(parsed.get("host", "unknown-host")).strip()
        source_ip = parsed.get("source_ip")
        destination_ip = parsed.get("destination_ip")
        username = parsed.get("username")
        event_type = str(parsed.get("event_type", "generic_event")).lower()
        severity = str(parsed.get("severity", "info")).lower()
        if severity not in ["info", "low", "medium", "high", "critical"]:
            severity = "info"

        message = str(parsed.get("message", raw_log[:200])).strip()
        meta_info = parsed.get("metadata", {})

        return EventCreate(
            event_id=event_id,
            timestamp=ts,
            source=source,
            host=host,
            source_ip=source_ip,
            destination_ip=destination_ip,
            username=username,
            event_type=event_type,
            severity=severity,
            message=message,
            raw_event=raw_log,
            meta_info=meta_info
        )
