from fastapi import APIRouter
from app.api.v1.ai import router as ai_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.auth import router as auth_router
from app.api.v1.detections import router as detections_router
from app.api.v1.events import router as events_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.reports import router as reports_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(events_router)
api_router.include_router(alerts_router)
api_router.include_router(incidents_router)
api_router.include_router(detections_router)
api_router.include_router(ai_router)
api_router.include_router(reports_router)
api_router.include_router(audit_logs_router)
