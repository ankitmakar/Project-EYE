# Project EYE — Security Rules & Hardening Guidelines

This document outlines the operational security standards and hardening guidelines for Project EYE, derived from the mandatory [ENGINEERING_SECURITY_RULES.md](file:///docs/ENGINEERING_SECURITY_RULES.md).

## 1. Security Core Principles

1. **Zero Trust for Log Payloads**: All incoming telemetry data is treated as untrusted input. Raw log content is never evaluated as code or executable instructions.
2. **Database Isolation**: The frontend never has direct access to the database. All operations pass through the backend API with server-side authorization checks.
3. **Defense in Depth**: Overlapping layers of input validation, rate limiting, authentication, security headers, and output encoding.
4. **Least Privilege**: Users and service accounts are granted only the minimum permissions necessary for their operational role.
5. **Fail-Closed & Fail-Secure**: Authentication, authorization, and validation mechanisms deny access by default when errors occur. Internal tracebacks are never exposed to clients.

---

## 2. Authentication & RBAC Matrix

- **Password Hashing**: Passwords must be hashed using Argon2 or Bcrypt.
- **Tokens**: JWT access tokens have a maximum lifetime of 60 minutes.
- **RBAC Matrix**:

| Operation | Admin | Senior Analyst | SOC Analyst | Viewer | Service Account |
|---|:---:|:---:|:---:|:---:|:---:|
| View Dashboard & Metrics | ✅ | ✅ | ✅ | ✅ | Scoped |
| Search & View Events | ✅ | ✅ | ✅ | ✅ (Read-Only) | Scoped |
| View Alerts & Incidents | ✅ | ✅ | ✅ | ✅ | Scoped |
| Update Alert/Incident Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Run AI Investigation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add Analyst Notes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Detection Rules | ✅ | ✅ | Read-Only | ❌ | ❌ |
| Close Incidents & Approve Actions | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users & Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Security Audit Logs | ✅ | ✅ | Limited | ❌ | ❌ |

---

## 3. Network & Transport Security

- Production communications must use **TLS 1.3 / HTTPS**.
- Standard security headers enforced on all HTTP responses:
  - `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## 4. Audit Logging Standard

Every security-sensitive event generates an immutable audit record containing:
- Timestamp (UTC)
- Actor User ID & Username
- IP Address & User Agent
- Action Performed (e.g., `USER_LOGIN`, `USER_LOGIN_FAILED`, `CREATE_DETECTION_RULE`, `AI_INVESTIGATE_ALERT`)
- Resource Type & Resource ID
- Details / Metadata
- Outcome Status (Success / Denied / Error)
