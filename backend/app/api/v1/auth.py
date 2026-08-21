from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserRead
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(
    req: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    token = await AuthService.authenticate_user(db, req, client_ip=client_ip)
    
    await AuditService.log_action(
        db=db,
        user_id=token.user.id,
        username=token.user.username,
        ip_address=client_ip,
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=token.user.id,
        details={"role": token.user.role}
    )
    return token

@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        ip_address=client_ip,
        action="USER_LOGOUT",
        resource_type="auth",
        resource_id=current_user.id,
        details={}
    )
    return {"status": "logged_out", "message": "Successfully logged out."}
