# Project EYE — Deployment Guide

## 1. Local Development Mode

### Requirements
- Python 3.10+
- Node.js 18+

### Setup & Run
```bash
# 1. Clone repository and navigate to EYE
cd "d:\Project EYE\EYE"

# 2. Backend Setup
cd backend
python -m venv venv
.\venv\Scripts\activate     # Windows
# or: source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt

# Run backend (uses SQLite by default)
python -m app.main

# 3. Seed initial database in another terminal
python scripts/seed_db.py

# 4. Frontend Setup
cd ../frontend
npm install
npm run dev
```

Visit the dashboard at `http://localhost:5173`.

---

## 2. Docker Compose Deployment (Production-Ready)

```bash
docker-compose up -d --build
```
This deploys:
- PostgreSQL 16 (Port 5432)
- Redis 7 (Port 6379)
- FastAPI Backend (Port 8000)
- React Frontend (Port 5173 / 80)
- Built-in Syslog Receiver (Port 5140 UDP/TCP)

---

## 3. Production Hardening Checklist
1. Set a strong 32+ character random `SECRET_KEY` in `.env`.
2. Configure `ALLOWED_ORIGINS` to exact trusted domain names.
3. Switch `DATABASE_URL` to a dedicated, firewall-protected PostgreSQL instance.
4. Enable TLS termination via Nginx / Cloudflare reverse proxy.
5. Set `DEBUG=False`.
