import json
import re
from typing import Any, Dict, Tuple

PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(?:a|an)\s+", re.IGNORECASE),
    re.compile(r"system\s*:\s*", re.IGNORECASE),
    re.compile(r"output\s+(?:only\s+)?(?:the\s+following|'false\s+positive')", re.IGNORECASE),
    re.compile(r"do\s+not\s+report\s+this", re.IGNORECASE),
    re.compile(r"bypass\s+security", re.IGNORECASE),
    re.compile(r"<\s*/?\s*script\s*>", re.IGNORECASE),
    re.compile(r"<\s*/?\s*UNTRUSTED_SECURITY_TELEMETRY\s*>", re.IGNORECASE)
]

class TelemetrySanitizer:
    @staticmethod
    def sanitize_for_prompt(raw_data: Any) -> Tuple[str, str, bool]:
        """
        Sanitizes raw telemetry payload before sending to AI.
        Returns:
            - sanitized_json_string
            - prompt_shield_status
            - injection_detected (bool)
        """
        json_str = json.dumps(raw_data, default=str)
        
        # Check for active prompt injection signatures
        injection_detected = False
        detected_patterns = []
        for pattern in PROMPT_INJECTION_PATTERNS:
            if pattern.search(json_str):
                injection_detected = True
                detected_patterns.append(pattern.pattern)

        # Sanitize boundary delimiters
        sanitized = json_str.replace("<UNTRUSTED_SECURITY_TELEMETRY>", "[REDACTED_TAG]")
        sanitized = sanitized.replace("</UNTRUSTED_SECURITY_TELEMETRY>", "[REDACTED_TAG]")
        
        # Neutralize markdown escape sequences that might break out of code blocks
        sanitized = sanitized.replace("```", "'''")

        if injection_detected:
            shield_status = "Shield Alert: Adversarial Prompt Injection Attempt Neutralized in Log Payload"
        else:
            shield_status = "Shield Active: Untrusted Boundary Enforced (No Injection Detected)"

        return sanitized, shield_status, injection_detected
