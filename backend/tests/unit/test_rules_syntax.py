from pathlib import Path
import pytest
from app.detection.rule_loader import RuleLoader

def test_all_yaml_detection_rules_valid():
    backend_rules = Path(__file__).parents[2] / "app" / "detection" / "rules"
    root_rules = Path(__file__).parents[3] / "detection-rules"
    
    rules1 = RuleLoader.load_rules_from_dir(str(backend_rules))
    assert len(rules1) >= 6, "Expected at least 6 built-in rules in backend/app/detection/rules"
    
    for r in rules1:
        assert r.rule_id, f"Rule missing id: {r.name}"
        assert r.name, "Rule missing name"
        assert r.severity in ["info", "low", "medium", "high", "critical"], f"Invalid severity: {r.severity}"
        assert isinstance(r.confidence, float)
        assert r.condition, f"Rule missing condition: {r.name}"

    if root_rules.exists():
        rules2 = RuleLoader.load_rules_from_dir(str(root_rules))
        assert len(rules2) >= 4, "Expected rules in detection-rules folder"
        for r in rules2:
            assert r.rule_id
            assert r.name
            assert r.severity in ["info", "low", "medium", "high", "critical"]
