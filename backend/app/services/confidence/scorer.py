from typing import Dict, Any

class ConfidenceScorer:
    """
    Computes overall land record digitization confidence score based on:
    - OCR Confidence (35%)
    - Validation Engine Score (40%)
    - Cross-record Consistency & Duplication Check (25%)
    """

    @staticmethod
    def calculate_overall_confidence(
        ocr_confidence: float,
        validation_score: float,
        duplicate_score: float,
        has_cadastral_conflict: bool = False
    ) -> Dict[str, Any]:
        
        # Consistency score is inverse to duplicate conflict risk
        if has_cadastral_conflict:
            consistency_score = 40.0
        elif duplicate_score >= 90.0:
            consistency_score = 50.0  # high conflict / duplicate flag
        elif duplicate_score >= 70.0:
            consistency_score = 75.0
        else:
            consistency_score = 98.0

        overall = (
            (ocr_confidence * 0.35) +
            (validation_score * 0.40) +
            (consistency_score * 0.25)
        )
        overall = round(max(0.0, min(100.0, overall)), 1)

        # Classification
        if overall >= 90.0 and not has_cadastral_conflict and duplicate_score < 85.0:
            category = "HIGH"
            recommendation = "AUTO_ACCEPT"
            status = "VERIFIED"
        elif overall >= 70.0:
            category = "MEDIUM"
            recommendation = "HUMAN_REVIEW"
            status = "PENDING_REVIEW"
        else:
            category = "LOW"
            recommendation = "CRITICAL_HUMAN_REVIEW"
            status = "PENDING_REVIEW"

        return {
            "overall_confidence": overall,
            "ocr_confidence": round(ocr_confidence, 1),
            "validation_score": round(validation_score, 1),
            "consistency_score": round(consistency_score, 1),
            "category": category,
            "recommendation": recommendation,
            "status": status
        }

confidence_scorer = ConfidenceScorer()
