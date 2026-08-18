import json
import os
import sys
import httpx

EYE_API_URL = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1/events/ingest")

def send_json_log(data: dict):
    payload = {
        "source": data.get("source", "custom"),
        "raw_log": json.dumps(data),
        "host": data.get("host", "app-server-01")
    }
    resp = httpx.post(EYE_API_URL, json=payload, timeout=5.0)
    print(f"[JSON Collector] Status {resp.status_code} | Alerts: {resp.json().get('alerts_generated')}")
    return resp.json()

if __name__ == "__main__":
    sample = {
        "source": "application",
        "host": "prod-api-01",
        "source_ip": "203.0.113.42",
        "username": "service-account",
        "event_type": "api_anomaly",
        "severity": "medium",
        "message": "Elevated API request rate on /v1/admin/keys"
    }
    send_json_log(sample)
