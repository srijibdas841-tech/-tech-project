from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.land_record import LandRecord
from app.models.validation import ValidationResult
from app.models.duplicate import DuplicateCandidate
from app.models.user import User
from app.schemas.land_record import LandRecordOut, LandRecordDetailOut, LandRecordUpdate, ValidationResultOut, LandRecordGisOut
from app.auth.dependencies import get_current_user
from app.services.audit.logger import audit_logger
from app.utils.gis_data import format_gis_record

router = APIRouter(prefix="/records", tags=["Land Records"])

@router.get("/gis/all", response_model=List[LandRecordGisOut])
def get_all_gis_records(
    search: Optional[str] = Query(None, description="Search any cadastral identifier"),
    plot_number: Optional[str] = Query(None),
    survey_number: Optional[str] = Query(None),
    khatian_number: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Returns spatial cadastral records with exact coordinates, boundary polygons, and GIS metadata."""
    query = db.query(LandRecord)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LandRecord.owner_name.ilike(s),
                LandRecord.survey_number.ilike(s),
                LandRecord.plot_number.ilike(s),
                LandRecord.khatian_number.ilike(s),
                LandRecord.village.ilike(s),
                LandRecord.district.ilike(s),
                LandRecord.state.ilike(s),
                LandRecord.registration_number.ilike(s)
            )
        )
    if plot_number:
        query = query.filter(LandRecord.plot_number.ilike(f"%{plot_number.strip()}%"))
    if survey_number:
        query = query.filter(LandRecord.survey_number.ilike(f"%{survey_number.strip()}%"))
    if khatian_number:
        query = query.filter(LandRecord.khatian_number.ilike(f"%{khatian_number.strip()}%"))
    if village:
        query = query.filter(LandRecord.village.ilike(f"%{village.strip()}%"))
    if district:
        query = query.filter(LandRecord.district.ilike(f"%{district.strip()}%"))
    if state:
        query = query.filter(LandRecord.state.ilike(f"%{state.strip()}%"))
    if status:
        query = query.filter(LandRecord.status == status.upper())

    records = query.order_by(LandRecord.id.asc()).limit(limit).all()
    return [format_gis_record(r) for r in records]

@router.get("/{record_id}/gis", response_model=LandRecordGisOut)
def get_record_gis(record_id: int, db: Session = Depends(get_db)):
    """Returns detailed GIS boundary polygon and geospatial attributes for a single record."""
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")
    return format_gis_record(rec)

@router.get("", response_model=List[LandRecordOut])
def list_records(
    search: Optional[str] = Query(None, description="Search owner, survey, village, etc."),
    owner_name: Optional[str] = Query(None),
    survey_number: Optional[str] = Query(None),
    plot_number: Optional[str] = Query(None),
    khatian_number: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    registration_number: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="VERIFIED, PENDING_REVIEW, DUPLICATE, REJECTED"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(LandRecord)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LandRecord.owner_name.ilike(s),
                LandRecord.survey_number.ilike(s),
                LandRecord.plot_number.ilike(s),
                LandRecord.khatian_number.ilike(s),
                LandRecord.village.ilike(s),
                LandRecord.district.ilike(s),
                LandRecord.state.ilike(s),
                LandRecord.registration_number.ilike(s)
            )
        )
    if owner_name:
        query = query.filter(LandRecord.owner_name.ilike(f"%{owner_name.strip()}%"))
    if survey_number:
        query = query.filter(LandRecord.survey_number.ilike(f"%{survey_number.strip()}%"))
    if plot_number:
        query = query.filter(LandRecord.plot_number.ilike(f"%{plot_number.strip()}%"))
    if khatian_number:
        query = query.filter(LandRecord.khatian_number.ilike(f"%{khatian_number.strip()}%"))
    if village:
        query = query.filter(LandRecord.village.ilike(f"%{village.strip()}%"))
    if district:
        query = query.filter(LandRecord.district.ilike(f"%{district.strip()}%"))
    if state:
        query = query.filter(LandRecord.state.ilike(f"%{state.strip()}%"))
    if registration_number:
        query = query.filter(LandRecord.registration_number.ilike(f"%{registration_number.strip()}%"))
    if status:
        query = query.filter(LandRecord.status == status.upper())

    return query.order_by(LandRecord.id.desc()).offset(skip).limit(limit).all()

@router.get("/{record_id}", response_model=LandRecordDetailOut)
def get_record_detail(record_id: int, db: Session = Depends(get_db)):
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")
    
    # Check if this record has potential duplicates
    has_dups = db.query(DuplicateCandidate).filter(
        or_(
            DuplicateCandidate.record_id == record_id,
            DuplicateCandidate.matched_record_id == record_id
        ),
        DuplicateCandidate.status == "POTENTIAL_DUPLICATE"
    ).count() > 0

    return {
        **rec.__dict__,
        "validation_results": rec.validation_results,
        "has_potential_duplicates": has_dups
    }

@router.get("/{record_id}/validation", response_model=List[ValidationResultOut])
def get_record_validation(record_id: int, db: Session = Depends(get_db)):
    results = db.query(ValidationResult).filter(ValidationResult.land_record_id == record_id).all()
    return results

@router.put("/{record_id}", response_model=LandRecordOut)
def update_record(
    record_id: int,
    update_data: LandRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    changes = {}
    data_dict = update_data.model_dump(exclude_unset=True)
    comment = data_dict.pop("reviewer_comment", None)

    for field, new_val in data_dict.items():
        if hasattr(rec, field) and new_val is not None:
            old_val = getattr(rec, field)
            if old_val != new_val:
                changes[field] = {"old": old_val, "new": new_val}
                setattr(rec, field, new_val)

    db.commit()
    db.refresh(rec)

    audit_logger.log(
        db,
        action="UPDATE_RECORD_FIELDS",
        user_id=current_user.id if current_user else None,
        record_id=rec.id,
        details={"changes": changes, "reviewer_comment": comment}
    )

    return rec
