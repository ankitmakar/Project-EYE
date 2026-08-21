from datetime import datetime, timezone
import pytest
from app.detection.engine import DetectionEngine
from app.detection.rule_loader import RuleDefinition
from app.schemas.event import EventCreate

def test_alert_deduplication_suppresses_flood():
    engine = DetectionEngine(dedup_window_seconds=60)
    
    # Create single-match rule
    rule = RuleDefinition({
        "id": "RULE-TEST-001",
        "name": "Test Single Event Rule",
        "severity": "high",
        "confidence": 0.9,
        "description": "Test rule description",
        "detection": {
            "condition": {"source": "test-src", "event_type": "suspicious_login"}
        }
    })
    
    event1 = EventCreate(
        event_id="EVT-001",
        timestamp=datetime.now(timezone.utc),
        source="test-src",
        host="web-server-01",
        source_ip="198.51.100.25",
        username="alice",
        event_type="suspicious_login",
        severity="high",
        message="Suspicious login observed",
        raw_event="raw log text"
    )
    
    # First evaluation generates an alert
    alerts1 = engine.evaluate_event(event1, [rule])
    assert len(alerts1) == 1
    assert alerts1[0].rule_id == "RULE-TEST-001"
    
    # Second immediate evaluation of identical event is deduplicated
    event2 = EventCreate(
        event_id="EVT-002",
        timestamp=datetime.now(timezone.utc),
        source="test-src",
        host="web-server-01",
        source_ip="198.51.100.25",
        username="alice",
        event_type="suspicious_login",
        severity="high",
        message="Duplicate suspicious login observed",
        raw_event="raw log text duplicate"
    )
    
    alerts2 = engine.evaluate_event(event2, [rule])
    assert len(alerts2) == 0, "Expected duplicate alert within 60s window to be suppressed"
