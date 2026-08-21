from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    result = await db.execute(select(User))
    return list(result.scalars().all())

@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    user = await AuthService.create_user(db, user_in)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="USER_CREATED",
        resource_type="user",
        resource_id=user.id,
        details={"created_username": user.username, "role": user.role}
    )
    return user
