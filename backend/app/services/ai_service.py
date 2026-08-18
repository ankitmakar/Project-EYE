from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.client import ai_investigation_client
from app.models.alert import Alert
from app.models.incident import Incident
from app.schemas.ai import AIAnalysisResponse, AIAnalyzeAlertRequest, AIInvestigateIncidentRequest
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService
from app.services.incident_service import IncidentService

class AIService:
    @staticmethod
    async def analyze_alert(db: AsyncSession, username: str, user_id: str, req: AIAnalyzeAlertRequest) -> AIAnalysisResponse:
        alert = await AlertService.get_alert_by_id(db, req.alert_id)
        
        alert_dict = {
            "alert_id": alert.alert_id,
            "rule_name": alert.rule_name,
            "severity": alert.severity,
            "host": alert.host,
            "source_ip": alert.source_ip,
            "username": alert.username,
            "evidence": alert.evidence
        }

        analysis = await ai_investigation_client.analyze_alert(alert_dict, req.context_notes)

        # Audit AI Investigation trigger
        await AuditService.log_action(
            db=db,
            user_id=user_id,
            username=username,
            action="AI_INVESTIGATE_ALERT",
            resource_type="alert",
            resource_id=alert.alert_id,
            details={"provider": analysis.provider_used, "confidence": analysis.confidence}
        )

        return analysis

    @staticmethod
    async def investigate_incident(db: AsyncSession, username: str, user_id: str, req: AIInvestigateIncidentRequest) -> AIAnalysisResponse:
        incident = await IncidentService.get_incident_by_id(db, req.incident_id)

        incident_dict = {
            "incident_id": incident.incident_id,
            "title": incident.title,
            "severity": incident.severity,
            "alerts": [
                {
                    "alert_id": a.alert_id,
                    "rule_name": a.rule_name,
                    "severity": a.severity,
                    "host": a.host,
                    "source_ip": a.source_ip,
                    "evidence": a.evidence
                }
                for a in incident.alerts
            ]
        }

        # Build context prompt
        analysis = await ai_investigation_client.analyze_alert(
            {
                "alert_id": incident.incident_id,
                "rule_name": f"Incident Campaign: {incident.title}",
                "severity": incident.severity,
                "host": incident.alerts[0].host if incident.alerts else "multi-host",
                "source_ip": incident.alerts[0].source_ip if incident.alerts else "multi-ip",
                "username": incident.alerts[0].username if incident.alerts else "multi-user",
                "evidence": incident_dict
            },
            context_notes=req.focus_area
        )

        # Update incident with AI findings
        incident.ai_analysis = analysis.model_dump()
        incident.root_cause = analysis.root_cause
        incident.mitigation_steps = analysis.recommended_actions
        await db.commit()

        await AuditService.log_action(
            db=db,
            user_id=user_id,
            username=username,
            action="AI_INVESTIGATE_INCIDENT",
            resource_type="incident",
            resource_id=incident.incident_id,
            details={"provider": analysis.provider_used, "confidence": analysis.confidence}
        )

        return analysis
