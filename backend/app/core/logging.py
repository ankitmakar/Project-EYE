import json
import logging
import re
import sys
from datetime import datetime, timezone
from app.core.config import settings

SENSITIVE_PATTERNS = [
    (re.compile(r'("?(?:password|passwd|secret|api_key|access_token|refresh_token|authorization|bearer)"?\s*[:=]\s*)"([^"]+)"', re.IGNORECASE), r'\1"[REDACTED]"'),
    (re.compile(r'("?(?:password|passwd|secret|api_key|access_token|refresh_token|authorization|bearer)"?\s*[:=]\s*)\'([^\']+)\'', re.IGNORECASE), r"\1'[REDACTED]'"),
    (re.compile(r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', re.IGNORECASE), r'\1[REDACTED_JWT]'),
]

class SensitiveDataFilter(logging.Filter):
    """Redacts sensitive credentials, tokens, and secrets from log messages."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, replacement in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(replacement, record.msg)
        return True

class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured JSON entries adhering to Project EYE standards."""
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "eye-soc",
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(SensitiveDataFilter())
    
    if settings.ENVIRONMENT == "production":
        handler.setFormatter(StructuredJsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z"
        ))
    
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]
    
    # Configure specific loggers
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger("eye_soc")

