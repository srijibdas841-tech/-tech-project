import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.land_record import LandRecord

class ValidationRule:
    """Base class for configurable validation rules."""
    def __init__(self, name: str, description: str, weight: float = 1.0):
        self.name = name
        self.description = description
        self.weight = weight

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        raise NotImplementedError

class RequiredFieldsRule(ValidationRule):
    REQUIRED_FIELDS = ["owner_name", "village", "district", "state", "survey_number", "area"]

    def __init__(self):
        super().__init__(
            name="Required Fields Check",
            description="Ensures all essential land deed identifiers exist",
            weight=1.5
        )

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        missing = [f for f in self.REQUIRED_FIELDS if not data.get(f)]
        if missing:
            return {
                "rule": self.name,
                "field": ", ".join(missing),
                "status": "INVALID",
                "confidence": 40.0,
                "message": f"Critical missing required fields: {', '.join(missing)}"
            }
        return {
            "rule": self.name,
            "field": "all_required",
            "status": "VALID",
            "confidence": 100.0,
            "message": "All required ownership and location attributes are present."
        }

class AreaValidationRule(ValidationRule):
    def __init__(self, min_area: float = 0.01, max_area: float = 10000.0):
        super().__init__(name="Area Parcel Validity", description="Checks area is positive and within reasonable bounds")
        self.min_area = min_area
        self.max_area = max_area

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        area = data.get("area")
        try:
            area_float = float(area) if area is not None else 0.0
        except (ValueError, TypeError):
            area_float = 0.0

        if area_float <= 0:
            return {
                "rule": self.name,
                "field": "area",
                "status": "INVALID",
                "confidence": 0.0,
                "message": f"Invalid land area: {area_float} Acres. Parcel area must be greater than zero."
            }
        if area_float > self.max_area:
            return {
                "rule": self.name,
                "field": "area",
                "status": "MISMATCH",
                "confidence": 60.0,
                "message": f"Unusually large parcel area ({area_float} Acres). Flagged for verification."
            }
        return {
            "rule": self.name,
            "field": "area",
            "status": "VALID",
            "confidence": 98.0,
            "message": f"Parcel area {area_float} Acres is within normal agricultural/residential limits."
        }

class SurveyNumberFormatRule(ValidationRule):
    def __init__(self):
        super().__init__(name="Survey Number Format", description="Validates standard revenue survey/dag format")

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        survey_no = str(data.get("survey_number") or "").strip()
        # Typical format: digits, or digits/digits, e.g. 123, 123/4, 123/4A, 88-2
        pattern = r"^[0-9]+(/[0-9A-Za-z]+)?$"
        if not survey_no:
            return {
                "rule": self.name,
                "field": "survey_number",
                "status": "INVALID",
                "confidence": 0.0,
                "message": "Survey/Dag number is empty."
            }
        if not re.match(pattern, survey_no):
            return {
                "rule": self.name,
                "field": "survey_number",
                "status": "WARNING",
                "confidence": 70.0,
                "message": f"Survey number '{survey_no}' deviates from standard revenue cadastral format."
            }
        return {
            "rule": self.name,
            "field": "survey_number",
            "status": "VALID",
            "confidence": 96.0,
            "message": f"Survey number '{survey_no}' conforms to cadastral format."
        }

class MutationNumberFormatRule(ValidationRule):
    def __init__(self):
        super().__init__(name="Mutation Number Format", description="Validates mutation case registry format")

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        mut_no = str(data.get("mutation_number") or "").strip()
        if not mut_no:
            return {
                "rule": self.name,
                "field": "mutation_number",
                "status": "WARNING",
                "confidence": 75.0,
                "message": "Mutation number is pending or unrecorded."
            }
        # Checks if pattern conforms to MUT-YYYY-XXXX or similar alphanumeric
        pattern = r"^MUT-\d{4}-\d+"
        if not re.match(pattern, mut_no, re.IGNORECASE):
            return {
                "rule": self.name,
                "field": "mutation_number",
                "status": "WARNING",
                "confidence": 80.0,
                "message": f"Mutation identifier '{mut_no}' does not follow standard MUT-YYYY-XXXX convention."
            }
        return {
            "rule": self.name,
            "field": "mutation_number",
            "status": "VALID",
            "confidence": 95.0,
            "message": f"Mutation identifier '{mut_no}' is syntactically valid."
        }

class CrossRecordCadastralConflictRule(ValidationRule):
    def __init__(self):
        super().__init__(name="Cross-Record Cadastral Conflict", description="Checks for conflicting ownership claims on same parcel", weight=2.0)

    def evaluate(self, data: Dict[str, Any], db: Optional[Session] = None, current_record_id: Optional[int] = None) -> Dict[str, Any]:
        if not db:
            return {
                "rule": self.name,
                "field": "survey_number",
                "status": "VALID",
                "confidence": 90.0,
                "message": "No database session supplied for conflict checking."
            }
        
        survey = data.get("survey_number")
        village = data.get("village")
        owner = data.get("owner_name")
        if not survey or not village:
            return {
                "rule": self.name,
                "field": "survey_number",
                "status": "VALID",
                "confidence": 90.0,
                "message": "Insufficient data to verify cadastral conflicts."
            }

        # Query database for verified records in the same village and survey number
        query = db.query(LandRecord).filter(
            LandRecord.survey_number == survey,
            LandRecord.village.ilike(f"%{village}%"),
            LandRecord.status == "VERIFIED"
        )
        if current_record_id:
            query = query.filter(LandRecord.id != current_record_id)
        
        existing = query.first()
        if existing and existing.owner_name.strip().lower() != (owner or "").strip().lower():
            return {
                "rule": self.name,
                "field": "survey_number",
                "status": "CONFLICT",
                "confidence": 35.0,
                "message": f"Cadastral Conflict: Survey {survey} in {village} is already registered to '{existing.owner_name}' (Record #{existing.id})."
            }

        return {
            "rule": self.name,
            "field": "survey_number",
            "status": "VALID",
            "confidence": 98.0,
            "message": "No cadastral title conflicts detected in village land registry."
        }
