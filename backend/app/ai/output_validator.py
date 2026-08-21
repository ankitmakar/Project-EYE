import json
from typing import Any, Dict, List
from app.core.exceptions import ValidationException

REQUIRED_AI_FIELDS = ["summary", "observed_evidence", "ai_inferences", "root_cause", "mitre_mapping", "threat_hypothesis", "recommended_actions", "confidence"]

class AIOutputValidator:
    @staticmethod
    def validate_and_clean(raw_output: str) -> Dict[str, Any]:
        """
        Extracts and validates JSON output from LLM response.
        Ensures all expected fields exist and prevents malformed outputs.
        """
        raw_output = raw_output.strip()
        
        # Strip markdown code fencing if present
        if raw_output.startswith("```"):
            lines = raw_output.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_output = "\n".join(lines).strip()

        try:
            parsed = json.loads(raw_output)
        except Exception as e:
            raise ValidationException(f"AI response was not valid JSON: {str(e)}")

        if not isinstance(parsed, dict):
            raise ValidationException("AI response root must be a JSON object.")

        # Check required fields
        for field in REQUIRED_AI_FIELDS:
            if field not in parsed:
                if field in ("mitre_mapping", "recommended_actions", "observed_evidence", "ai_inferences"):
                    parsed[field] = []
                elif field == "confidence":
                    parsed[field] = 0.80
                else:
                    parsed[field] = "N/A"

        # Type normalization
        if not isinstance(parsed["observed_evidence"], list):
            parsed["observed_evidence"] = [str(parsed["observed_evidence"])]
        if not isinstance(parsed["ai_inferences"], list):
            parsed["ai_inferences"] = [str(parsed["ai_inferences"])]
        if not isinstance(parsed["mitre_mapping"], list):
            parsed["mitre_mapping"] = [str(parsed["mitre_mapping"])]
        if not isinstance(parsed["recommended_actions"], list):
            parsed["recommended_actions"] = [str(parsed["recommended_actions"])]

        try:
            parsed["confidence"] = float(parsed["confidence"])
        except (ValueError, TypeError):
            parsed["confidence"] = 0.85

        return parsed
