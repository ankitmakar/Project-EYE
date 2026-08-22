import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.logging import logger

class ThreatIntelService:
    """
    Threat Intelligence & IOC Management Service for Project EYE.
    Enriches indicators of compromise (IP, Domain, URL, MD5/SHA256 hash)
    with risk scores, attribution, and reputation data.
    """

    KNOWN_MALICIOUS_IOCS: Dict[str, Dict[str, Any]] = {
        "198.51.100.77": {
            "type": "ipv4",
            "reputation": "malicious",
            "score": 95,
            "threat_actor": "APT-29 / Midnight Blizzard",
            "malware_family": "Cobalt Strike C2 / Reverse Shell",
            "country": "RU",
            "asn": "AS48211",
            "first_seen": "2026-01-15T08:00:00Z",
            "confidence": 0.98,
            "sources": ["AbuseIPDB", "AlienVault OTX", "EYE-Lab-Feed"]
        },
        "203.0.113.99": {
            "type": "ipv4",
            "reputation": "malicious",
            "score": 88,
            "threat_actor": "Automated Web Exploiter",
            "malware_family": "SQLMap / Automated Scanner",
            "country": "NL",
            "asn": "AS16509",
            "first_seen": "2026-02-10T12:30:00Z",
            "confidence": 0.92,
            "sources": ["ThreatConnect", "EYE-Web-HoneyPot"]
        },
        "c2.darknet-tunnel.org": {
            "type": "domain",
            "reputation": "malicious",
            "score": 99,
            "threat_actor": "BlackCat / ALPHV",
            "malware_family": "DNS Tunneling Exfiltration",
            "country": "IS",
            "confidence": 0.99,
            "sources": ["Spamhaus DBL", "VirusTotal"]
        },
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": {
            "type": "sha256",
            "reputation": "benign",
            "score": 0,
            "threat_actor": "None",
            "malware_family": "Empty File Hash (Standard)",
            "confidence": 1.0,
            "sources": ["NIST NSRL"]
        },
        "44d88612fea8a8f36de82e1278abb02f": {
            "type": "md5",
            "reputation": "malicious",
            "score": 94,
            "threat_actor": "Lazarus Group",
            "malware_family": "WannaCry Ransomware Dropper",
            "confidence": 0.97,
            "sources": ["VirusTotal", "AlienVault OTX"]
        }
    }

    @classmethod
    def enrich_ioc(cls, indicator: str) -> Dict[str, Any]:
        """
        Enrich an indicator with threat intelligence and provenance data.
        """
        indicator_clean = indicator.strip().lower()
        if indicator_clean in cls.KNOWN_MALICIOUS_IOCS:
            data = cls.KNOWN_MALICIOUS_IOCS[indicator_clean]
            return {
                "indicator": indicator,
                "found": True,
                "reputation": data["reputation"],
                "score": data["score"],
                "threat_actor": data.get("threat_actor", "Unknown"),
                "malware_family": data.get("malware_family", "Unknown"),
                "confidence": data.get("confidence", 0.8),
                "sources": data.get("sources", ["EYE Threat Feed"]),
                "enriched_at": datetime.now(timezone.utc).isoformat(),
                "lifecycle_status": "enriched"
            }
        
        # Heuristic scoring for unknown indicators
        is_private = any(indicator.startswith(p) for p in ["192.168.", "10.", "172.16.", "127.0.0.1", "localhost"])
        score = 0 if is_private else 25
        reputation = "internal" if is_private else "suspicious_unranked"

        return {
            "indicator": indicator,
            "found": False,
            "reputation": reputation,
            "score": score,
            "threat_actor": "None / Unclassified",
            "malware_family": "N/A",
            "confidence": 0.5,
            "sources": ["Local Heuristic Analysis"],
            "enriched_at": datetime.now(timezone.utc).isoformat(),
            "lifecycle_status": "observed"
        }

    @staticmethod
    def calculate_evidence_hash(data: str) -> Dict[str, str]:
        """
        Calculates SHA-256 and MD5 hashes for digital forensics evidence integrity.
        """
        raw_bytes = data.encode("utf-8")
        sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
        md5_hash = hashlib.md5(raw_bytes).hexdigest()
        return {
            "sha256": sha256_hash,
            "md5": md5_hash,
            "byte_size": str(len(raw_bytes)),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @classmethod
    def list_top_iocs(cls) -> List[Dict[str, Any]]:
        return [
            {"indicator": k, **v} for k, v in cls.KNOWN_MALICIOUS_IOCS.items()
        ]
