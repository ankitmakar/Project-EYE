# Project EYE — REST API Specification (v1)

**Base URL**: `/api/v1`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates a user and returns an access token.
- **Request Body**:
  ```json
  {
    "username": "admin@eye.security",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr-1",
      "email": "admin@eye.security",
      "full_name": "SOC Administrator",
      "role": "admin"
    }
  }
  ```

### `GET /auth/me`
Retrieves details of the currently authenticated user.

---

## 2. Telemetry Ingestion & Events (`/events`)

### `POST /events/ingest`
Ingests a single raw or pre-parsed log entry.
- **Request Body**:
  ```json
  {
    "source": "linux-auth",
    "raw_log": "Aug 18 20:45:10 server-01 sshd[1234]: Failed password for invalid user root from 192.168.1.105 port 44212 ssh2",
    "host": "server-01"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "status": "ingested",
    "event_id": "evt-7a8f9c",
    "alerts_generated": 1
  }
  ```

### `POST /events/batch`
Ingests a batch of events (up to 1,000 items).

### `GET /events`
Queries normalized security events with pagination and filters (`source`, `host`, `source_ip`, `event_type`, `severity`, `time_from`, `time_to`).

### `GET /events/stats`
Returns aggregation statistics for event volume over time, source breakdown, and severity counts.

---

## 3. Alerts (`/alerts`)

### `GET /alerts`
Lists alerts filtered by status, severity, rule ID, or assigned analyst.

### `GET /alerts/{id}`
Returns full alert detail, evidence payload, and associated raw event chain.

### `PATCH /alerts/{id}`
Updates alert status (`acknowledged`, `investigating`, `resolved`, `closed`), assigned analyst, or analyst notes.

### `POST /alerts/{id}/escalate`
Promotes an alert to a new or existing Incident.

---

## 4. Incidents (`/incidents`)

### `GET /incidents`
Lists all security incidents.

### `GET /incidents/{id}`
Returns incident details, correlated alert timeline, affected entities (hosts, IPs, users), and analyst notes.

### `PATCH /incidents/{id}`
Updates incident status, severity, lead responder, or resolution summary.

### `POST /incidents/{id}/notes`
Appends an analyst note or investigation finding to the incident.

---

## 5. Detection Rules (`/detections`)

### `GET /detections/rules`
Lists all active and disabled detection rules with MITRE ATT&CK tags.

### `POST /detections/rules`
Creates a new YAML-based detection rule.

### `PATCH /detections/rules/{id}/toggle`
Enables or disables a specific rule.

### `POST /detections/test`
Dry-runs a detection rule against sample logs without generating real alerts.

---

## 6. AI Investigation (`/ai`)

### `POST /ai/analyze-alert`
Performs prompt-shielded AI analysis on an alert.
- **Request Body**:
  ```json
  {
    "alert_id": "alt-001",
    "analysis_type": "full_investigation"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "summary": "Repeated SSH brute force attempts detected from untrusted IP.",
    "root_cause": "Automated dictionary attack against root credential.",
    "mitre_mapping": ["T1110 - Brute Force", "T1110.001 - Password Guessing"],
    "threat_hypothesis": "External actor attempting initial access to pivot to internal network.",
    "recommended_actions": [
      "Block IP 192.168.1.105 on perimeter firewall",
      "Verify root SSH login is disabled in sshd_config",
      "Check host server-01 for any subsequent successful logins"
    ],
    "confidence": 0.95,
    "prompt_shield_status": "Passed (No Injection Detected)"
  }
  ```

---

## 7. Audit Logs (`/audit-logs`)
- `GET /audit-logs`: Retrieves immutable security audit records.
