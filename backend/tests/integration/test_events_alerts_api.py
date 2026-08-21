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
    alert_item = alerts_data["items"][0]
    alert_id = alert_item["alert_id"]
    assert any(a["rule_name"] == "SQL Injection (SQLi) Attempt" for a in alerts_data["items"])

    # 3. Test AI Alert Analysis (Rule 40 & 45)
    ai_resp = await client.post("/api/v1/ai/analyze-alert", headers=headers, json={
        "alert_id": alert_id
    })
    assert ai_resp.status_code == 200
    ai_analysis = ai_resp.json()
    assert "summary" in ai_analysis
    assert "observed_evidence" in ai_analysis
    assert "ai_inferences" in ai_analysis
    assert "root_cause" in ai_analysis
    assert "mitre_mapping" in ai_analysis
    assert "confidence" in ai_analysis

    # 4. Escalate Alert to Incident
    esc_resp = await client.post(f"/api/v1/alerts/{alert_id}/escalate", headers=headers, json={
        "title": "SQL Injection Incident Escalation",
        "severity": "high",
        "analyst_notes": "Triage verified malicious SQLi payload in web access logs."
    })
    assert esc_resp.status_code == 200
    inc_data = esc_resp.json()
    incident_id = inc_data["incident_id"]
    assert incident_id.startswith("INC-")

    # 5. Update Incident Status
    patch_resp = await client.patch(f"/api/v1/incidents/{incident_id}", headers=headers, json={
        "status": "investigating",
        "analyst_notes": "Added investigation notes."
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "investigating"

    # 6. Query SOC Summary Report
    rep_resp = await client.get("/api/v1/reports/summary", headers=headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert "executive_metrics" in rep_data
    assert rep_data["executive_metrics"]["total_alerts_generated"] >= 1
