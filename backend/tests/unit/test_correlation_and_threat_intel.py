import pytest
from datetime import datetime, timezone
from app.detection.correlator import CorrelationEngine
from app.schemas.alert import AlertCreate
from app.services.threat_intel_service import ThreatIntelService

def test_threat_intel_known_and_unknown_enrichment():
    res_known = ThreatIntelService.enrich_ioc("198.51.100.77")
    assert res_known["found"] is True
    assert res_known["score"] >= 90
    assert res_known["reputation"] == "malicious"
    assert "Cobalt Strike" in res_known["malware_family"]

    res_unknown = ThreatIntelService.enrich_ioc("10.0.0.50")
    assert res_unknown["found"] is False
    assert res_unknown["reputation"] == "internal"
    assert res_unknown["score"] == 0

def test_evidence_hash_integrity():
    payload = "Aug 22 21:00:00 server sshd[1234]: Failed password for root from 198.51.100.77"
    hashes = ThreatIntelService.calculate_evidence_hash(payload)
    assert "sha256" in hashes
    assert "md5" in hashes
    assert len(hashes["sha256"]) == 64
    assert len(hashes["md5"]) == 32

def test_correlation_multi_stage_compromise_chain():
    now = datetime.now(timezone.utc)
    alert1 = AlertCreate(
        alert_id="ALT-AUTH01",
        rule_id="AUTH-001",
        rule_name="SSH Brute Force Attack",
        timestamp=now,
        severity="high",
        confidence=0.9,
        source="linux-auth",
        host="srv-prod-01",
        source_ip="198.51.100.77",
        username="root",
        status="new",
        description="SSH Brute Force Attack on host srv-prod-01",
        evidence={"mitre_technique": "T1110.001"}
    )
    alert2 = AlertCreate(
        alert_id="ALT-PRIV01",
        rule_id="PRIV-001",
        rule_name="Sudo Root Privilege Escalation",
        timestamp=now,
        severity="high",
        confidence=0.85,
        source="linux-auth",
        host="srv-prod-01",
        source_ip="198.51.100.77",
        username="deploy",
        status="new",
        description="Sudo Root Escalation on host srv-prod-01",
        evidence={"mitre_technique": "T1548.003"}
    )

    incident = CorrelationEngine.evaluate_correlation([alert2], [alert1])
    assert incident is not None
    assert "Multi-Stage" in incident.title
    assert incident.severity in ["high", "critical"]
    assert len(incident.alert_ids) == 2
    assert incident.ai_analysis.get("risk_score", 0) >= 50
