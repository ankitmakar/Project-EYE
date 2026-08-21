import json
import time
from typing import Any, Dict, List, Optional
import httpx
from app.ai.output_validator import AIOutputValidator
from app.ai.prompts import (
    ALERT_ANALYSIS_PROMPT_TEMPLATE,
    INCIDENT_ANALYSIS_PROMPT_TEMPLATE,
    SYSTEM_SOC_INVESTIGATOR_PROMPT,
)
from app.ai.safety import AISafetyGuard
from app.ai.sanitizer import TelemetrySanitizer
from app.core.config import settings
from app.core.logging import logger
from app.schemas.ai import AIAnalysisResponse

class AIInvestigationClient:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    async def analyze_alert(self, alert_data: Dict[str, Any], context_notes: Optional[str] = None) -> AIAnalysisResponse:
        start_time = time.time()
        
        # 1. Sanitize & Shield
        sanitized_evidence, shield_status, injection_detected = TelemetrySanitizer.sanitize_for_prompt(alert_data.get("evidence", {}))
        
        # 2. Build Prompt
        prompt = ALERT_ANALYSIS_PROMPT_TEMPLATE.format(
            alert_id=alert_data.get("alert_id", "ALT-UNKNOWN"),
            rule_name=alert_data.get("rule_name", "Unknown Alert"),
            severity=alert_data.get("severity", "medium"),
            host=alert_data.get("host", "unknown-host"),
            source_ip=alert_data.get("source_ip", "N/A"),
            username=alert_data.get("username", "N/A"),
            sanitized_evidence=sanitized_evidence
        )

        if context_notes:
            prompt += f"\nAdditional Analyst Notes: {context_notes}\n"

        # 3. Execute LLM Call or Local SOC Fallback
        provider_used = self.provider
        try:
            if self.provider == "gemini" and self.gemini_key:
                raw_json = await self._call_gemini(prompt)
            elif self.provider == "openai" and self.openai_key:
                raw_json = await self._call_openai(prompt)
            else:
                provider_used = "builtin_soc_expert"
                raw_json = self._run_builtin_soc_analyzer(alert_data, injection_detected)
        except Exception as e:
            logger.warning(f"AI Provider '{self.provider}' failed ({e}), falling back to Built-in SOC Heuristic Engine.")
            provider_used = "builtin_soc_expert (failover)"
            raw_json = self._run_builtin_soc_analyzer(alert_data, injection_detected)

        # 4. Validate output schema & enforce safety guardrails
        validated_dict = AIOutputValidator.validate_and_clean(raw_json)
        safe_dict = AISafetyGuard.inspect_and_filter(validated_dict)
        
        exec_time = int((time.time() - start_time) * 1000)

        return AIAnalysisResponse(
            summary=safe_dict["summary"],
            observed_evidence=safe_dict.get("observed_evidence", []),
            ai_inferences=safe_dict.get("ai_inferences", []),
            root_cause=safe_dict["root_cause"],
            mitre_mapping=safe_dict["mitre_mapping"],
            threat_hypothesis=safe_dict["threat_hypothesis"],
            recommended_actions=safe_dict["recommended_actions"],
            confidence=safe_dict["confidence"],
            prompt_shield_status=shield_status,
            execution_time_ms=exec_time,
            provider_used=provider_used
        )

    async def _call_gemini(self, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{SYSTEM_SOC_INVESTIGATOR_PROMPT}\n\n{prompt}"}]}
            ],
            "generationConfig": {
                "temperature": settings.AI_TEMPERATURE,
                "responseMimeType": "application/json"
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _call_openai(self, prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_SOC_INVESTIGATOR_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": settings.AI_TEMPERATURE
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _run_builtin_soc_analyzer(self, alert_data: Dict[str, Any], injection_detected: bool) -> str:
        """
        Intelligent Built-in SOC Heuristic Engine.
        Produces expert cyber-forensic analysis when offline or when external AI is not configured.
        """
        rule_name = alert_data.get("rule_name", "").lower()
        host = alert_data.get("host", "unknown-host")
        source_ip = alert_data.get("source_ip", "unknown IP")
        username = alert_data.get("username", "unspecified user")
        severity = alert_data.get("severity", "medium").lower()

        if "brute force" in rule_name or "auth" in rule_name:
            res = {
                "summary": f"Detected high-frequency authentication attack against host '{host}' targeting account '{username}' from source IP {source_ip}.",
                "observed_evidence": [
                    f"Target Host: {host}",
                    f"Target User Account: {username}",
                    f"Source IP Address: {source_ip}",
                    f"Authentication failure events in short time frame"
                ],
                "ai_inferences": [
                    "Adversary is attempting automated dictionary/brute-force password guessing",
                    "Risk of account takeover if credential reuse is present"
                ],
                "root_cause": "Adversary automated dictionary or credential stuffing attack attempting to establish initial access via SSH/Auth gateway.",
                "mitre_mapping": ["TA0001 - Initial Access", "T1110.001 - Password Guessing", "T1078 - Valid Accounts"],
                "threat_hypothesis": "External threat actor conducting automated credential discovery to gain an interactive shell and pivot internally.",
                "recommended_actions": [
                    f"Implement edge firewall rate-limiting or null-route IP {source_ip}",
                    f"Audit authentication logs on '{host}' to ensure no subsequent login attempts succeeded",
                    f"Verify account '{username}' has MFA enforced and password authentication disabled in sshd_config",
                    "Rotate SSH authorized_keys if credential exposure is suspected"
                ],
                "confidence": 0.94
            }
        elif "privilege" in rule_name or "sudo" in rule_name:
            res = {
                "summary": f"Unauthorized privilege escalation attempt detected on host '{host}'. User '{username}' attempted execution with elevated root privileges.",
                "observed_evidence": [
                    f"Target Host: {host}",
                    f"User: {username}",
                    "Sudo command execution or setuid binary invocation logged"
                ],
                "ai_inferences": [
                    "User account or process is attempting privilege boundary breakout",
                    "Potential local privilege escalation (LPE) exploit"
                ],
                "root_cause": "User or compromised process invoked sudo / setuid binaries to bypass permission boundaries.",
                "mitre_mapping": ["TA0004 - Privilege Escalation", "T1548.003 - Sudo and Sudo Caching", "TA0005 - Defense Evasion"],
                "threat_hypothesis": "Compromised unprivileged account attempting local privilege escalation to achieve persistent root control.",
                "recommended_actions": [
                    f"Review `/etc/sudoers` and `/etc/sudoers.d/` permissions for user '{username}' on host '{host}'",
                    f"Inspect active bash history and `/var/log/audit/audit.log` for commands run as root",
                    "Temporarily lock the affected user account pending investigation"
                ],
                "confidence": 0.92
            }
        elif "process" in rule_name or "shell" in rule_name:
            res = {
                "summary": f"Critical suspicious process or reverse shell execution detected on host '{host}'.",
                "observed_evidence": [
                    f"Host: {host}",
                    "Spawning of interactive shell or network-connected interpreter process"
                ],
                "ai_inferences": [
                    "Active command & control (C2) channel established",
                    "Host integrity compromised"
                ],
                "root_cause": "Execution of an interactive reverse shell, unauthorized script interpreter, or obfuscated downloader command.",
                "mitre_mapping": ["TA0002 - Execution", "T1059.004 - Unix Shell", "TA0011 - Command and Control", "T1071 - Application Layer Protocol"],
                "threat_hypothesis": "Active interactive shell session established with adversary Command & Control (C2) server.",
                "recommended_actions": [
                    f"ISOLATE HOST '{host}' from network immediately (quarantine VLAN or host firewall drop)",
                    "Identify parent process ID (PPID) and kill the spawned process tree",
                    "Capture memory dump (`dd /dev/mem` or LiME) for forensic artifact preservation",
                    "Inspect crontab and systemd service units for persistence mechanisms"
                ],
                "confidence": 0.96
            }
        elif "sql" in rule_name or "web" in rule_name:
            res = {
                "summary": f"Web application exploit attempt (SQL Injection / Path Traversal) directed at host '{host}' from {source_ip}.",
                "observed_evidence": [
                    f"Host: {host}",
                    f"Source IP: {source_ip}",
                    "HTTP payload contained SQL syntax / directory traversal signatures"
                ],
                "ai_inferences": [
                    "Adversary is attempting web application tier exploitation",
                    "Risk of unauthorized database data extraction"
                ],
                "root_cause": "Malicious HTTP request containing injected SQL keywords or directory traversal payload designed to extract database content.",
                "mitre_mapping": ["TA0001 - Initial Access", "T1190 - Exploit Public-Facing Application", "TA0006 - Credential Access"],
                "threat_hypothesis": "Automated or targeted reconnaissance probing web application tier for input sanitization vulnerabilities.",
                "recommended_actions": [
                    f"Verify WAF rule status blocking source IP {source_ip}",
                    "Inspect web server response codes: verify whether endpoint returned 403/500 vs 200 with data",
                    "Audit backend database query handlers for parameterized statements and ORM usage"
                ],
                "confidence": 0.91
            }
        else:
            res = {
                "summary": f"Security anomaly detected on host '{host}' under detection rule '{alert_data.get('rule_name', 'Generic Alert')}'.",
                "observed_evidence": [
                    f"Host: {host}",
                    f"Source IP: {source_ip}",
                    f"Rule: {alert_data.get('rule_name', 'Generic Alert')}"
                ],
                "ai_inferences": [
                    "Anomalous telemetry requiring analyst triage"
                ],
                "root_cause": "Observed telemetry deviated from established baseline or matched signature thresholds.",
                "mitre_mapping": ["TA0043 - Reconnaissance", "T1046 - Network Service Discovery"],
                "threat_hypothesis": "Potential reconnaissance or unauthorized system interaction requiring analyst review.",
                "recommended_actions": [
                    f"Inspect host '{host}' system metrics and recent security events",
                    f"Validate if source IP {source_ip} belongs to internal subnets or authorized VPN pool",
                    "Acknowledge alert and monitor for correlated follow-on events"
                ],
                "confidence": 0.85
            }

        if injection_detected:
            res["summary"] += " [NOTE: Adversarial prompt injection text was detected in the log and neutralized by EYE Prompt Shield.]"

        return json.dumps(res)

ai_investigation_client = AIInvestigationClient()
