import pytest
from app.core.exceptions import PermissionDeniedException
from app.core.security import UserRole
from app.models.user import User
from app.api.v1.deps import require_roles

def test_user_roles_enum():
    assert UserRole.ADMIN == "admin"
    assert UserRole.SENIOR_ANALYST == "senior_analyst"
    assert UserRole.SOC_ANALYST == "soc_analyst"
    assert UserRole.VIEWER == "viewer"
    assert UserRole.SERVICE_ACCOUNT == "service_account"

@pytest.mark.asyncio
async def test_require_roles_allows_matching_role():
    checker = require_roles(["admin", "senior_analyst"])
    admin_user = User(id="u1", username="admin_tester", role="admin", is_active=True)
    senior_user = User(id="u2", username="senior_tester", role="senior_analyst", is_active=True)
    
    res1 = await checker(admin_user)
    assert res1.username == "admin_tester"
    
    res2 = await checker(senior_user)
    assert res2.username == "senior_tester"

@pytest.mark.asyncio
async def test_require_roles_blocks_unauthorized_role():
    checker = require_roles(["admin", "senior_analyst"])
    viewer_user = User(id="u3", username="viewer_tester", role="viewer", is_active=True)
    analyst_user = User(id="u4", username="analyst_tester", role="soc_analyst", is_active=True)
    
    with pytest.raises(PermissionDeniedException) as exc_info:
        await checker(viewer_user)
    assert "not authorized" in str(exc_info.value.detail)

    with pytest.raises(PermissionDeniedException):
        await checker(analyst_user)
