import logging
import pytest
from app.core.logging import SensitiveDataFilter

def test_log_redaction_masks_passwords():
    flt = SensitiveDataFilter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="test.py", lineno=1,
        msg='User login attempt: {"username": "admin", "password": "SecretPassword123!"}',
        args=(), exc_info=None
    )
    flt.filter(record)
    assert "SecretPassword123!" not in record.msg
    assert "[REDACTED]" in record.msg

def test_log_redaction_masks_api_keys_and_tokens():
    flt = SensitiveDataFilter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="test.py", lineno=1,
        msg='External request with api_key="secret-production-token-9988" and auth Bearer eyJhbGciOiJIUzI1NiJ9.test',
        args=(), exc_info=None
    )
    flt.filter(record)
    assert "secret-production-token-9988" not in record.msg
    assert "[REDACTED]" in record.msg
