# Project EYE — System Architecture & Application Flow

**Document Type:** Architecture / System Design  
**Project:** Project EYE — SOC-in-a-Box  
**Version:** 1.0  
**Status:** Approved

---

## 1. Architecture Overview

Project EYE is designed as a modular, security-focused SOC-in-a-Box platform for collecting security telemetry, detecting suspicious activity, correlating events, generating alerts, assisting investigation, and presenting actionable information through a web dashboard.

The architecture follows a layered design so that the frontend, API layer, detection engine, AI-assisted analysis, data storage, background workers, and security controls remain separated.

### High-Level Architecture Diagram

```text
                         ┌──────────────────────────┐
                         │       Security Data      │
                         │                          │
                         │ Logs / Syslog / Agents   │
                         │ Auth Events / Network    │
                         │ Cloud / Application Logs │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │      Ingestion Layer     │
                         │                          │
                         │ Parsers / Normalizers    │
                         │ Validation / Rate Limit  │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     Event Processing     │
                         │                          │
                         │ Enrichment / Correlation │
                         │ Deduplication / Queues   │
                         └────────────┬─────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
              ┌─────────────────┐          ┌─────────────────┐
              │ Detection Engine│          │ AI Analysis     │
              │                 │          │                 │
              │ Rules / IOC /   │          │ Explain /       │
              │ Anomaly checks  │          │ Summarize /     │
              │                 │          │ Investigate     │
              └────────┬────────┘          └────────┬────────┘
                       │                            │
                       └──────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │     Alert Management     │
                         │                          │
                         │ Severity / Risk / Status │
                         │ Incident Correlation     │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       API / Backend       │
                         │                          │
                         │ Auth / RBAC / REST APIs  │
                         │ Audit / Security Policy  │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       Web Dashboard       │
                         │                          │
                         │ Alerts / Incidents /     │
                         │ Events / Analytics       │
                         └──────────────────────────┘
```

---

## 2. Core Architectural Principles

1. **Security by design** — security controls are part of every layer.
2. **Least privilege** — services and users receive only required permissions.
3. **Defense in depth** — multiple independent security controls protect critical paths.
4. **Modularity** — ingestion, detection, AI, API, and UI should be independently maintainable.
5. **Observable by default** — important application and security actions produce audit logs.
6. **Fail safely** — failure of AI analysis must not disable deterministic detection.
7. **Human-in-the-loop** — AI recommendations assist analysts but do not automatically perform destructive response actions.
8. **Deterministic security controls first** — authentication, authorization, validation, detection rules, and audit logging must not depend on an LLM.
9. **Data minimization** — collect and retain only data required for the SOC use case.
10. **Extensibility** — new log sources, detection rules, integrations, and AI providers should be addable without redesigning the whole platform.

---

## 3. Logical Architecture Layers

### 3.1 Presentation Layer (React + TypeScript + Vite + Tailwind CSS)
- High-contrast, dark mode SOC console.
- Interactive alerts queue, incident board, log stream explorer, AI investigation workbench, and MITRE ATT&CK rule manager.
- Zero direct database access: All operations transit through authenticated REST APIs.

### 3.2 Application & API Layer (FastAPI)
- Authentication (JWT with secure hashing), RBAC enforcement, strict Pydantic input validation, rate limiting, and immutable audit logging.

### 3.3 Telemetry Ingestion Layer
- Parsers: Syslog (RFC 3164 / 5424), Linux auth (`sshd`, `sudo`, `pam`), Windows Security Events, Nginx/Apache web access logs, JSON logs.
- Normalization into the **Common Event Schema v1.0**.

### 3.4 Detection & Correlation Engine
- Deterministic YAML rules evaluated against incoming event streams.
- Sliding time-window threshold detection and IOC matching.
- Multi-event correlation engine grouping related alerts into Incidents.

### 3.5 AI Analysis Layer (Prompt-Shielded)
- Untrusted content boundary separation and data sanitization.
- Summarization, hypothesis generation, and investigation recommendation.
- Fail-safe operation: SOC detection proceeds even if AI is offline.

---

## 4. Common Event Schema (v1.0)

| Field | Type | Description |
|---|---|---|
| `event_id` | UUID / String | Unique identifier for the event |
| `timestamp` | ISO-8601 UTC | Event occurrence timestamp |
| `source` | String | Data source (e.g. `linux-auth`, `syslog`, `nginx`, `windows-event`) |
| `host` | String | Target hostname or asset identifier |
| `source_ip` | String (IPv4/IPv6) | Originating IP address |
| `destination_ip` | String (Optional) | Destination IP address |
| `username` | String (Optional) | User account associated with event |
| `event_type` | String | Normalized category (e.g. `auth_failure`, `command_exec`, `web_attack`) |
| `severity` | Enum | `info`, `low`, `medium`, `high`, `critical` |
| `message` | String | Human-readable normalized summary |
| `raw_event` | String / JSON | Original untampered log payload |
| `metadata` | JSON Object | Source-specific parsed attributes (port, process, pid, etc.) |

---

## 5. Technology Stack Decisions

| Component | Choice | Rationale |
|---|---|---|
| Backend | FastAPI (Python) | High-performance asynchronous REST API with native Pydantic validation |
| Frontend | React + TypeScript + Vite | Strongly-typed, modular, responsive analyst user interface |
| Database | PostgreSQL / SQLite | Relational integrity for alerts, incidents, users, audit trails |
| Caching & Queue | Redis / In-Memory | Transient queueing, rate limiting, and state coordination |
| Detection Logic | YAML-based Declarative Rules | Human-readable, version-controlled, explainable detection rules |
| AI Integration | Provider-Agnostic with Built-in Fallback | Supports Gemini, OpenAI, Claude, and local heuristic SOC fallback |
