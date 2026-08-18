# Project EYE — SOC-in-a-Box

[![Architecture](https://img.shields.io/badge/Architecture-Modular%20SOC-blue.svg)](docs/ARCHITECTURE.md)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

**Project EYE** is an end-to-end, modular, and security-focused SOC-in-a-Box (Security Operations Center) platform designed for collecting security telemetry, parsing and normalizing heterogeneous logs, running deterministic detection & correlation rules, managing alert/incident lifecycles, and providing AI-assisted security investigation with strict prompt-injection defenses.

---

## Key Features

- 🛡️ **Multi-Source Ingestion Pipeline**: Ingest and normalize Syslog (RFC 3164/5424), Linux authentication (`auth.log`), Windows Security Events, Web Server logs (Nginx/Apache), and custom JSON security events.
- ⚡ **Deterministic Detection Engine**: Rule-based detection, sliding time-window thresholds, IOC matching, and MITRE ATT&CK matrix mapping.
- 🔗 **Event Correlation Engine**: Correlates related alerts across time windows, IPs, users, hosts, and multi-stage attack sequences into consolidated Incidents.
- 🤖 **AI Investigation Co-Pilot**: Pluggable LLM layer (Gemini, OpenAI, Claude, or Built-in Local Heuristic SOC AI) for alert explanation, hypothesis generation, timeline summarization, and remediation guidance.
- 🔒 **Prompt Injection Defense & AI Safety**: Untrusted log boundary isolation, prompt shielding, strict JSON schema validation, and deterministic safety guardrails.
- 📊 **Cyber Analyst Web Dashboard**: High-contrast, state-of-the-art SOC web application built with React, TypeScript, Tailwind CSS, Lucide icons, and Recharts.
- 🔑 **Role-Based Access Control (RBAC)**: Fine-grained permissions for `admin`, `soc_analyst`, and `viewer` roles, with immutable security audit logging.

---

## Architecture Overview

```text
                  SECURITY SOURCES
                         │
                         ▼
                    COLLECTORS
                         │
                         ▼
                     INGESTION (Parse, Validate, Normalize)
                         │
                         ▼
                       QUEUE
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       DETECTION ENGINE        EVENT STORAGE
              │
              ▼
        CORRELATION ENGINE
              │
              ▼
            ALERT
              │
              ▼
          INCIDENT
              │
        ┌─────┴─────┐
        ▼           ▼
   ANALYST       AI ASSISTANT (Prompt-Shielded)
        │           │
        └─────┬─────┘
              ▼
       INVESTIGATION & TRIAGE
              │
              ▼
          RESOLUTION
```

---

## Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
The FastAPI backend runs on `http://localhost:8000`. Interactive API Docs are available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React analyst dashboard runs on `http://localhost:5173`.

### 4. Seed Initial Data & Run Attack Simulator
```bash
# Seed initial users, rules, sample events, alerts & incidents:
python scripts/seed_db.py

# Simulate a live attack sequence (brute force, port scan, privilege escalation):
python scripts/simulate_attacks.py
```

### Default Credentials
- **Admin**: `admin@eye.security` / `EyeAdmin2026!Secure`
- **SOC Analyst**: `analyst@eye.security` / `EyeAnalyst2026!Secure`
- **Viewer**: `viewer@eye.security` / `EyeViewer2026!Secure`

---

## Project Structure

```text
project-eye/
├── docs/                # Architecture, PRD, Security, AI & API documentation
├── backend/             # FastAPI backend, models, detection & AI engine
│   ├── app/
│   │   ├── api/v1/      # REST API endpoints (auth, events, alerts, incidents, AI)
│   │   ├── core/        # Config, security, logging, middleware
│   │   ├── db/          # Database connection, models, migrations
│   │   ├── ingestion/   # Log parsers & normalizers
│   │   ├── detection/   # Detection rules & correlation engine
│   │   └── ai/          # Prompt injection shield & LLM investigation
├── frontend/            # React + TypeScript + Vite + Tailwind SOC dashboard
├── collectors/          # Syslog, Linux, Windows, and JSON log collectors
├── detection-rules/     # Curated YAML detection rules with MITRE mappings
└── scripts/             # Database seeding, attack simulator, health check
```

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Product Requirements Document (PRD)](docs/PRD.md)
- [Security Rules & Hardening](docs/SECURITY_RULES.md)
- [API Reference](docs/API.md)
- [Detection Rules Specification](docs/DETECTION_RULES.md)
- [AI Security & Prompt Shielding](docs/AI_SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
