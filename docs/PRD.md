# Project EYE — Product Requirements Document (PRD)

## 1. Executive Summary
**Project EYE** is a modular, open, and security-centric **SOC-in-a-Box** platform designed for small-to-medium enterprises, security teams, and educational labs. It delivers turn-key security telemetry collection, high-speed log normalization, deterministic threat detection, incident triage, and AI-assisted investigation while enforcing strict cybersecurity guardrails.

---

## 2. Target Personas
1. **SOC Analyst (Tier 1 & Tier 2)**: Needs an intuitive, high-velocity dashboard to triage alerts, inspect raw logs, trace attack timelines, and receive AI-generated investigation hypotheses.
2. **SOC Lead / Incident Responder**: Requires incident management, entity relationship graphs, MITRE ATT&CK coverage tracking, and forensic report exports.
3. **SOC Administrator**: Manages detection rules, user accounts, RBAC permissions, ingestion pipelines, and security audit logs.

---

## 3. Core Functional Requirements

### FR1: Multi-Format Telemetry Ingestion
- Ingest logs via REST API, Syslog collector (UDP/TCP), and simulated collectors.
- Support Syslog (RFC 3164/5424), Linux auth (`sshd`/`sudo`), Windows Security Events, Nginx/Apache logs, and custom JSON logs.
- Parse and normalize all ingested logs into the Common Event Schema v1.0.

### FR2: Deterministic Threat Detection & Correlation
- Evaluate YAML-based detection rules against normalized events in near real-time.
- Support threshold-based detection (e.g. $N$ failures within $T$ seconds from same IP).
- Correlate related alerts across entities into unified Incidents.
- Map detection rules to MITRE ATT&CK tactics and techniques.

### FR3: Alert & Incident Lifecycle Management
- Alert statuses: `new` ➔ `acknowledged` ➔ `investigating` ➔ `resolved` ➔ `closed`.
- Severity ratings: `critical`, `high`, `medium`, `low`, `info`.
- Incident management with timeline view, correlated alerts, affected assets, and analyst notes.

### FR4: AI-Assisted Security Investigation
- Provide AI analysis on demand for alerts and incidents.
- Deliver structured JSON outputs: Summary, Root Cause Analysis, MITRE Mapping, Threat Hypothesis, and Recommended Next Steps.
- Enforce strict untrusted content sanitization and prompt injection isolation.

### FR5: Role-Based Access Control (RBAC) & Auditability
- Distinct roles: `admin`, `soc_analyst`, `viewer`.
- Immutable audit log of all analyst actions, status changes, rule modifications, and authentication events.

---

## 4. Non-Functional Requirements
- **Performance**: Ingestion endpoint response time < 50ms for single events; batch processing < 200ms for 500 events.
- **Reliability**: Fail-safe detection — deterministic detection functions uninterrupted if AI service is offline.
- **Security**: Strict input validation, parameterized queries, Argon2id/bcrypt password hashing, CORS and CSP headers.
- **Usability**: State-of-the-art dark mode UI with cyber aesthetics, keyboard shortcuts, and responsive layout.
