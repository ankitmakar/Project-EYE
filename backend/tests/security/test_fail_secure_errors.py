import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert "default-src 'self'" in headers["content-security-policy"]
    assert "max-age=31536000" in headers["strict-transport-security"]
    assert "geolocation=()" in headers["permissions-policy"]

@pytest.mark.asyncio
async def test_unauthenticated_request_fails_closed(client: AsyncClient):
    # Attempting to fetch incidents without token should fail closed (401)
    response = await client.get("/api/v1/incidents")
    assert response.status_code == 401
    data = response.json()
    assert data["error_code"] == "AUTH_FAILED"
    assert "request_id" in data
