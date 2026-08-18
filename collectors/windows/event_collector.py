import json
import os
import sys
import httpx

EYE_API_URL = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1/events/ingest")

def forward_windows_event(event_id: int, user: str, host: str, src_ip: str = "127.0.0.1"):
    log_text = f"Microsoft Windows Security Event: EventID={event_id} AccountName={user} WorkstationName={host} SourceNetworkAddress={src_ip}"
    payload = {
        "source": "windows",
        "raw_log": log_text,
        "host": host
    }
    try:
        resp = httpx.post(EYE_API_URL, json=payload, timeout=5.0)
        print(f"[Windows Collector] EventID {event_id} forwarded -> Status {resp.status_code}")
    except Exception as e:
        print(f"[!] Forwarding error: {e}")

if __name__ == "__main__":
    print("[+] Windows Event Log forwarder initialized.")
    forward_windows_event(4625, "Administrator", "DC-CORP-01", "192.168.100.55")
