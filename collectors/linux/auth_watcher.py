import asyncio
import os
import sys
import httpx

EYE_API_URL = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1/events/ingest")
AUTH_LOG_PATH = os.getenv("AUTH_LOG_PATH", "/var/log/auth.log")

async def tail_log(file_path: str):
    if not os.path.exists(file_path):
        print(f"[!] Warning: Log file '{file_path}' does not exist. Running in simulation watcher mode.")
        return

    async with httpx.AsyncClient(timeout=10.0) as client:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if not line:
                    await asyncio.sleep(0.5)
                    continue

                line = line.strip()
                if line:
                    payload = {"source": "linux-auth", "raw_log": line, "host": os.uname().nodename if hasattr(os, "uname") else "linux-host"}
                    try:
                        resp = await client.post(EYE_API_URL, json=payload)
                        print(f"[Linux Collector] Log forwarded -> Status {resp.status_code}")
                    except Exception as e:
                        print(f"[!] Ingestion failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(tail_log(AUTH_LOG_PATH))
    except KeyboardInterrupt:
        print("\nWatcher stopped.")
