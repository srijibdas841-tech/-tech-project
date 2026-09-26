from typing import Optional, List
from pydantic import BaseModel

class ValidationRuleResult(BaseModel):
    rule_name: str
    field_name: str
    extracted_value: Optional[str] = None
    status: str  # VALID, MISMATCH, CONFLICT, INVALID, WARNING
    confidence: float
    message: str

class RecordValidationSummary(BaseModel):
    record_id: int
    validation_score: float
    overall_status: str
    is_valid: bool
    results: List[ValidationRuleResult] = []
