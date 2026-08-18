import asyncio
import os
import sys
import httpx

API_HEALTH_URL = os.getenv("EYE_HEALTH_URL", "http://127.0.0.1:8000/health")

async def check():
    print("="*50)
    print("  PROJECT EYE -- SYSTEM HEALTH DIAGNOSTICS")
    print("="*50)
    print(f"[*] Probing backend endpoint: {API_HEALTH_URL} ...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(API_HEALTH_URL)
            if resp.status_code == 200:
                data = resp.json()
                print("[SUCCESS] Backend Service: HEALTHY")
                print(f"    - Service:            {data.get('service')}")
                print(f"    - Version:            {data.get('version')}")
                print(f"    - Environment:        {data.get('environment')}")
                print(f"    - Active Rules Count: {data.get('active_rules_count')}")
            else:
                print(f"[!] Backend returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        print("    Ensure backend is running (`uvicorn app.main:app`).")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(check())
