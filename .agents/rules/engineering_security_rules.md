# Project EYE — Engineering, Security & Development Rules

**Project Type:** SOC-in-a-Box / Security Operations Platform  
**Project Name:** EYE  
**Document Type:** Engineering, Security & Development Rules  
**Version:** 1.0  
**Status:** Mandatory Project Standard  

---

# 1. Purpose of This Document

This document defines the mandatory rules, engineering standards, security requirements, technology choices, error-handling principles, AI-security controls, testing requirements, and operational guidelines for Project EYE.

The purpose is to ensure that Project EYE is:
* Secure by design
* Reliable
* Maintainable
* Explainable
* Auditable
* Modular
* Easy to test
* Resistant to common web attacks
* Resistant to common AI-specific attacks
* Safe to deploy in a real environment
* Useful for SOC analysts and cybersecurity students

Every feature added to Project EYE should follow this document.
If a new feature conflicts with these rules, the feature must be reviewed before implementation.

---

# 2. Core Philosophy of Project EYE

## 2.1 Security First
Security is not an additional feature. Security must be considered during:
1. Architecture
2. Database design
3. API design
4. Authentication
5. Frontend development
6. Logging
7. AI integration
8. Deployment
9. Monitoring
10. Testing

A feature is not considered complete if it works but introduces an unacceptable security weakness.

## 2.2 Least Privilege
Every user, service, API, database account, and process must receive only the permissions it requires.
Examples:
* A dashboard user should not automatically receive administrator permissions.
* The AI service should not have unrestricted database access.
* The web server should not have operating-system administrator privileges.
* Database users should have only the permissions required by the application.
* Background workers should not have unnecessary network access.

## 2.3 Zero Trust
Project EYE must not automatically trust:
* Users
* API requests
* Uploaded files
* Logs
* IP addresses
* Browser input
* Third-party data
* AI-generated content
* External integrations

Every important action must be authenticated, authorized, validated, and logged where appropriate.

## 2.4 Defense in Depth
Important security controls must not depend on a single protection mechanism.
The system should combine:
* Authentication
* Authorization
* Input validation
* Rate limiting
* Secure sessions/tokens
* Database access controls
* Output encoding
* Security headers
* Audit logging
* Monitoring
* Detection rules

## 2.5 Fail Securely
When something goes wrong, Project EYE should fail in a secure state.
Bad: Database error → expose database exception to user.
Good: Database error → log technical details internally → return a generic user-safe error message.

---

# 3. Project Architecture Rules
Project EYE uses a modular architecture separating:
* Web Client (SOC UI / Dashboard)
* API Layer (FastAPI REST APIs, Auth, Validation)
* Detection Engine (Rule Evaluation, Correlation, Deduplication)
* AI Engine / Analysis (Untrusted Analysis Component, Prompt Shield, Guardrails)
* Alert & Incident Engine (Triage, Notes, Mitigation Steps, Lifecycles)
* Data Layer (PostgreSQL / Relational DB, Redis / Caching & Queues)

---

# 4. Technology Stack Standards

## 4.1 Frontend
* React / Next.js / TypeScript / Tailwind CSS / Recharts or ECharts
* Frontend is NEVER a trusted security boundary. All security decisions happen on the backend.

## 4.2 Backend
* Python / FastAPI / Pydantic / SQLAlchemy / Alembic / Asyncpg / Aiosqlite
* Fast, asynchronous, type-safe APIs with strict schema validation.

## 4.3 Database & Storage
* Primary relational: PostgreSQL (SQLite for local standalone testing).
* Caching & background jobs: Redis / Celery.
* Large raw log streams must not be stored indefinitely in the primary relational database.

---

# 5. Security & Dependency Management Rules

1. Do not install unnecessary packages.
2. Prefer actively maintained packages.
3. Pin or constrain production dependencies.
4. Regularly scan dependencies for vulnerabilities (`pip-audit`, `npm audit`).
5. Remove unused dependencies.
6. Do not use abandoned security libraries.
7. Do not copy random security code from untrusted repositories.
8. Review transitive dependencies where practical.
9. Keep development and production dependencies separate.

---

# 6. Authentication, Password & RBAC Rules

## 6.1 Authentication & Passwords
* Passwords must never be stored in plaintext.
* Passwords must be hashed using a modern password hashing algorithm (Argon2 / Bcrypt).
* Authentication endpoints must be rate-limited and failed logins audit-logged.
* Sessions/tokens must have controlled lifetimes (JWT access tokens <= 60 mins).
* Sensitive actions should require re-authentication where appropriate.
* Passwords must NEVER appear in logs, URLs, error messages, or AI prompts.

## 6.2 Role-Based Access Control (RBAC)
* **Viewer**: View dashboards, alerts, approved reports. Read-only.
* **Analyst (SOC Analyst)**: Investigate alerts, search logs, create investigations, add notes, run approved AI analysis.
* **Senior Analyst**: Manage detections, close incidents, approve response actions, review analyst investigations.
* **Administrator**: Manage users, configure integrations, manage security policies and system settings.
* **System/Service Account**: Automated pipelines/collectors with restricted, scoped tokens.

## 6.3 Authorization Checks
* Every sensitive endpoint must enforce backend authorization (`require_roles(...)`).
* Never rely on frontend UI hiding buttons for security.

---

# 7. Web & API Security Rules

## 7.1 Input Validation & SQL Injection Protection
* Strict Pydantic schemas for all request bodies, query params, headers, files.
* User input must NEVER become executable SQL syntax. Always use SQLAlchemy parameterized queries.

## 7.2 XSS & CSRF Protection
* All untrusted log content rendered in UI must be safely escaped.
* Avoid `dangerouslySetInnerHTML`.
* Implement strict Content Security Policy (CSP).
* Cookie-based authentication must use `HttpOnly`, `Secure`, and `SameSite=Lax/Strict`.

## 7.3 Security Headers
Production HTTP responses must enforce:
* `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';`
* `Strict-Transport-Security: max-age=31536000; includeSubDomains`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## 7.4 Rate Limiting & Resource Limits
* Rate-limit abuse-prone endpoints (login, password reset, search, AI analysis, batch ingestion).
* Server-side pagination limits (`limit <= 100` or `<= 200`).

## 7.5 SSRF & Path Traversal Protection
* Validate all outbound URLs against private IPv4/IPv6 networks, localhost (`127.0.0.0/8`), and cloud metadata (`169.254.169.254`).
* Never construct filesystem paths directly from user input.

## 7.6 Command Injection Protection
* Never invoke raw shell strings (`shell=True`). Use fixed command lists with validated arguments and least privilege.

---

# 8. Logging, Error Handling & Audit Standards

## 8.1 Error Handling
* Catch exceptions globally.
* Log full technical traceback with correlation `request_id` internally.
* Return user-safe JSON errors: `{"detail": "...", "error_code": "...", "request_id": "..."}`.
* Never leak database errors, credentials, paths, or secrets to clients.

## 8.2 Structured Logging & Redaction
* Logs must be machine-readable structured JSON.
* Automatically redact sensitive keys: `password`, `token`, `secret`, `api_key`, `authorization`, `cookie`.

## 8.3 Audit Logging
Audit-log all security-sensitive operations:
* Login, logout, failed login attempts
* User creation, deletion, role modification
* Detection rule creation, modification, toggling
* Alert escalation, status change, incident modification
* AI investigation triggers and security policy updates

---

# 9. Detection Engine & Incident Management Rules

## 9.1 Detection Rule Standards
Rules must be explainable, version-controlled, testable, and contain:
* Rule ID, Name, Description, Severity (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Condition / Logic, MITRE ATT&CK mapping, False-positive guidance, Recommended investigation.
* Detection rules must NOT perform automatic destructive actions without human approval.

## 9.2 Alert Deduplication & Fingerprinting
* Fingerprint alerts by `rule_id:host:source_ip:username` within sliding time windows to prevent alert floods.

## 9.3 Incident Management Workflow
* Standard states: `NEW`, `TRIAGED`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `CLOSED`, `FALSE_POSITIVE`.
* Evidence integrity: record timestamps, source, collector, and raw payload.

---

# 10. AI Security & Safety Rules

## 10.1 AI as Untrusted Component
* AI is an untrusted analysis advisor, never an autonomous administrator.
* AI must NOT have direct authority to delete data, disable accounts, or execute system commands.

## 10.2 Prompt Injection Defense
* Separate System Instructions, Trusted Context, and Untrusted Security Data (`<UNTRUSTED_SECURITY_TELEMETRY>`).
* Treat all log data, usernames, user-agents, URLs as untrusted input.
* Neutralize prompt injection attempts before LLM ingestion.

## 10.3 Observed Evidence vs AI Inference (Rule 45)
* Clearly separate **Observed Evidence** (facts from logs) and **AI Inference** (hypotheses/probabilities).

## 10.4 AI Output Validation & Guardrails
* Strict Pydantic schema validation on all AI outputs.
* Inspect recommended actions with safety guardrails to block dangerous command recommendations.

---

# 11. The 15 Golden Rules of Project EYE

1. **Never trust input.**
2. **Never expose secrets.**
3. **Never rely on frontend security.**
4. **Always authenticate and authorize sensitive operations.**
5. **Use least privilege everywhere.**
6. **Treat logs and external data as untrusted.**
7. **Treat AI output as untrusted.**
8. **Never give AI unrestricted authority.**
9. **Log important security actions.**
10. **Do not expose internal errors to users.**
11. **Validate before processing.**
12. **Fail securely.**
13. **Test security assumptions, not just functionality.**
14. **Do not automatically perform destructive actions.**
15. **Every new feature must consider its attack surface.**

---

# 12. Feature Completion Definition
A feature is complete only when:
```text
Functionality + Security + Validation + Error Handling + Logging + Testing + Documentation
```
are all addressed.
