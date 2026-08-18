# Project EYE — Detection Rules Specification

## 1. Overview
Project EYE uses declarative YAML-based detection rules. Rules can perform:
1. **Single-event pattern matching** (regex, field matches)
2. **Threshold matching** ($N$ matching events within $T$ seconds)
3. **IOC matching** (hashes, malicious IPs, blacklisted domains)
4. **Sequence & Correlation matching** (Step A followed by Step B within window)

---

## 2. Rule Schema

```yaml
id: "EYE-RULE-AUTH-001"
name: "SSH Brute Force Attack Detected"
version: "1.0"
description: "Detects multiple failed SSH authentication attempts from a single IP within a short time window."
severity: "high"         # info | low | medium | high | critical
confidence: 0.90         # 0.0 to 1.0
enabled: true

metadata:
  author: "Project EYE SOC Team"
  tags: ["ssh", "auth", "brute-force", "initial-access"]
  mitre_attack:
    tactic: "TA0001 - Initial Access"
    technique: "T1110.001 - Brute Force: Password Guessing"
  false_positives:
    - "Legitimate users mistyping passwords repeatedly"
    - "Automated vulnerability scanner running authorized scan"

detection:
  condition:
    source: "linux-auth"
    event_type: "auth_failure"
  threshold:
    count: 5
    timeframe_seconds: 120
    group_by: ["source_ip", "host"]

response_recommendations:
  - "Inspect firewall logs for anomalous outbound traffic from host."
  - "Temporarily block offending IP at edge gateway."
  - "Enforce MFA and public-key authentication for SSH."
```

---

## 3. Correlation Engine Logic

When alerts are created, the correlation engine checks active time windows:
- **Entity Correlation**: If Alert $A$ (Failed Login) and Alert $B$ (Sudo Privilege Escalation) share the same `host` or `username` within 10 minutes, they are merged into an **Attack Sequence Incident**.
- **IP Correlation**: If multiple distinct hosts receive attacks from the same `source_ip`, an **Asset Campaign Incident** is created.
