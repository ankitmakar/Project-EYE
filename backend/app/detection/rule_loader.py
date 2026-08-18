import os
import yaml
from pathlib import Path
from typing import Any, Dict, List
from app.core.logging import logger

class RuleDefinition:
    def __init__(self, raw_dict: Dict[str, Any], file_path: str = ""):
        self.rule_id: str = raw_dict.get("id", "UNKNOWN-RULE")
        self.name: str = raw_dict.get("name", "Unnamed Rule")
        self.version: str = str(raw_dict.get("version", "1.0"))
        self.description: str = raw_dict.get("description", "")
        self.severity: str = raw_dict.get("severity", "medium").lower()
        self.confidence: float = float(raw_dict.get("confidence", 0.85))
        self.enabled: bool = bool(raw_dict.get("enabled", True))
        
        metadata = raw_dict.get("metadata", {})
        self.category: str = metadata.get("category", "general")
        mitre = metadata.get("mitre_attack", {})
        self.mitre_tactic: str = mitre.get("tactic", "")
        self.mitre_technique: str = mitre.get("technique", "")
        self.false_positives: List[str] = metadata.get("false_positives", [])
        
        self.detection: Dict[str, Any] = raw_dict.get("detection", {})
        self.condition: Dict[str, Any] = self.detection.get("condition", {})
        self.threshold: Dict[str, Any] = self.detection.get("threshold", {})
        self.response_recommendations: List[str] = raw_dict.get("response_recommendations", [])
        
        self.yaml_content: str = yaml.dump(raw_dict)
        self.file_path: str = file_path

class RuleLoader:
    _rules: Dict[str, RuleDefinition] = {}

    @classmethod
    def load_rules_from_dir(cls, directory_path: str) -> List[RuleDefinition]:
        path = Path(directory_path)
        if not path.exists():
            logger.warning(f"Detection rules directory not found: {directory_path}")
            return []

        loaded_rules = []
        for file_path in path.glob("**/*.yaml"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict) and "id" in data:
                        rule = RuleDefinition(data, str(file_path))
                        cls._rules[rule.rule_id] = rule
                        loaded_rules.append(rule)
            except Exception as e:
                logger.error(f"Failed to parse rule file {file_path}: {e}")

        logger.info(f"Loaded {len(loaded_rules)} detection rules from {directory_path}")
        return loaded_rules

    @classmethod
    def get_rule(cls, rule_id: str) -> RuleDefinition | None:
        return cls._rules.get(rule_id)

    @classmethod
    def get_all_rules(cls) -> List[RuleDefinition]:
        return list(cls._rules.values())

    @classmethod
    def parse_rule_yaml(cls, yaml_content: str) -> RuleDefinition:
        data = yaml.safe_load(yaml_content)
        if not isinstance(data, dict) or "id" not in data:
            raise ValueError("Invalid detection rule YAML. 'id' is required.")
        return RuleDefinition(data)
