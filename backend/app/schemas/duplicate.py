from typing import List, Optional
from pydantic import BaseModel
from app.schemas.land_record import LandRecordOut

class DuplicateCandidateOut(BaseModel):
    id: int
    record_id: int
    matched_record_id: int
    similarity_score: float
    matching_fields: List[str] = []
    status: str
    reviewer_comment: Optional[str] = None
    record: Optional[LandRecordOut] = None
    matched_record: Optional[LandRecordOut] = None

    class Config:
        from_attributes = True

class DuplicateReviewAction(BaseModel):
    action: str  # CONFIRM_DUPLICATE, NOT_DUPLICATE, SEND_FOR_REVIEW
    comment: Optional[str] = None
