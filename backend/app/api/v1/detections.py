from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.detection_rule import (
    DetectionRuleCreate,
    DetectionRuleRead,
    RuleTestRequest,
)
from app.services.audit_service import AuditService
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detection Rules"])

@router.get("/rules", response_model=List[DetectionRuleRead])
async def list_detection_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rules = await DetectionService.get_all_rules(db)
    return [DetectionRuleRead.model_validate(r) for r in rules]

@router.get("/rules/{rule_id}", response_model=DetectionRuleRead)
async def get_detection_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = await DetectionService.get_rule_by_id(db, rule_id)
    return DetectionRuleRead.model_validate(rule)

@router.post("/rules", response_model=DetectionRuleRead, status_code=status.HTTP_201_CREATED)
async def create_detection_rule(
    rule_in: DetectionRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst"]))
):
    rule = await DetectionService.create_rule(db, rule_in)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_DETECTION_RULE",
        resource_type="rule",
        resource_id=rule.rule_id,
        details={"name": rule.name, "severity": rule.severity}
    )
    return DetectionRuleRead.model_validate(rule)

@router.patch("/rules/{rule_id}/toggle", response_model=DetectionRuleRead)
async def toggle_detection_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "senior_analyst"]))
):
    rule = await DetectionService.toggle_rule(db, rule_id)
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="TOGGLE_DETECTION_RULE",
        resource_type="rule",
        resource_id=rule.rule_id,
        details={"enabled": rule.enabled}
    )
    return DetectionRuleRead.model_validate(rule)

@router.post("/test", response_model=Dict[str, Any])
async def test_detection_rule(
    req: RuleTestRequest,
    current_user: User = Depends(require_roles(["admin", "senior_analyst", "soc_analyst"]))
):
    return DetectionService.test_rule(req)
