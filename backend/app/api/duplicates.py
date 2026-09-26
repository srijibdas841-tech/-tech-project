import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.duplicate import DuplicateCandidate
from app.models.land_record import LandRecord
from app.models.user import User
from app.schemas.duplicate import DuplicateCandidateOut, DuplicateReviewAction
from app.auth.dependencies import get_current_user
from app.services.audit.logger import audit_logger

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection"])

@router.get("", response_model=List[DuplicateCandidateOut])
def list_duplicates(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DuplicateCandidate)
    if status:
        query = query.filter(DuplicateCandidate.status == status.upper())
    
    candidates = query.order_by(DuplicateCandidate.similarity_score.desc()).all()
    
    # Unpack JSON matching fields
    results = []
    for c in candidates:
        m_fields = []
        if c.matching_fields:
            try:
                m_fields = json.loads(c.matching_fields)
            except Exception:
                m_fields = [f.strip() for f in c.matching_fields.split(",")]
        
        results.append({
            "id": c.id,
            "record_id": c.record_id,
            "matched_record_id": c.matched_record_id,
            "similarity_score": c.similarity_score,
            "matching_fields": m_fields,
            "status": c.status,
            "reviewer_comment": c.reviewer_comment,
            "record": c.record,
            "matched_record": c.matched_record
        })
    return results

@router.post("/{duplicate_id}/review")
def review_duplicate(
    duplicate_id: int,
    action_data: DuplicateReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    candidate = db.query(DuplicateCandidate).filter(DuplicateCandidate.id == duplicate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Duplicate candidate not found")

    act = action_data.action.upper()
    if act == "CONFIRM_DUPLICATE":
        candidate.status = "CONFIRMED_DUPLICATE"
        # Mark candidate record as DUPLICATE status
        rec = db.query(LandRecord).filter(LandRecord.id == candidate.record_id).first()
        if rec:
            rec.status = "DUPLICATE"
    elif act == "NOT_DUPLICATE":
        candidate.status = "RESOLVED_NOT_DUPLICATE"
    elif act == "SEND_FOR_REVIEW":
        candidate.status = "POTENTIAL_DUPLICATE"
    else:
        raise HTTPException(status_code=400, detail="Invalid duplicate review action")

    if action_data.comment:
        candidate.reviewer_comment = action_data.comment

    db.commit()

    audit_logger.log(
        db,
        action=f"DUPLICATE_DECISION_{act}",
        user_id=current_user.id if current_user else None,
        record_id=candidate.record_id,
        details={
            "duplicate_candidate_id": candidate.id,
            "matched_record_id": candidate.matched_record_id,
            "action": act,
            "comment": action_data.comment
        }
    )

    return {
        "message": f"Duplicate status updated to {candidate.status}",
        "duplicate_id": candidate.id,
        "status": candidate.status
    }
