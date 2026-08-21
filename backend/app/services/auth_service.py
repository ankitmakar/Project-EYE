from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import AuthenticationFailedException, PermissionDeniedException, ValidationException
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserRead

class AuthService:
    @staticmethod
    async def authenticate_user(db: AsyncSession, login_data: LoginRequest, client_ip: str = "unknown") -> Token:
        query = select(User).where(
            (User.email == login_data.username) | (User.username == login_data.username)
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(login_data.password, user.hashed_password):
            from app.services.audit_service import AuditService
            await AuditService.log_action(
                db=db,
                user_id="unknown",
                username=login_data.username,
                ip_address=client_ip,
                action="USER_LOGIN_FAILED",
                resource_type="auth",
                resource_id="auth",
                status="denied",
                details={"reason": "Invalid credentials", "attempted_identifier": login_data.username}
            )
            raise AuthenticationFailedException("Invalid email/username or password.")

        if not user.is_active:
            from app.services.audit_service import AuditService
            await AuditService.log_action(
                db=db,
                user_id=user.id,
                username=user.username,
                ip_address=client_ip,
                action="USER_LOGIN_FAILED",
                resource_type="auth",
                resource_id=user.id,
                status="denied",
                details={"reason": "Account inactive"}
            )
            raise PermissionDeniedException("User account is inactive. Please contact administrator.")

        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=refresh_token,
            user=UserRead.model_validate(user)
        )

    @staticmethod
    async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
        # Check existing
        existing = await db.execute(
            select(User).where((User.email == user_in.email) | (User.username == user_in.username))
        )
        if existing.scalar_one_or_none():
            raise ValidationException("User with this email or username already exists.")

        user = User(
            email=user_in.email,
            username=user_in.username,
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=user_in.is_active,
            hashed_password=get_password_hash(user_in.password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
