from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.land_record import LandRecord
from app.models.user import User
from app.schemas.land_record import LandRecordDetailOut
from app.auth.dependencies import get_current_user
from app.services.audit.logger import audit_logger

router = APIRouter(prefix="/review", tags=["Human Review Queue"])

class ReviewActionPayload(BaseModel):
    comment: Optional[str] = "Verified and approved by revenue officer"
    reason: Optional[str] = None

@router.get("/queue", response_model=List[LandRecordDetailOut])
def get_review_queue(db: Session = Depends(get_db)):
    """Fetches all land records currently requiring human verification."""
    records = db.query(LandRecord).filter(
        or_(
            LandRecord.status == "PENDING_REVIEW",
            LandRecord.OCR_confidence < 85.0,
            LandRecord.validation_score < 80.0,
            LandRecord.duplicate_score >= 70.0
        )
    ).order_by(LandRecord.duplicate_score.desc(), LandRecord.id.desc()).all()

    results = []
    for rec in records:
        results.append({
            **rec.__dict__,
            "validation_results": rec.validation_results,
            "has_potential_duplicates": rec.duplicate_score >= 70.0
        })
    return results

@router.post("/{record_id}/approve")
def approve_record(
    record_id: int,
    payload: ReviewActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    rec.status = "VERIFIED"
    db.commit()

    audit_logger.log(
        db,
        action="APPROVE_RECORD",
        user_id=current_user.id if current_user else None,
        record_id=rec.id,
        details={"comment": payload.comment, "status": "VERIFIED"}
    )

    return {"message": "Land record successfully approved and verified", "record_id": rec.id, "status": rec.status}

@router.post("/{record_id}/reject")
def reject_record(
    record_id: int,
    payload: ReviewActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    rec.status = "REJECTED"
    db.commit()

    audit_logger.log(
        db,
        action="REJECT_RECORD",
        user_id=current_user.id if current_user else None,
        record_id=rec.id,
        details={"reason": payload.reason or payload.comment, "status": "REJECTED"}
    )

    return {"message": "Land record rejected", "record_id": rec.id, "status": rec.status}

@router.post("/{record_id}/mark-duplicate")
def mark_record_duplicate(
    record_id: int,
    payload: ReviewActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    rec.status = "DUPLICATE"
    db.commit()

    audit_logger.log(
        db,
        action="MARK_AS_DUPLICATE",
        user_id=current_user.id if current_user else None,
        record_id=rec.id,
        details={"reason": payload.comment, "status": "DUPLICATE"}
    )

    return {"message": "Land record marked as DUPLICATE", "record_id": rec.id, "status": rec.status}
