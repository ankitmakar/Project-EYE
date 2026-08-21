import pytest
from app.core.security import get_password_hash
from app.models.user import User

@pytest.mark.asyncio
async def test_auth_login_and_me(client, test_db):
    # Seed user in test db
    test_user = User(
        email="test_analyst@eye.security",
        username="analyst_test",
        full_name="Test Analyst",
        role="soc_analyst",
        is_active=True,
        hashed_password=get_password_hash("TestPassword123!")
    )
    test_db.add(test_user)
    await test_db.commit()

    # 1. Test Login
    login_resp = await client.post("/api/v1/auth/login", json={
        "username": "analyst_test",
        "password": "TestPassword123!"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 2. Test Get Me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "analyst_test"
    assert me_resp.json()["role"] == "soc_analyst"

    # 3. Test Failed Login & Audit Recording
    failed_resp = await client.post("/api/v1/auth/login", json={
        "username": "analyst_test",
        "password": "WrongPassword999!"
    })
    assert failed_resp.status_code == 401
    assert failed_resp.json()["error_code"] == "AUTH_FAILED"

    # 4. Test Logout
    logout_resp = await client.post("/api/v1/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["status"] == "logged_out"
