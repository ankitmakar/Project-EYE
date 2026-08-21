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
Good: Database error → log technical details internally → return a generic error message to the user.

---

# 3. Project Architecture Rules
Project EYE follows a decoupled modular architecture:
```text
                    ┌──────────────────────┐
                    │      Web Client      │
                    │  Dashboard / SOC UI  │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │      API Layer       │
                    │ Authentication/API   │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       ┌───────────┐     ┌────────────┐    ┌─────────────┐
       │ Detection │     │ AI Engine  │    │ Alert       │
       │ Engine    │     │ / Analysis │    │ Engine      │
       └─────┬─────┘     └──────┬─────┘    └──────┬──────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                       ┌────────────────┐
                       │ Data Layer     │
                       │ PostgreSQL     │
                       │ Redis/Queue    │
                       └────────────────┘
```

---

# 4. Recommended Technology Stack

## 4.1 Frontend
* React / Next.js / TypeScript / Tailwind CSS / Recharts or ECharts
* Frontend is never a trusted security boundary. All authorization decisions happen on the backend.

## 4.2 Backend
* Python / FastAPI / Pydantic / SQLAlchemy / Alembic / Asyncpg / Aiosqlite
* Type-safe schemas and REST endpoints with strict validation.

## 4.3 Database & Caching
* Primary relational database: PostgreSQL
* Caching, Rate Limiting & Background jobs: Redis / Celery

---

# 5. Dependency Management Rules
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

## 6.1 Authentication
* Passwords must never be stored in plaintext.
* Passwords must be hashed using a modern password hashing algorithm (Argon2 / Bcrypt).
* Authentication endpoints must be rate-limited.
* Failed login attempts must be monitored and audit-logged.
* Sessions/tokens must have controlled lifetimes (JWT access tokens max 60 minutes).
* Sensitive actions should require re-authentication where appropriate.
* Logout/revocation mechanisms must exist.

## 6.2 Passwords
Passwords must:
* Never appear in logs.
* Never appear in URLs.
* Never be returned by APIs.
* Never be included in error messages.
* Never be sent to the AI model.

## 6.3 Role-Based Access Control (RBAC) Matrix

| Role | View Dashboards & Alerts | Search Logs | Investigate & Add Notes | Manage Detections | Close Incidents & Approve Actions | Manage Users & Policies |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Viewer** | ✅ | ✅ (Read-Only) | ❌ | ❌ | ❌ | ❌ |
| **Analyst (SOC Analyst)** | ✅ | ✅ | ✅ | Read-Only | ❌ | ❌ |
| **Senior Analyst** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Service Account** | Scoped | Scoped | Scoped | ❌ | ❌ | ❌ |

---

# 7. Web & API Security Rules

## 7.1 Input Validation & SQL Injection Protection
* Always use Pydantic models for request bodies, query params, headers, and file uploads.
* Always use SQLAlchemy parameterized queries. User input must never become executable SQL syntax.

## 7.2 XSS & CSRF Protection
* All untrusted telemetry content rendered in UI must be safely escaped.
* Avoid unsafe HTML rendering (`dangerouslySetInnerHTML`).
* Enforce a strict Content Security Policy.
* Cookies must use `HttpOnly`, `Secure`, and `SameSite` policies.

## 7.3 Security Headers
Enforce standard production security headers:
* `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';`
* `Strict-Transport-Security: max-age=31536000; includeSubDomains`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## 7.4 Rate Limiting & Resource Limits
* Rate-limit abuse-prone endpoints (login, password reset, search, AI analysis, batch ingestion).
* Server-side pagination limits (`limit <= 100` or `<= 200`). Never return unbounded records.

## 7.5 SSRF, Path Traversal & Command Injection Protection
* Dedicated `SSRFGuard` validates external URLs against loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata (`169.254.169.254`).
* Never construct filesystem paths from user input.
* Never execute operating system commands from user input via raw shell strings.

---

# 8. Logging, Error Handling & Audit Standards

## 8.1 Error Handling Standards
* Global exception handlers mask technical details and database internals from clients.
* Return user-safe JSON errors: `{"detail": "...", "error_code": "...", "request_id": "..."}`.
* Technical tracebacks with correlated `request_id` are logged only internally.

## 8.2 Structured Logging & Redaction
* Structured JSON logging.
* Automatic redaction of sensitive fields (`password`, `token`, `secret`, `api_key`, `authorization`, `cookie`).

## 8.3 Audit Logging
Immutable audit trail for all security-sensitive actions:
* User login, logout, failed login
* User creation, deletion, role modification
* Detection rule creation, modification, toggling
* Alert status changes and incident modifications
* AI investigation invocations

---

# 9. Detection Engine & Incident Management Rules

## 9.1 Detection Rules
* Version-controlled, testable, explainable detection rules with MITRE ATT&CK mapping.
* No automatic destructive actions without explicit human confirmation.

## 9.2 Alert Deduplication
* Event fingerprinting (`rule_id:host:source_ip:username`) within sliding time windows to prevent alert flooding.

## 9.3 Incident Lifecycle & Evidence Integrity
* Incident states: `NEW`, `TRIAGED`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `CLOSED`, `FALSE_POSITIVE`.
* Evidence records: timestamps, source, collector, hash, raw payload.

---

# 10. AI Security, Prompt Shield & Safety Rules

## 10.1 AI as Untrusted Analysis Component
* AI provides analysis and recommendations, never autonomous administrative power.
* AI cannot execute system commands, delete data, or modify security policy.

## 10.2 Prompt Injection Defense
* Separate System Instructions, Trusted Context, and Untrusted Telemetry (`<UNTRUSTED_SECURITY_TELEMETRY>`).
* Telemetry sanitizer neutralizes delimiters and prompt injection keywords before prompt generation.

## 10.3 Observed Evidence vs AI Inference (Rule 45)
* Clear separation between **Observed Evidence** (concrete log events) and **AI Inference** (hypotheses/probabilities).

## 10.4 AI Output Validation & Safety Guardrails
* Strict Pydantic schema validation on all AI outputs.
* Safety guardrails scan recommended actions to filter out destructive or unvetted commands.

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
