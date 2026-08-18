import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Regex Patterns for Common Log Formats

# Linux SSHD Failed Password: "Failed password for [invalid user] root from 192.168.1.100 port 52312 ssh2"
SSH_FAILED_PATTERN = re.compile(
    r"Failed password for (?:invalid user )?(?P<username>\S+) from (?P<source_ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) port (?P<port>\d+)"
)
# Linux SSHD Accepted: "Accepted publickey for ubuntu from 192.168.1.50 port 43211 ssh2"
SSH_ACCEPTED_PATTERN = re.compile(
    r"Accepted (?P<auth_method>\S+) for (?P<username>\S+) from (?P<source_ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) port (?P<port>\d+)"
)
# Linux Sudo: "user1 : TTY=pts/0 ; PWD=/home/user1 ; USER=root ; COMMAND=/bin/bash"
SUDO_PATTERN = re.compile(
    r"(?P<username>\S+)\s*:\s*TTY=\S+\s*;\s*PWD=\S+\s*;\s*USER=(?P<target_user>\S+)\s*;\s*COMMAND=(?P<command>.+)"
)
# Syslog RFC 3164: "Aug 18 20:45:10 my-server sshd[1234]: Failed password..."
SYSLOG_RFC3164_PATTERN = re.compile(
    r"^(?P<timestamp>[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(?P<host>[^\s:]+)\s+(?P<program>[^:\[]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.*)$"
)
# Nginx / Apache Combined: '192.168.1.10 - - [18/Aug/2026:20:45:10 +0000] "GET /api/v1/users HTTP/1.1" 200 452 "-" "Mozilla/5.0"'
WEB_ACCESS_PATTERN = re.compile(
    r'^(?P<source_ip>\S+)\s+\S+\s+(?P<username>\S+)\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<method>\S+)\s+(?P<url>\S+)\s+(?P<protocol>[^"]+)"\s+(?P<status_code>\d{3})\s+(?P<bytes_sent>\S+)\s+"(?P<referer>[^"]*)"\s+"(?P<user_agent>[^"]*)"'
)
# Generic IPv4 extraction fallback
IPV4_FALLBACK = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

class LogParser:
    @staticmethod
    def parse(source: str, raw_log: str, host_hint: Optional[str] = None) -> Dict[str, Any]:
        raw_log = raw_log.strip()
        parsed: Dict[str, Any] = {
            "source": source,
            "host": host_hint or "unknown-host",
            "timestamp": datetime.now(timezone.utc),
            "source_ip": None,
            "destination_ip": None,
            "username": None,
            "event_type": "generic_log",
            "severity": "info",
            "message": raw_log,
            "metadata": {}
        }

        # 1. Try parsing JSON directly
        if (raw_log.startswith("{") and raw_log.endswith("}")) or source in ["json", "application", "cloud"]:
            try:
                data = json.loads(raw_log)
                if isinstance(data, dict):
                    parsed["metadata"].update(data)
                    parsed["host"] = data.get("host") or data.get("hostname") or parsed["host"]
                    parsed["source_ip"] = data.get("source_ip") or data.get("src_ip") or data.get("client_ip")
                    parsed["destination_ip"] = data.get("destination_ip") or data.get("dst_ip")
                    parsed["username"] = data.get("username") or data.get("user") or data.get("user_name")
                    parsed["event_type"] = data.get("event_type") or data.get("type") or "json_event"
                    parsed["severity"] = data.get("severity") or "info"
                    parsed["message"] = data.get("message") or data.get("msg") or raw_log
                    return parsed
            except Exception:
                pass

        # 2. Syslog Envelope extraction
        syslog_match = SYSLOG_RFC3164_PATTERN.match(raw_log)
        inner_message = raw_log
        if syslog_match:
            groups = syslog_match.groupdict()
            parsed["host"] = groups.get("host") or parsed["host"]
            parsed["metadata"]["program"] = groups.get("program")
            parsed["metadata"]["pid"] = groups.get("pid")
            inner_message = groups.get("message") or raw_log

        # 3. Check for Sudo patterns
        sudo_match = SUDO_PATTERN.search(inner_message)
        if sudo_match:
            g = sudo_match.groupdict()
            parsed["username"] = g.get("username")
            parsed["event_type"] = "privilege_escalation"
            parsed["severity"] = "medium" if g.get("target_user") == "root" else "low"
            parsed["message"] = f"User '{parsed['username']}' executed sudo as '{g.get('target_user')}': {g.get('command')}"
            parsed["metadata"]["command"] = g.get("command")
            parsed["metadata"]["target_user"] = g.get("target_user")
            return parsed

        # 4. SSHD Authentication
        if "sshd" in raw_log or source in ["linux-auth", "syslog"]:
            ssh_failed = SSH_FAILED_PATTERN.search(inner_message)
            if ssh_failed:
                g = ssh_failed.groupdict()
                parsed["username"] = g.get("username")
                parsed["source_ip"] = g.get("source_ip")
                parsed["event_type"] = "auth_failure"
                parsed["severity"] = "medium"
                parsed["message"] = f"SSH authentication failure for user '{parsed['username']}' from {parsed['source_ip']}"
                parsed["metadata"]["auth_type"] = "ssh"
                parsed["metadata"]["port"] = g.get("port")
                return parsed

            ssh_accepted = SSH_ACCEPTED_PATTERN.search(inner_message)
            if ssh_accepted:
                g = ssh_accepted.groupdict()
                parsed["username"] = g.get("username")
                parsed["source_ip"] = g.get("source_ip")
                parsed["event_type"] = "auth_success"
                parsed["severity"] = "info"
                parsed["message"] = f"SSH authentication successful for user '{parsed['username']}' from {parsed['source_ip']}"
                parsed["metadata"]["auth_type"] = "ssh"
                return parsed

        if source in ["nginx", "apache", "web"] or "HTTP/1." in raw_log:
            web_match = WEB_ACCESS_PATTERN.match(raw_log)
            if web_match:
                g = web_match.groupdict()
                parsed["source_ip"] = g.get("source_ip")
                parsed["username"] = g.get("username") if g.get("username") != "-" else None
                status = int(g.get("status_code", 200))
                url = g.get("url", "")
                
                # Check for suspicious web requests
                is_attack = False
                attack_type = "web_access"
                if any(sqli in url.lower() for sqli in ["union+select", "' or '1'='1", "select%20", "benchmark(", "sleep(", "union%20select", "version()"]):
                    is_attack = True
                    attack_type = "sql_injection_attempt"
                    parsed["severity"] = "high"
                elif any(xss in url.lower() for xss in ["<script>", "alert(", "javascript:", "%3cscript%3e"]):
                    is_attack = True
                    attack_type = "xss_attempt"
                    parsed["severity"] = "medium"
                elif ".." in url or "/etc/passwd" in url or "windows/win.ini" in url:
                    is_attack = True
                    attack_type = "path_traversal_attempt"
                    parsed["severity"] = "high"

                parsed["event_type"] = attack_type if is_attack else ("web_error" if status >= 400 else "web_access")
                parsed["message"] = f"{g.get('method')} {url} returned {status} from {parsed['source_ip']}"
                parsed["metadata"].update({
                    "method": g.get("method"),
                    "url": url,
                    "status_code": status,
                    "user_agent": g.get("user_agent")
                })
                return parsed

        # Windows Event parsing if containing EventID
        if "EventID:" in raw_log or "Event ID:" in raw_log or "4625" in raw_log or "4624" in raw_log:
            if "4625" in raw_log:
                parsed["event_type"] = "windows_logon_failure"
                parsed["severity"] = "medium"
            elif "4624" in raw_log:
                parsed["event_type"] = "windows_logon_success"
                parsed["severity"] = "info"
            elif "4720" in raw_log:
                parsed["event_type"] = "windows_user_created"
                parsed["severity"] = "medium"

        # Fallback IP extraction
        if not parsed["source_ip"]:
            ip_found = IPV4_FALLBACK.search(raw_log)
            if ip_found:
                parsed["source_ip"] = ip_found.group(0)

        return parsed
