from typing import Callable, List
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AuthenticationFailedException, PermissionDeniedException
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not auth or not auth.credentials:
        raise AuthenticationFailedException("Bearer token required.")

    payload = decode_token(auth.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationFailedException("Invalid or expired authentication token.")

    query = select(User).where(User.id == user_id)
    res = await db.execute(query)
    user = res.scalar_one_or_none()

    if not user:
        raise AuthenticationFailedException("User not found.")
    if not user.is_active:
        raise PermissionDeniedException("User account is inactive.")

    return user

def require_roles(allowed_roles: List[str]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedException(
                f"Role '{current_user.role}' is not authorized. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
