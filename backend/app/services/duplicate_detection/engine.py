from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.land_record import LandRecord
from app.services.duplicate_detection.matcher import matcher

class DuplicateDetectionEngine:
    """
    Multi-Factor Weighted Duplicate & Conflict Detection Engine.
    Weights:
      Owner Name:    30%
      Father Name:   20%
      Survey Number: 20%
      Village:       10%
      Address:       10%
      Area:          10%
    """

    WEIGHTS = {
        "owner_name": 0.30,
        "father_name": 0.20,
        "survey_number": 0.20,
        "village": 0.10,
        "address": 0.10,
        "area": 0.10
    }

    def compute_similarity(self, record1: Dict[str, Any], record2: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates pairwise weighted similarity between two records."""
        sim_owner = matcher.compare_names(record1.get("owner_name") or "", record2.get("owner_name") or "")
        sim_father = matcher.compare_names(record1.get("father_or_guardian_name") or "", record2.get("father_or_guardian_name") or "")
        sim_survey = matcher.compare_survey_numbers(record1.get("survey_number") or "", record2.get("survey_number") or "")
        sim_village = matcher.similarity_ratio(record1.get("village") or "", record2.get("village") or "")
        sim_address = matcher.similarity_ratio(record1.get("address") or "", record2.get("address") or "")
        
        a1 = float(record1.get("area") or 0.0)
        a2 = float(record2.get("area") or 0.0)
        sim_area = matcher.compare_area(a1, a2)

        weighted_score = (
            sim_owner * self.WEIGHTS["owner_name"] +
            sim_father * self.WEIGHTS["father_name"] +
            sim_survey * self.WEIGHTS["survey_number"] +
            sim_village * self.WEIGHTS["village"] +
            sim_address * self.WEIGHTS["address"] +
            sim_area * self.WEIGHTS["area"]
        )
        weighted_score = round(weighted_score, 1)

        matching_fields = []
        if sim_owner >= 80.0:
            matching_fields.append("Owner Name")
        if sim_father >= 80.0:
            matching_fields.append("Father's Name")
        if sim_survey >= 85.0:
            matching_fields.append("Survey Number")
        if sim_village >= 80.0:
            matching_fields.append("Village")
        if sim_address >= 75.0:
            matching_fields.append("Address")
        if sim_area >= 90.0:
            matching_fields.append("Area")

        # Classification
        if weighted_score >= 90.0:
            classification = "HIGH DUPLICATE POSSIBILITY"
        elif weighted_score >= 70.0:
            classification = "POSSIBLE DUPLICATE"
        else:
            classification = "LOW POSSIBILITY"

        return {
            "similarity_score": weighted_score,
            "classification": classification,
            "matching_fields": matching_fields,
            "field_scores": {
                "owner_name": round(sim_owner, 1),
                "father_name": round(sim_father, 1),
                "survey_number": round(sim_survey, 1),
                "village": round(sim_village, 1),
                "address": round(sim_address, 1),
                "area": round(sim_area, 1)
            }
        }

    def scan_for_duplicates(self, record_data: Dict[str, Any], db: Session, exclude_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Scans all existing records in database for potential duplicates against the given record data.
        Returns candidates exceeding 70% similarity.
        """
        query = db.query(LandRecord)
        if exclude_id:
            query = query.filter(LandRecord.id != exclude_id)

        all_records = query.all()
        candidates = []

        for rec in all_records:
            existing_dict = {
                "owner_name": rec.owner_name,
                "father_or_guardian_name": rec.father_or_guardian_name,
                "survey_number": rec.survey_number,
                "village": rec.village,
                "address": rec.address,
                "area": rec.area
            }
            comparison = self.compute_similarity(record_data, existing_dict)
            if comparison["similarity_score"] >= 70.0:
                candidates.append({
                    "matched_record_id": rec.id,
                    "matched_owner_name": rec.owner_name,
                    "matched_survey_number": rec.survey_number,
                    "matched_village": rec.village,
                    "matched_status": rec.status,
                    "similarity_score": comparison["similarity_score"],
                    "classification": comparison["classification"],
                    "matching_fields": comparison["matching_fields"],
                    "field_scores": comparison["field_scores"]
                })

        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates

duplicate_engine = DuplicateDetectionEngine()
