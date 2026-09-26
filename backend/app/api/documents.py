import os
import shutil
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.config import settings, BASE_DIR
from app.database.session import get_db
from app.models.document import Document
from app.models.land_record import LandRecord
from app.models.validation import ValidationResult
from app.models.duplicate import DuplicateCandidate
from app.models.user import User
from app.schemas.document import DocumentOut, OCRProcessingResult
from app.auth.dependencies import get_current_user
from app.services.ocr.service import ocr_service
from app.services.extraction.extractor import extractor
from app.services.validation.engine import validation_engine
from app.services.duplicate_detection.engine import duplicate_engine
from app.services.confidence.scorer import confidence_scorer
from app.services.audit.logger import audit_logger

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/samples")
def get_sample_documents():
    """Returns sample pre-bundled authentic land record deeds for instant demo testing."""
    samples = [
        {
            "id": "WB_RoR_Khatian_104.pdf",
            "name": "West Bengal - RoR Khatian 104 (Rahul Das)",
            "state": "West Bengal",
            "language": "en",
            "description": "Certified Record of Rights extract from Moyna Block, Purba Medinipur."
        },
        {
            "id": "MH_Satbara_712_312.pdf",
            "name": "Maharashtra - 7/12 Satbara Extract (Suresh Patil)",
            "state": "Maharashtra",
            "language": "en",
            "description": "Village Form VII-XII cadastral extract from Haveli Taluka, Pune."
        },
        {
            "id": "KA_RTC_Bhoomi_45.pdf",
            "name": "Karnataka - Bhoomi RTC Pahani 45/1 (Ramesh Gowda)",
            "state": "Karnataka",
            "language": "en",
            "description": "Bhoomi online land portal RTC deed from Anekal Taluk, Bengaluru."
        },
        {
            "id": "UP_Khatauni_215.pdf",
            "name": "Uttar Pradesh - Khatauni 215/1 (Ramesh Singh - Hindi)",
            "state": "Uttar Pradesh",
            "language": "hi",
            "description": "Revenue Board Khatauni from Malihabad Tehsil, Lucknow in Hindi/English."
        },
        {
            "id": "WB_RoR_Moyna_Duplicate_Test.pdf",
            "name": "Duplicate Conflict Deed - Moyna 123/4 (Rahul K. Das)",
            "state": "West Bengal",
            "language": "en",
            "description": "Conflicting deed claiming same parcel 123/4 with 92% duplicate similarity."
        }
    ]
    return samples

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".bmp"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only PDF and image formats (JPG, PNG, TIFF) are accepted."
        )

    # Save file
    file_path = settings.UPLOAD_DIR / file.filename
    # Handle filename collision
    base_name = Path(file.filename).stem
    counter = 1
    while file_path.exists():
        file_path = settings.UPLOAD_DIR / f"{base_name}_{counter}{ext}"
        counter += 1

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Check file size (15MB limit)
    if os.path.getsize(file_path) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size ({settings.MAX_FILE_SIZE_MB} MB).")

    doc = Document(
        file_name=file_path.name,
        file_path=str(file_path.relative_to(BASE_DIR)).replace("\\", "/"),
        file_type=file.content_type or "application/octet-stream",
        OCR_status="PENDING",
        processing_status="UPLOADED",
        language=language
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    audit_logger.log(
        db,
        action="UPLOAD_DOCUMENT",
        user_id=current_user.id if current_user else None,
        record_id=None,
        details={"document_id": doc.id, "file_name": doc.file_name, "language": language}
    )

    return doc

@router.get("", response_model=List[DocumentOut])
def list_documents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()

@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/{document_id}/process", response_model=OCRProcessingResult)
def process_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete End-to-End Processing Workflow:
    Document -> OCR Processing -> Field Extraction -> Normalization ->
    Validation Engine -> Duplicate Detection -> Confidence Scoring ->
    Auto-Accept (HIGH) or Human Review (MED/LOW) -> Database Update & Audit Log.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    full_path = BASE_DIR / doc.file_path
    # If file doesn't exist in uploads, check sample_documents
    if not full_path.exists():
        sample_path = settings.SAMPLE_DIR / doc.file_name
        if sample_path.exists():
            full_path = sample_path
        else:
            # Fallback path for safety
            full_path = settings.UPLOAD_DIR / doc.file_name

    # Step 1: OCR Processing
    doc.OCR_status = "PROCESSING"
    doc.processing_status = "OCR_IN_PROGRESS"
    db.commit()

    ocr_res = ocr_service.process_document(str(full_path), language=doc.language)
    extracted_text = ocr_res.get("full_text", "")
    ocr_confidence = ocr_res.get("confidence", 90.0)

    doc.OCR_status = "COMPLETED"
    doc.processing_status = "OCR_DONE"
    doc.extracted_text = extracted_text
    db.commit()

    # Step 2: Structured Field Extraction & Normalization
    fields = extractor.extract_fields(extracted_text, base_ocr_confidence=ocr_confidence)

    # Step 3: Multi-Rule Validation Engine
    val_res = validation_engine.validate_record(fields, db=db)
    validation_score = val_res["validation_score"]
    has_conflict = val_res["has_conflict"]
    validation_issues = [r for r in val_res["results"] if r.get("status") in ["INVALID", "CONFLICT", "MISMATCH", "WARNING"]]

    # Step 4: Duplicate & Conflict Detection
    duplicate_matches = duplicate_engine.scan_for_duplicates(fields, db=db)
    top_dup_score = duplicate_matches[0]["similarity_score"] if duplicate_matches else 0.0

    # Step 5: Composite Confidence Scoring
    confidence_data = confidence_scorer.calculate_overall_confidence(
        ocr_confidence=ocr_confidence,
        validation_score=validation_score,
        duplicate_score=top_dup_score,
        has_cadastral_conflict=has_conflict
    )

    final_status = confidence_data["status"]  # VERIFIED or PENDING_REVIEW

    # Step 6: Create or Update LandRecord
    land_record = LandRecord(
        owner_name=fields["owner_name"],
        father_or_guardian_name=fields["father_or_guardian_name"],
        address=fields["address"],
        village=fields["village"],
        district=fields["district"],
        state=fields["state"],
        survey_number=fields["survey_number"],
        plot_number=fields["plot_number"],
        area=fields["area"],
        land_type=fields["land_type"],
        registration_number=fields["registration_number"],
        mutation_number=fields["mutation_number"],
        document_date=fields["document_date"],
        source_document=doc.id,
        OCR_confidence=ocr_confidence,
        validation_score=validation_score,
        duplicate_score=top_dup_score,
        status=final_status
    )
    db.add(land_record)
    db.commit()
    db.refresh(land_record)

    # Save validation records
    for r in val_res["results"]:
        db.add(ValidationResult(
            land_record_id=land_record.id,
            field_name=r.get("field", "general"),
            extracted_value=str(fields.get(r.get("field"), "")),
            validation_status=r.get("status", "VALID"),
            confidence=r.get("confidence", 90.0),
            validation_message=r.get("message")
        ))

    # Save duplicate candidates if score >= 70
    for match in duplicate_matches:
        db.add(DuplicateCandidate(
            record_id=land_record.id,
            matched_record_id=match["matched_record_id"],
            similarity_score=match["similarity_score"],
            matching_fields=json.dumps(match["matching_fields"]),
            status="POTENTIAL_DUPLICATE",
            reviewer_comment=f"Automated match ({match['classification']}). Matching fields: {', '.join(match['matching_fields'])}"
        ))

    doc.processing_status = "COMPLETED"
    db.commit()

    # Step 7: Audit Logging
    audit_logger.log(
        db,
        action="AUTO_PROCESS_DOCUMENT",
        user_id=current_user.id if current_user else None,
        record_id=land_record.id,
        details={
            "document_id": doc.id,
            "overall_confidence": confidence_data["overall_confidence"],
            "status": final_status,
            "top_duplicate_score": top_dup_score,
            "validation_score": validation_score
        }
    )

    return {
        "document_id": doc.id,
        "extracted_text": extracted_text,
        "fields": fields,
        "overall_ocr_confidence": ocr_confidence,
        "validation_score": validation_score,
        "duplicate_score": top_dup_score,
        "overall_confidence": confidence_data["overall_confidence"],
        "status": final_status,
        "validation_issues": validation_issues,
        "duplicate_candidates": duplicate_matches,
        "record_id": land_record.id
    }
