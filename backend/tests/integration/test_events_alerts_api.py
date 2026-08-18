import pytest
from app.core.security import create_access_token, get_password_hash
from app.models.user import User

@pytest.mark.asyncio
async def test_event_ingestion_and_alert_generation(client, test_db):
    user = User(
        email="analyst@eye.security",
        username="analyst",
        full_name="Analyst",
        role="soc_analyst",
        is_active=True,
        hashed_password=get_password_hash("pass")
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest SQL Injection event
    ingest_resp = await client.post("/api/v1/events/ingest", json={
        "source": "nginx",
        "raw_log": '10.0.0.99 - - [18/Aug/2026:20:45:10 +0000] "GET /api?id=1\'%20UNION%20SELECT%201,2-- HTTP/1.1" 403 100 "-" "Mozilla/5.0"',
        "host": "web-prod-01"
    })
    assert ingest_resp.status_code == 201
    res_data = ingest_resp.json()
    assert res_data["status"] == "success"
    assert res_data["alerts_generated"] >= 1

    # 2. Query alerts
    alerts_resp = await client.get("/api/v1/alerts", headers=headers)
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    assert alerts_data["total"] >= 1
    assert any(a["rule_name"] == "SQL Injection (SQLi) Attempt" for a in alerts_data["items"])
