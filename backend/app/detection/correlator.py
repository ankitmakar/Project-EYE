import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.core.logging import logger
from app.schemas.alert import AlertCreate
from app.schemas.incident import IncidentCreate

class CorrelationEngine:
    """
    Correlates individual security alerts across entities (Host, Source IP, User)
    into structured Incidents.
    """
    
    @staticmethod
    def evaluate_correlation(new_alerts: List[AlertCreate], recent_alerts: List[AlertCreate]) -> Optional[IncidentCreate]:
        if not new_alerts:
            return None

        all_alerts = recent_alerts + new_alerts
        if len(all_alerts) < 2:
            return None

        # Check for Host Attack Progression (e.g. Brute Force + Privilege Escalation / Shell)
        host_map: Dict[str, List[AlertCreate]] = {}
        for a in all_alerts:
            host_map.setdefault(a.host, []).append(a)

        for host, host_alerts in host_map.items():
            rule_ids = {a.rule_id for a in host_alerts}
            
            # Rule correlation check: Authentication breach + endpoint escalation
            has_auth = any("AUTH" in rid for rid in rule_ids)
            has_endpoint = any("EP" in rid for rid in rule_ids)
            has_web = any("WEB" in rid for rid in rule_ids)
            
            if (has_auth and has_endpoint) or (has_web and has_endpoint) or len(host_alerts) >= 3:
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                title = f"Multi-Stage Attack Chain on {host}"
                desc = (
                    f"Correlated {len(host_alerts)} distinct alerts on host '{host}'. "
                    f"Attack progression includes {', '.join(set(a.rule_name for a in host_alerts))}."
                )
                
                # Determine max severity
                severities = [a.severity for a in host_alerts]
                incident_severity = "critical" if "critical" in severities else ("high" if "high" in severities else "medium")

                incident = IncidentCreate(
                    incident_id=incident_id,
                    title=title,
                    description=desc,
                    severity=incident_severity,
                    status="open",
                    lead_analyst_id=None,
                    timeline_summary=f"Automated correlation identified coordinated malicious sequence across {len(host_alerts)} events.",
                    ai_analysis={},
                    root_cause="Automated correlation detected multi-stage lateral movement or credential attack.",
                    mitigation_steps=[
                        f"Isolate host '{host}' from local subnet",
                        "Review active network sockets and running processes",
                        "Rotate credentials for compromised user accounts"
                    ],
                    analyst_notes="Generated automatically by Project EYE Correlation Engine.",
                    alert_ids=[a.alert_id for a in host_alerts if a.alert_id]
                )
                logger.warning(f"Correlation Engine created Incident {incident_id}: '{title}'")
                return incident

        return None
