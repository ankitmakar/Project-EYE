from typing import Optional
from app.ingestion.validator import validate_raw_log_payload
from app.ingestion.parser import LogParser
from app.ingestion.normalizer import EventNormalizer
from app.schemas.event import EventCreate

class IngestionPipeline:
    @staticmethod
    def process_raw_log(source: str, raw_log: str, host: Optional[str] = None) -> EventCreate:
        # Step 1: Input Validation
        validate_raw_log_payload(source=source, raw_log=raw_log, host=host)
        
        # Step 2: Format Parsing
        parsed_data = LogParser.parse(source=source, raw_log=raw_log, host_hint=host)
        
        # Step 3: Normalization into Common Event Schema
        normalized_event = EventNormalizer.normalize(parsed=parsed_data, raw_log=raw_log)
        
        return normalized_event
