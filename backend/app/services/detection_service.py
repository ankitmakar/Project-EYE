from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ResourceNotFoundException
from app.detection.engine import detection_engine
from app.detection.rule_loader import RuleDefinition, RuleLoader
from app.ingestion.collector import IngestionPipeline
from app.models.detection_rule import DetectionRule
from app.schemas.detection_rule import DetectionRuleCreate, DetectionRuleUpdate, RuleTestRequest

class DetectionService:
    @staticmethod
    async def get_all_rules(db: AsyncSession) -> List[DetectionRule]:
        # Sync DB rules with YAML rules if DB is empty
        res = await db.execute(select(DetectionRule))
        db_rules = list(res.scalars().all())

        if not db_rules:
            # Sync from loaded YAML definitions
            yaml_rules = RuleLoader.get_all_rules()
            for yr in yaml_rules:
                db_rule = DetectionRule(
                    rule_id=yr.rule_id,
                    name=yr.name,
                    description=yr.description,
                    severity=yr.severity,
                    confidence=yr.confidence,
                    enabled=yr.enabled,
                    version=yr.version,
                    category=yr.category,
                    mitre_tactic=yr.mitre_tactic,
                    mitre_technique=yr.mitre_technique,
                    yaml_content=yr.yaml_content
                )
                db.add(db_rule)
            await db.commit()
            res = await db.execute(select(DetectionRule))
            db_rules = list(res.scalars().all())

        return db_rules

    @staticmethod
    async def get_rule_by_id(db: AsyncSession, rule_id: str) -> DetectionRule:
        res = await db.execute(
            select(DetectionRule).where((DetectionRule.id == rule_id) | (DetectionRule.rule_id == rule_id))
        )
        rule = res.scalar_one_or_none()
        if not rule:
            raise ResourceNotFoundException("DetectionRule", rule_id)
        return rule

    @staticmethod
    async def create_rule(db: AsyncSession, rule_in: DetectionRuleCreate) -> DetectionRule:
        rule = DetectionRule(
            rule_id=rule_in.rule_id,
            name=rule_in.name,
            description=rule_in.description,
            severity=rule_in.severity,
            confidence=rule_in.confidence,
            enabled=rule_in.enabled,
            version=rule_in.version,
            category=rule_in.category,
            mitre_tactic=rule_in.mitre_tactic,
            mitre_technique=rule_in.mitre_technique,
            yaml_content=rule_in.yaml_content
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        
        # Register into in-memory loader
        parsed_def = RuleLoader.parse_rule_yaml(rule_in.yaml_content)
        RuleLoader._rules[parsed_def.rule_id] = parsed_def
        return rule

    @staticmethod
    async def toggle_rule(db: AsyncSession, rule_id: str) -> DetectionRule:
        rule = await DetectionService.get_rule_by_id(db, rule_id)
        rule.enabled = not rule.enabled
        await db.commit()
        await db.refresh(rule)

        # Update in-memory rule
        in_mem = RuleLoader.get_rule(rule.rule_id)
        if in_mem:
            in_mem.enabled = rule.enabled

        return rule

    @staticmethod
    def test_rule(req: RuleTestRequest) -> Dict[str, Any]:
        rule_def = RuleLoader.parse_rule_yaml(req.yaml_content)
        matches = []

        for sample_log in req.sample_logs:
            try:
                norm_evt = IngestionPipeline.process_raw_log("custom", sample_log)
                alerts = detection_engine.evaluate_event(norm_evt, active_rules=[rule_def])
                if alerts:
                    matches.append({
                        "sample": sample_log,
                        "triggered": True,
                        "alert": alerts[0].model_dump()
                    })
                else:
                    matches.append({"sample": sample_log, "triggered": False})
            except Exception as e:
                matches.append({"sample": sample_log, "error": str(e)})

        return {
            "rule_id": rule_def.rule_id,
            "rule_name": rule_def.name,
            "total_tested": len(req.sample_logs),
            "total_matched": sum(1 for m in matches if m.get("triggered")),
            "results": matches
        }
