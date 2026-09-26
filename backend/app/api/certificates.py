import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.land_record import LandRecord
from app.models.trust_certificate import TrustCertificate
from app.models.user import User
from app.schemas.trust_certificate import (
    TrustCertificateOut, 
    CertificateVerificationOut, 
    TrustCertificateCreate,
    BUYER_DISCLAIMER_TEXT
)
from app.auth.dependencies import get_current_user
from app.services.audit.logger import audit_logger
from app.utils.gis_data import get_gis_for_record

router = APIRouter(prefix="/certificates", tags=["Buyer Trust Certificates"])

def state_code_from_name(state: str) -> str:
    s = (state or "").lower()
    if "bengal" in s:
        return "WB"
    if "maha" in s:
        return "MH"
    if "karn" in s:
        return "KA"
    if "uttar" in s:
        return "UP"
    return "IN"

def evaluate_trust_tier(record: LandRecord) -> tuple[str, float, list, list]:
    """
    Evaluates buyer-oriented trust readiness based on multi-factor intelligence:
    - VERIFIED: Green tier (>85% scores, no duplicate collisions, verified status)
    - VERIFIED_WITH_CONDITIONS: Amber tier (minor warnings or pending non-critical items)
    - REQUIRES_FURTHER_VERIFICATION: Red/Review tier (conflicts, area mismatch, low confidence)
    """
    is_verified_status = (record.status == "VERIFIED")
    dup_score = record.duplicate_score or 0.0
    val_score = record.validation_score or 0.0
    ocr_conf = record.OCR_confidence or 0.0

    # Composite weighted trust score (0 - 100)
    composite_score = round((val_score * 0.4) + (ocr_conf * 0.3) + (max(0, 100.0 - dup_score) * 0.3), 1)

    checkpoints = [
        {
            "name": "Deed OCR Text Quality",
            "score": ocr_conf,
            "status": "PASSED" if ocr_conf >= 80.0 else ("WARNING" if ocr_conf >= 60.0 else "FLAGGED"),
            "details": f"OCR recognition confidence is {ocr_conf}% on source deed."
        },
        {
            "name": "Cadastral Rule & Schema Validation",
            "score": val_score,
            "status": "PASSED" if val_score >= 85.0 else ("WARNING" if val_score >= 50.0 else "FAILED"),
            "details": f"Validation engine returned {val_score}% rule compliance."
        },
        {
            "name": "Cadastral Duplicate & Title Collision Scan",
            "score": round(100.0 - dup_score, 1),
            "status": "PASSED" if dup_score < 30.0 else ("FLAGGED" if dup_score >= 70.0 else "WARNING"),
            "details": f"Collision risk is {dup_score}% ({'Clean title space' if dup_score < 30.0 else 'Potential parcel collision flagged'})."
        },
        {
            "name": "GIS Spatial Boundary Georeference",
            "score": 95.0 if record.latitude and record.gis_polygon else 50.0,
            "status": "PASSED" if record.latitude and record.gis_polygon else "PARTIAL",
            "details": "Cadastral parcel georeferenced with coordinate boundary polygon." if record.latitude else "Approximate village center referenced."
        },
        {
            "name": "Revenue Authority Verification Status",
            "score": 100.0 if is_verified_status else 60.0,
            "status": "PASSED" if is_verified_status else "PENDING",
            "details": f"Current cadastral registry status is {record.status}."
        }
    ]

    advisories = [
        f"Verify physical possession and boundary stones match registered extent of {record.area} Acres.",
        "Obtain a non-encumbrance certificate (Form 15/16) for the preceding 30 years from local Sub-Registrar.",
        "Confirm sanctioned mutation and tax revenue receipt entries at local Tehsil / BL&LRO office."
    ]

    if dup_score >= 70.0 or record.status in ["DUPLICATE", "REJECTED"]:
        status = "REQUIRES_FURTHER_VERIFICATION"
        advisories.insert(0, f"CRITICAL CAUTION: Potential title collision or overlapping boundary detected ({dup_score}% similarity). Formal field inquiry required.")
    elif is_verified_status and dup_score < 30.0 and val_score >= 85.0 and ocr_conf >= 75.0:
        status = "VERIFIED"
        advisories.insert(0, "All digital checks passed: High-confidence deed transcription and verified revenue record.")
    else:
        status = "VERIFIED_WITH_CONDITIONS"
        advisories.insert(0, "Verified with conditions: Record is conditionally cleared pending final physical encumbrance and title search verification.")

    return status, composite_score, checkpoints, advisories

def serialize_certificate(cert: TrustCertificate) -> dict:
    coords = []
    if cert.gis_polygon:
        try:
            coords = json.loads(cert.gis_polygon)
        except Exception:
            coords = []

    checkpoints = []
    if cert.verification_summary:
        try:
            checkpoints = json.loads(cert.verification_summary)
        except Exception:
            checkpoints = []

    advisories = []
    if cert.buyer_advisories:
        try:
            advisories = json.loads(cert.buyer_advisories)
        except Exception:
            advisories = []

    return {
        "id": cert.id,
        "certificate_id": cert.certificate_id,
        "record_id": cert.record_id,
        "trust_status": cert.trust_status,
        "trust_score": cert.trust_score,
        "owner_name": cert.owner_name,
        "father_or_guardian_name": cert.father_or_guardian_name,
        "plot_number": cert.plot_number or "N/A",
        "survey_number": cert.survey_number,
        "khatian_number": cert.khatian_number or "N/A",
        "area": cert.area,
        "land_type": cert.land_type,
        "village": cert.village,
        "district": cert.district,
        "state": cert.state,
        "registration_number": cert.registration_number,
        "mutation_number": cert.mutation_number,
        "latitude": cert.latitude,
        "longitude": cert.longitude,
        "gis_boundary_type": cert.gis_boundary_type or "POLYGON",
        "coordinates": coords,
        "google_maps_url": cert.google_maps_url,
        "OCR_confidence": cert.OCR_confidence,
        "validation_score": cert.validation_score,
        "duplicate_score": cert.duplicate_score,
        "record_status": cert.record_status,
        "verification_summary": checkpoints,
        "buyer_advisories": advisories,
        "qr_data": cert.qr_data or f"/verify/{cert.certificate_id}",
        "issued_at": cert.issued_at,
        "valid_until": cert.valid_until,
        "generated_by_name": cert.generated_by_name,
        "disclaimer": BUYER_DISCLAIMER_TEXT
    }

@router.post("/generate/{record_id}", response_model=TrustCertificateOut)
def generate_trust_certificate(
    record_id: int,
    payload: Optional[TrustCertificateCreate] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Generates a tamper-evident Buyer Trust Certificate for a land parcel.
    Logs the issuance in the audit trail.
    """
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found")

    # Evaluate trust tier
    trust_status, trust_score, checkpoints, advisories = evaluate_trust_tier(record)

    # Generate unique Certificate ID
    st_code = state_code_from_name(record.state)
    unique_suffix = uuid.uuid4().hex[:6].upper()
    cert_id = f"BTC-2026-{st_code}-{record.id:04d}-{unique_suffix}"

    # Ensure GIS coords and polygon are present
    lat = record.latitude
    lng = record.longitude
    poly_str = record.gis_polygon
    if not lat or not poly_str:
        gis_data = get_gis_for_record(record)
        lat = gis_data["latitude"]
        lng = gis_data["longitude"]
        poly_str = json.dumps(gis_data["coordinates"])

    gmaps_url = f"https://www.google.com/maps?q={lat},{lng}&z=18"
    qr_data = f"/verify/{cert_id}"

    issuer_name = current_user.name if current_user else "Revenue Cadastre Certification Engine"
    issuer_id = current_user.id if current_user else None

    cert = TrustCertificate(
        certificate_id=cert_id,
        record_id=record.id,
        trust_status=trust_status,
        trust_score=trust_score,
        owner_name=record.owner_name,
        father_or_guardian_name=record.father_or_guardian_name,
        plot_number=record.plot_number,
        survey_number=record.survey_number,
        khatian_number=record.khatian_number,
        area=record.area,
        land_type=record.land_type,
        village=record.village,
        district=record.district,
        state=record.state,
        registration_number=record.registration_number,
        mutation_number=record.mutation_number,
        latitude=lat,
        longitude=lng,
        gis_boundary_type=record.gis_boundary_type or "POLYGON",
        gis_polygon=poly_str,
        google_maps_url=gmaps_url,
        OCR_confidence=record.OCR_confidence or 0.0,
        validation_score=record.validation_score or 0.0,
        duplicate_score=record.duplicate_score or 0.0,
        record_status=record.status,
        verification_summary=json.dumps(checkpoints),
        buyer_advisories=json.dumps(advisories),
        qr_data=qr_data,
        generated_by_user_id=issuer_id,
        generated_by_name=issuer_name,
        issued_at=datetime.utcnow(),
        valid_until=datetime.utcnow() + timedelta(days=365)
    )

    db.add(cert)
    db.commit()
    db.refresh(cert)

    # Log in tamper-evident audit trail (Requirement 9)
    audit_logger.log(
        db,
        action="GENERATE_TRUST_CERTIFICATE",
        user_id=issuer_id,
        record_id=record.id,
        details={
            "certificate_id": cert_id,
            "trust_status": trust_status,
            "trust_score": trust_score,
            "issued_at": cert.issued_at.isoformat(),
            "valid_until": cert.valid_until.isoformat(),
            "officer_name": issuer_name,
            "village": record.village,
            "survey_number": record.survey_number,
            "plot_number": record.plot_number
        }
    )

    return serialize_certificate(cert)

@router.get("/verify/{certificate_id}", response_model=CertificateVerificationOut)
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """
    Public Verification Portal Endpoint (Requirement 5 & 6):
    Validates a Certificate ID/QR code and displays the current authentic status of the property.
    """
    clean_id = certificate_id.strip()
    cert = db.query(TrustCertificate).filter(TrustCertificate.certificate_id.ilike(clean_id)).first()
    
    if not cert:
        raise HTTPException(
            status_code=404, 
            detail=f"Certificate '{certificate_id}' is not recognized in the National Cadastre Trust Registry."
        )

    # Fetch live current state of the underlying record to detect any subsequent dispute or status change
    rec = db.query(LandRecord).filter(LandRecord.id == cert.record_id).first()
    live_status = rec.status if rec else cert.record_status

    checkpoints = []
    if cert.verification_summary:
        try:
            checkpoints = json.loads(cert.verification_summary)
        except Exception:
            checkpoints = []

    advisories = []
    if cert.buyer_advisories:
        try:
            advisories = json.loads(cert.buyer_advisories)
        except Exception:
            advisories = []

    coords = []
    if cert.gis_polygon:
        try:
            coords = json.loads(cert.gis_polygon)
        except Exception:
            coords = []

    is_expired = cert.valid_until < datetime.utcnow()
    is_valid = not is_expired and (live_status != "REJECTED")

    return {
        "is_valid": is_valid,
        "certificate_id": cert.certificate_id,
        "record_id": cert.record_id,
        "trust_status": cert.trust_status,
        "trust_score": cert.trust_score,
        "issued_at": cert.issued_at,
        "valid_until": cert.valid_until,
        "generated_by_name": cert.generated_by_name,
        "current_record_status": live_status,
        "property_reference": {
            "owner_name": cert.owner_name,
            "father_or_guardian_name": cert.father_or_guardian_name,
            "plot_number": cert.plot_number or "N/A",
            "survey_number": cert.survey_number,
            "khatian_number": cert.khatian_number or "N/A",
            "area_acres": cert.area,
            "area_sq_meters": round(cert.area * 4046.86, 1),
            "land_type": cert.land_type,
            "village": cert.village,
            "district": cert.district,
            "state": cert.state,
            "registration_number": cert.registration_number or "N/A",
            "mutation_number": cert.mutation_number or "N/A"
        },
        "gis_summary": {
            "latitude": cert.latitude,
            "longitude": cert.longitude,
            "gis_boundary_type": cert.gis_boundary_type,
            "boundary_vertices_count": len(coords),
            "coordinates": coords,
            "google_maps_url": cert.google_maps_url
        },
        "verification_summary": checkpoints,
        "buyer_advisories": advisories,
        "disclaimer": BUYER_DISCLAIMER_TEXT
    }

@router.get("/record/{record_id}", response_model=List[TrustCertificateOut])
def get_certificates_for_record(record_id: int, db: Session = Depends(get_db)):
    """Returns all certificates generated for a given land record."""
    certs = db.query(TrustCertificate).filter(TrustCertificate.record_id == record_id).order_by(TrustCertificate.id.desc()).all()
    return [serialize_certificate(c) for c in certs]

@router.get("/{certificate_id}", response_model=TrustCertificateOut)
def get_certificate_by_id(certificate_id: str, db: Session = Depends(get_db)):
    """Returns certificate details by certificate ID."""
    cert = db.query(TrustCertificate).filter(TrustCertificate.certificate_id.ilike(certificate_id.strip())).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return serialize_certificate(cert)

@router.get("", response_model=List[TrustCertificateOut])
def list_certificates(limit: int = 50, db: Session = Depends(get_db)):
    """Lists recently generated trust certificates."""
    certs = db.query(TrustCertificate).order_by(TrustCertificate.id.desc()).limit(limit).all()
    return [serialize_certificate(c) for c in certs]
