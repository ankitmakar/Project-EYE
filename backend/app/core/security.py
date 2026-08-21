import ipaddress
import socket
from urllib.parse import urlparse
import bcrypt
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional, Union
from jose import JWTError, jwt
from app.core.config import settings

class UserRole(str, Enum):
    ADMIN = "admin"
    SENIOR_ANALYST = "senior_analyst"
    SOC_ANALYST = "soc_analyst"
    VIEWER = "viewer"
    SERVICE_ACCOUNT = "service_account"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8")[:72], salt)
    return hashed.decode("utf-8")

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return {}

class SSRFGuard:
    """
    Validates external URLs to prevent Server-Side Request Forgery (SSRF)
    attacks against internal infrastructure, loopback addresses, and cloud metadata endpoints.
    """
    BLOCKED_HOSTNAMES = {
        "localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "instance-data"
    }

    @classmethod
    def is_safe_url(cls, url: str) -> bool:
        if not url:
            return False

        try:
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return False

            hostname = parsed.hostname
            if not hostname:
                return False

            hostname_lower = hostname.lower().strip()
            if hostname_lower in cls.BLOCKED_HOSTNAMES:
                return False

            # Check direct IP addresses
            try:
                ip = ipaddress.ip_address(hostname_lower)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                    return False
                # Cloud metadata IP (169.254.169.254) is link-local, but explicit check for safety
                if str(ip) == "169.254.169.254":
                    return False
                return True
            except ValueError:
                # Hostname is a domain name, resolve DNS to verify target IPs
                pass

            try:
                addr_info = socket.getaddrinfo(hostname_lower, None)
                for item in addr_info:
                    sockaddr = item[4]
                    ip_str = sockaddr[0]
                    ip = ipaddress.ip_address(ip_str)
                    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                        return False
                    if str(ip) == "169.254.169.254":
                        return False
            except socket.gaierror:
                return False

            return True
        except Exception:
            return False

