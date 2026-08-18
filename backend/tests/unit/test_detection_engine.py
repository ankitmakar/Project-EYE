from datetime import datetime, timezone
from app.detection.engine import detection_engine
from app.detection.rule_loader import RuleLoader
from app.schemas.event import EventCreate

def test_single_event_detection():
    # Privilege Escalation Event
    event = EventCreate(
        event_id="evt-test-01",
        timestamp=datetime.now(timezone.utc),
        source="linux-auth",
        host="srv-01",
        source_ip="10.0.0.1",
        username="dev",
        event_type="privilege_escalation",
        severity="high",
        message="User dev ran sudo as root",
        raw_event="dev : USER=root ; COMMAND=/bin/sh",
        meta_info={}
    )
    
    alerts = detection_engine.evaluate_event(event)
    assert len(alerts) >= 1
    assert any(a.rule_id == "EYE-RULE-EP-001" for a in alerts)

def test_threshold_brute_force_detection():
    engine = detection_engine
    
    # Send 4 failed logins (threshold is 5)
    for i in range(4):
        evt = EventCreate(
            event_id=f"evt-bf-{i}",
            timestamp=datetime.now(timezone.utc),
            source="linux-auth",
            host="db-01",
            source_ip="192.168.10.99",
            username="root",
            event_type="auth_failure",
            severity="medium",
            message=f"Failed login attempt {i}",
            raw_event=f"Failed password attempt {i}",
            meta_info={}
        )
        alerts = engine.evaluate_event(evt)
        # Should not trigger on attempts 1..4 for the brute force threshold rule
        bf_alerts = [a for a in alerts if a.rule_id == "EYE-RULE-AUTH-001"]
        assert len(bf_alerts) == 0

    # 5th attempt triggers threshold!
    evt5 = EventCreate(
        event_id="evt-bf-4",
        timestamp=datetime.now(timezone.utc),
        source="linux-auth",
        host="db-01",
        source_ip="192.168.10.99",
        username="root",
        event_type="auth_failure",
        severity="medium",
        message="Failed login attempt 5",
        raw_event="Failed password attempt 5",
        meta_info={}
    )
    alerts5 = engine.evaluate_event(evt5)
    bf_alerts = [a for a in alerts5 if a.rule_id == "EYE-RULE-AUTH-001"]
    assert len(bf_alerts) == 1
    assert bf_alerts[0].severity == "high"
