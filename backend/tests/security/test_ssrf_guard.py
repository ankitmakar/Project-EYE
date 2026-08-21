import pytest
from app.core.security import SSRFGuard

def test_ssrf_guard_blocks_localhost():
    assert SSRFGuard.is_safe_url("http://localhost/admin") is False
    assert SSRFGuard.is_safe_url("http://127.0.0.1:8000/api") is False
    assert SSRFGuard.is_safe_url("http://0.0.0.0:80") is False

def test_ssrf_guard_blocks_private_subnets():
    # 10.0.0.0/8
    assert SSRFGuard.is_safe_url("http://10.1.2.3/internal") is False
    # 172.16.0.0/12
    assert SSRFGuard.is_safe_url("http://172.16.0.5:9000/metrics") is False
    # 192.168.0.0/16
    assert SSRFGuard.is_safe_url("http://192.168.1.1/router") is False

def test_ssrf_guard_blocks_cloud_metadata():
    assert SSRFGuard.is_safe_url("http://169.254.169.254/latest/meta-data/") is False
    assert SSRFGuard.is_safe_url("http://metadata.google.internal/computeMetadata/v1/") is False

def test_ssrf_guard_blocks_invalid_schemes():
    assert SSRFGuard.is_safe_url("file:///etc/passwd") is False
    assert SSRFGuard.is_safe_url("gopher://127.0.0.1:6379/") is False
    assert SSRFGuard.is_safe_url("") is False
    assert SSRFGuard.is_safe_url(None) is False
