import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.core.logging import logger
from app.detection.rule_loader import RuleDefinition, RuleLoader
from app.schemas.alert import AlertCreate
from app.schemas.event import EventCreate

class DetectionEngine:
    def __init__(self, dedup_window_seconds: int = 60):
        # Sliding time-window storage: key -> deque of timestamps
        # key format: "rule_id:group_by_value"
        self._sliding_windows: Dict[str, deque] = defaultdict(deque)
        # Alert deduplication cache: fingerprint -> last_alert_timestamp
        self._alert_dedup_cache: Dict[str, float] = {}
        self.dedup_window_seconds = dedup_window_seconds

    def evaluate_event(self, event: EventCreate, active_rules: Optional[List[RuleDefinition]] = None) -> List[AlertCreate]:
        if active_rules is None:
            active_rules = RuleLoader.get_all_rules()

        generated_alerts: List[AlertCreate] = []
        now_ts = datetime.now(timezone.utc).timestamp()

        for rule in active_rules:
            if not rule.enabled:
                continue

            # 1. Condition Matching
            if not self._matches_condition(event, rule.condition):
                continue

            # 2. Threshold Evaluation (if rule defines threshold)
            if rule.threshold and "count" in rule.threshold:
                threshold_count = int(rule.threshold["count"])
                timeframe = int(rule.threshold.get("timeframe_seconds", 120))
                group_by_fields = rule.threshold.get("group_by", ["source_ip", "host"])
                
                # Build group key
                key_parts = [rule.rule_id]
                for f in group_by_fields:
                    val = getattr(event, f, None)
                    if val is not None:
                        key_parts.append(str(val))
                    else:
                        meta_val = event.meta_info.get(f) if event.meta_info else None
                        key_parts.append(str(meta_val) if meta_val else "unknown")
                
                window_key = ":".join(key_parts)
                timestamps = self._sliding_windows[window_key]
                
                # Prune old timestamps
                cutoff = now_ts - timeframe
                while timestamps and timestamps[0] < cutoff:
                    timestamps.popleft()
                
                # Append current event
                timestamps.append(now_ts)

                if len(timestamps) < threshold_count:
                    # Threshold not yet reached
                    continue

                # Threshold reached! Reset to avoid duplicate alert flood
                timestamps.clear()
            else:
                # Deduplication check for single-event rules (Rule 37)
                fingerprint = f"{rule.rule_id}:{event.host}:{event.source_ip or ''}:{event.username or ''}"
                last_seen = self._alert_dedup_cache.get(fingerprint)
                if last_seen and (now_ts - last_seen) < self.dedup_window_seconds:
                    logger.debug(f"Deduplicating alert for rule '{rule.rule_id}' on host '{event.host}' (within {self.dedup_window_seconds}s window)")
                    continue
                self._alert_dedup_cache[fingerprint] = now_ts

            # 3. Construct Alert
            alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
            evidence = {
                "triggered_by_event_id": event.event_id,
                "event_type": event.event_type,
                "rule_description": rule.description,
                "mitre_tactic": rule.mitre_tactic,
                "mitre_technique": rule.mitre_technique,
                "raw_event": event.raw_event,
                "metadata": event.meta_info
            }

            alert = AlertCreate(
                alert_id=alert_id,
                rule_id=rule.rule_id,
                rule_name=rule.name,
                timestamp=event.timestamp,
                severity=rule.severity,
                confidence=rule.confidence,
                source=event.source,
                host=event.host,
                source_ip=event.source_ip,
                username=event.username,
                status="new",
                description=f"{rule.name} on host '{event.host}' (Triggered by {event.event_type})",
                evidence=evidence,
                analyst_notes=None
            )
            
            logger.warning(f"Detection Rule '{rule.name}' triggered! Generated Alert {alert_id} (Severity: {rule.severity})")
            generated_alerts.append(alert)

        return generated_alerts

    def _matches_condition(self, event: EventCreate, condition: Dict[str, str]) -> bool:
        if not condition:
            return False

        for field, expected_val in condition.items():
            actual_val = getattr(event, field, None)
            if actual_val is None and event.meta_info:
                actual_val = event.meta_info.get(field)
            
            if actual_val is None:
                return False
            
            # String comparison
            if str(actual_val).lower() != str(expected_val).lower():
                return False

        return True

detection_engine = DetectionEngine()
