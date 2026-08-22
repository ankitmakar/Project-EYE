import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple
from app.core.logging import logger
from app.schemas.alert import AlertCreate
from app.schemas.incident import IncidentCreate

class CorrelationEngine:
    """
    Advanced Multi-Stage Correlation & Explainable Risk Scoring Engine for Project EYE.
    Correlates alerts across Entities (Host, Source IP, User Account) and attack progression vectors.
    """
    
    @staticmethod
    def calculate_risk_score(alerts: List[AlertCreate]) -> int:
        """
        Explainable Risk Scoring Model:
        Base = Sum of Alert Severities (Critical: 35, High: 25, Medium: 15, Low: 5)
        Multipliers = Multi-stage attack progression bonus + confidence weighting
        Capped at 100.
        """
        severity_weights = {
            "critical": 35,
            "high": 25,
            "medium": 15,
            "low": 5,
            "info": 2
        }
        
        base_score = sum(severity_weights.get(a.severity.lower(), 10) for a in alerts)
        avg_confidence = sum(a.confidence for a in alerts) / max(len(alerts), 1)
        
        # Progression bonus for cross-category alerts (e.g. Auth + Execution + Network)
        categories = set()
        for a in alerts:
            rid = a.rule_id.upper()
            if "AUTH" in rid: categories.add("AUTH")
            elif "EXEC" in rid or "EP" in rid: categories.add("EXEC")
            elif "PRIV" in rid: categories.add("PRIV")
            elif "PERS" in rid: categories.add("PERS")
            elif "NET" in rid: categories.add("NET")
            elif "WEB" in rid: categories.add("WEB")
            elif "FILE" in rid: categories.add("FILE")

        progression_bonus = (len(categories) - 1) * 15 if len(categories) > 1 else 0
        raw_score = (base_score * avg_confidence) + progression_bonus
        return min(int(round(raw_score)), 100)

    @classmethod
    def evaluate_correlation(cls, new_alerts: List[AlertCreate], recent_alerts: List[AlertCreate]) -> Optional[IncidentCreate]:
        if not new_alerts:
            return None

        all_alerts = recent_alerts + new_alerts
        if len(all_alerts) < 2:
            return None

        # Group by Host
        host_map: Dict[str, List[AlertCreate]] = {}
        for a in all_alerts:
            host_map.setdefault(a.host, []).append(a)

        # Group by Source IP
        ip_map: Dict[str, List[AlertCreate]] = {}
        for a in all_alerts:
            if a.source_ip:
                ip_map.setdefault(a.source_ip, []).append(a)

        # 1. Evaluate Host Correlations
        for host, host_alerts in host_map.items():
            if len(host_alerts) < 2:
                continue

            rule_ids = {a.rule_id.upper() for a in host_alerts}
            severities = [a.severity.lower() for a in host_alerts]
            rule_names = list({a.rule_name for a in host_alerts})
            alert_ids = [a.alert_id for a in host_alerts if a.alert_id]

            has_auth = any("AUTH" in rid for rid in rule_ids)
            has_exec = any("EXEC" in rid or "EP" in rid for rid in rule_ids)
            has_priv = any("PRIV" in rid for rid in rule_ids)
            has_pers = any("PERS" in rid for rid in rule_ids)
            has_web = any("WEB" in rid for rid in rule_ids)
            has_net = any("NET" in rid for rid in rule_ids)
            has_file = any("FILE" in rid for rid in rule_ids)

            # Scenario 1: Compromise Chain (Auth -> Privilege / Execution)
            if (has_auth and (has_priv or has_exec)) or (has_web and (has_exec or has_net)):
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                title = f"Multi-Stage Attack Campaign Detected on {host}"
                risk_score = cls.calculate_risk_score(host_alerts)
                incident_severity = "critical" if risk_score >= 80 or "critical" in severities else ("high" if risk_score >= 50 else "medium")

                mitre_techniques = []
                for a in host_alerts:
                    if a.evidence and "mitre_technique" in a.evidence:
                        mitre_techniques.append(a.evidence["mitre_technique"])

                timeline_events = [f"[{a.timestamp.strftime('%H:%M:%S') if hasattr(a.timestamp, 'strftime') else str(a.timestamp)}] Alert '{a.rule_name}' ({a.severity.upper()})" for a in host_alerts]

                incident = IncidentCreate(
                    incident_id=incident_id,
                    title=title,
                    description=(
                        f"Correlated {len(host_alerts)} security alerts across attack lifecycle on host '{host}'. "
                        f"Sequence: {' -> '.join(rule_names[:4])}. Calculated Risk Score: {risk_score}/100."
                    ),
                    severity=incident_severity,
                    status="open",
                    lead_analyst_id=None,
                    timeline_summary=" -> ".join(timeline_events),
                    ai_analysis={
                        "risk_score": risk_score,
                        "mitre_techniques": list(set(mitre_techniques)),
                        "attack_stages": [c for c, present in [("Authentication", has_auth), ("Web Exploitation", has_web), ("Privilege Escalation", has_priv), ("Execution", has_exec), ("Network/C2", has_net), ("File Impact", has_file)] if present]
                    },
                    root_cause=f"Adversary progressed from initial vectors to host impact on '{host}'.",
                    mitigation_steps=[
                        f"Isolate host '{host}' immediately to prevent lateral spread",
                        "Terminate suspicious active reverse shell / interpreter processes",
                        "Rotate credentials for all compromised accounts and audit sudoers configuration"
                    ],
                    analyst_notes="Generated automatically by Project EYE Correlation Engine v1.0.",
                    alert_ids=alert_ids
                )
                logger.warning(f"Correlation Engine created Incident {incident_id}: '{title}' (Risk Score: {risk_score})")
                return incident

            # Scenario 2: Ransomware Attack Progression
            if has_file or (has_net and has_exec):
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                title = f"Ransomware / High-Impact Execution Activity on {host}"
                risk_score = cls.calculate_risk_score(host_alerts)
                
                incident = IncidentCreate(
                    incident_id=incident_id,
                    title=title,
                    description=f"Critical high-impact file encryption or C2 exfiltration activity correlated on '{host}'.",
                    severity="critical",
                    status="open",
                    lead_analyst_id=None,
                    timeline_summary=f"Host '{host}' experienced critical endpoint and data impact events.",
                    ai_analysis={"risk_score": max(risk_score, 85)},
                    root_cause=f"High-impact malicious payload executed on '{host}'.",
                    mitigation_steps=[
                        f"Disconnect host '{host}' from network storage and subnets immediately",
                        "Capture volatile memory dump for forensic analysis",
                        "Verify and lock volume shadow copies"
                    ],
                    analyst_notes="Automated trigger from Ransomware/Impact Correlation Engine.",
                    alert_ids=alert_ids
                )
                logger.warning(f"Correlation Engine created Ransomware Incident {incident_id}")
                return incident

            # Scenario 3: General Threshold Correlation (>= 3 alerts)
            if len(host_alerts) >= 3:
                incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                title = f"Suspicious Activity Cluster on {host}"
                risk_score = cls.calculate_risk_score(host_alerts)
                
                incident = IncidentCreate(
                    incident_id=incident_id,
                    title=title,
                    description=f"Correlated cluster of {len(host_alerts)} alerts on host '{host}'.",
                    severity="high" if risk_score >= 60 else "medium",
                    status="open",
                    lead_analyst_id=None,
                    timeline_summary=f"Repeated security anomaly cluster observed across {len(host_alerts)} events.",
                    ai_analysis={"risk_score": risk_score},
                    root_cause=f"Coordinated alert burst on host '{host}'.",
                    mitigation_steps=[
                        f"Audit active network connections on '{host}'",
                        "Review recent authentication attempts and authorized keys"
                    ],
                    analyst_notes="Automated cluster correlation.",
                    alert_ids=alert_ids
                )
                return incident

        # 2. Evaluate External Source IP Campaign Correlations
        for src_ip, ip_alerts in ip_map.items():
            if len(ip_alerts) >= 3 and src_ip not in ["127.0.0.1", "localhost"]:
                target_hosts = list({a.host for a in ip_alerts})
                if len(target_hosts) > 1 or len(ip_alerts) >= 4:
                    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
                    title = f"Distributed Reconnaissance & Spray Campaign from {src_ip}"
                    risk_score = cls.calculate_risk_score(ip_alerts)
                    
                    incident = IncidentCreate(
                        incident_id=incident_id,
                        title=title,
                        description=f"Source IP '{src_ip}' triggered {len(ip_alerts)} alerts across hosts: {', '.join(target_hosts)}.",
                        severity="high",
                        status="open",
                        lead_analyst_id=None,
                        timeline_summary=f"Coordinated external attack campaign from {src_ip} targeting internal infrastructure.",
                        ai_analysis={"risk_score": risk_score, "source_ip": src_ip, "targeted_hosts": target_hosts},
                        root_cause=f"External adversary IP '{src_ip}' conducting automated spray or discovery.",
                        mitigation_steps=[
                            f"Block source IP '{src_ip}' on edge firewall / WAF",
                            "Enforce MFA across all targeted user accounts",
                            "Inspect perimeter logs for additional probes"
                        ],
                        analyst_notes="Generated automatically by IP Campaign Correlation.",
                        alert_ids=[a.alert_id for a in ip_alerts if a.alert_id]
                    )
                    logger.warning(f"Correlation Engine created IP Campaign Incident {incident_id}: '{title}'")
                    return incident

        return None
