from typing import Any, Dict, List

FORBIDDEN_ACTION_KEYWORDS = [
    "format c:", "rm -rf", "drop table", "shutdown -h", "reboot",
    "del /f /s /q", "kill -9 1", "curl http", "wget http", "nc -e"
]

class AISafetyGuard:
    @staticmethod
    def inspect_and_filter(analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enforces strict safety guardrails on AI recommended actions.
        Replaces any potentially harmful or unvetted command recommendations.
        """
        cleaned_actions: List[str] = []
        for action in analysis_result.get("recommended_actions", []):
            action_str = str(action)
            is_safe = True
            for forbidden in FORBIDDEN_ACTION_KEYWORDS:
                if forbidden in action_str.lower():
                    is_safe = False
                    cleaned_actions.append("[REDACTED DANGEROUS COMMAND: Action was flagged by EYE AI Safety Guardrail]")
                    break
            if is_safe:
                cleaned_actions.append(action_str)

        analysis_result["recommended_actions"] = cleaned_actions
        return analysis_result
