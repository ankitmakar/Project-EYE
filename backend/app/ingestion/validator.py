import re
from typing import Optional
from app.core.exceptions import ValidationException

MAX_RAW_LOG_LENGTH = 32768  # 32KB max single log length
VALID_SOURCES = {"linux-auth", "syslog", "windows", "nginx", "apache", "network", "cloud", "application", "custom"}

def validate_raw_log_payload(source: str, raw_log: str, host: Optional[str] = None) -> None:
    if not source or not isinstance(source, str):
        raise ValidationException("Log 'source' is required and must be a string.")
        
    normalized_source = source.strip().lower()
    if normalized_source not in VALID_SOURCES and not normalized_source.startswith("custom-"):
        # Allow generic custom sources with valid alphanumeric naming
        if not re.match(r"^[a-zA-Z0-9_\-\.]{2,50}$", normalized_source):
            raise ValidationException(f"Invalid log source name: '{source}'. Must be alphanumeric.")

    if not raw_log or not isinstance(raw_log, str):
        raise ValidationException("Log 'raw_log' is required and cannot be empty.")

    if len(raw_log) > MAX_RAW_LOG_LENGTH:
        raise ValidationException(f"Log payload exceeds maximum allowed size of {MAX_RAW_LOG_LENGTH} bytes.")

    # Hostname validation if provided
    if host and len(host) > 255:
        raise ValidationException("Host string exceeds maximum length of 255 characters.")
