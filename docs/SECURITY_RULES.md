# Project EYE — Security Rules & Hardening Guidelines

## 1. Security Core Principles

Project EYE adheres to the following non-negotiable security rules:

1. **Zero Trust for Log Payloads**: All incoming log data is treated as untrusted user input. Never interpret, evaluate, or execute raw log content as commands or executable code.
2. **Database Isolation**: The frontend never has direct access to the database. All data operations are routed through the backend API with server-side authorization checks.
3. **Defense in Depth**: Multiple overlapping layers of validation, rate limiting, authentication, and output encoding are enforced.
4. **Least Privilege**: Users and service accounts are granted only the minimum permissions necessary for their operational role.
5. **Fail-Closed Security**: Authentication, authorization, and validation mechanisms must deny access by default when errors occur.

---

## 2. Authentication & Authorization

- **Password Hashing**: Passwords must be hashed using Argon2id or Bcrypt with adequate work factors.
- **Tokens**: JWT access tokens have a maximum lifetime of 60 minutes. Cryptographic signatures use SHA-256 (HS256 or RS256) with a minimum 256-bit key.
- **RBAC Matrix**:

| Operation | Admin | SOC Analyst | Viewer |
|---|:---:|:---:|:---:|
| View Dashboard & Metrics | ✅ | ✅ | ✅ |
| Search & View Events | ✅ | ✅ | ✅ |
| View Alerts & Incidents | ✅ | ✅ | ✅ |
| Update Alert/Incident Status | ✅ | ✅ | ❌ |
| Run AI Investigation | ✅ | ✅ | ❌ |
| Add Analyst Notes | ✅ | ✅ | ❌ |
| Manage Detection Rules | ✅ | Read-Only | ❌ |
| Manage Users & Roles | ✅ | ❌ | ❌ |
| View Security Audit Logs | ✅ | Limited | ❌ |

---

## 3. Network & Transport Security

- All communications in production must use **TLS 1.3** / HTTPS.
- Standard security headers enforced on all HTTP responses:
  - `Content-Security-Policy: default-src 'self'`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Audit Logging Standard

Every security-sensitive event must generate an immutable audit log record containing:
- Timestamp (UTC)
- Actor User ID & Username
- IP Address & User Agent
- Action / Operation Performed
- Target Entity (e.g. Alert #104, User #2)
- Old Value & New Value (where applicable)
- Outcome Status (Success / Denied / Error)
