import asyncio
import os
import sys
import httpx

EYE_API_URL = os.getenv("EYE_API_URL", "http://127.0.0.1:8000/api/v1/events/ingest")
COLLECTOR_KEY = os.getenv("COLLECTOR_API_KEY", "eye-collector-pre-shared-auth-key-2026")
UDP_PORT = int(os.getenv("SYSLOG_UDP_PORT", 5140))

class SyslogUDPProtocol(asyncio.DatagramProtocol):
    def __init__(self, http_client: httpx.AsyncClient):
        self.http_client = http_client

    def connection_made(self, transport):
        self.transport = transport
        print(f"[+] Syslog UDP Collector active on port {UDP_PORT}")

    def datagram_received(self, data, addr):
        message = data.decode("utf-8", errors="replace")
        source_ip = addr[0]
        asyncio.create_task(self.forward_log(message, source_ip))

    async def forward_log(self, message: str, source_ip: str):
        payload = {
            "source": "syslog",
            "raw_log": message,
            "host": f"syslog-{source_ip}"
        }
        headers = {"X-Collector-Key": COLLECTOR_KEY}
        try:
            resp = await self.http_client.post(EYE_API_URL, json=payload, headers=headers)
            if resp.status_code == 201:
                print(f"[Syslog] Ingested event from {source_ip} | Alerts: {resp.json().get('alerts_generated')}")
        except Exception as e:
            print(f"[!] Failed to forward syslog message: {e}")

async def main():
    async with httpx.AsyncClient(timeout=10.0) as http_client:
        loop = asyncio.get_running_loop()
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: SyslogUDPProtocol(http_client),
            local_addr=("0.0.0.0", UDP_PORT)
        )
        try:
            await asyncio.sleep(3600 * 24 * 365)
        finally:
            transport.close()

if __name__ == "__main__":
    asyncio.run(main())
