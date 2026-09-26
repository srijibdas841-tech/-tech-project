from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.validation.rules import (
    RequiredFieldsRule,
    AreaValidationRule,
    SurveyNumberFormatRule,
    MutationNumberFormatRule,
    CrossRecordCadastralConflictRule
)

class ValidationEngine:
    """
    Configurable Validation Engine.
    Runs active validation rules and computes composite validation scores.
    """

    def __init__(self):
        self.rules = [
            RequiredFieldsRule(),
            AreaValidationRule(),
            SurveyNumberFormatRule(),
            MutationNumberFormatRule(),
            CrossRecordCadastralConflictRule(),
        ]

    def validate_record(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        results = []
        total_weight = 0.0
        weighted_score = 0.0
        has_critical_error = False
        has_conflict = False

        for rule in self.rules:
            res = rule.evaluate(data, db=db, current_record_id=current_record_id)
            results.append(res)
            
            # Confidence impact
            conf = res.get("confidence", 80.0)
            status = res.get("status", "VALID")
            
            if status == "INVALID":
                has_critical_error = True
            elif status == "CONFLICT":
                has_conflict = True
            
            w = rule.weight
            total_weight += w
            weighted_score += (conf * w)

        validation_score = round(weighted_score / total_weight, 1) if total_weight > 0 else 85.0
        
        # Penalize if critical error or conflict
        if has_critical_error:
            validation_score = min(validation_score, 45.0)
        elif has_conflict:
            validation_score = min(validation_score, 55.0)

        is_valid = validation_score >= 80.0 and not has_critical_error and not has_conflict

        return {
            "validation_score": validation_score,
            "is_valid": is_valid,
            "has_conflict": has_conflict,
            "results": results
        }

validation_engine = ValidationEngine()
