from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

BUYER_DISCLAIMER_TEXT = (
    "This certificate summarizes the verification results available in the platform. "
    "It does not by itself constitute a legal title, ownership guarantee, or government-issued clearance. "
    "Buyers should complete all required legal and official verification before purchasing property."
)

class TrustCertificateCreate(BaseModel):
    notes: Optional[str] = None

class TrustCertificateOut(BaseModel):
    id: int
    certificate_id: str
    record_id: int
    trust_status: str  # VERIFIED, VERIFIED_WITH_CONDITIONS, REQUIRES_FURTHER_VERIFICATION
    trust_score: float
    
    # Property Details
    owner_name: str
    father_or_guardian_name: Optional[str] = None
    plot_number: Optional[str] = None
    survey_number: str
    khatian_number: Optional[str] = None
    area: float
    land_type: str
    village: str
    district: str
    state: str
    registration_number: Optional[str] = None
    mutation_number: Optional[str] = None
    
    # GIS Geospatial Data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gis_boundary_type: Optional[str] = "POLYGON"
    coordinates: List[List[float]] = []
    google_maps_url: Optional[str] = None
    
    # AI & Forensic Integrity Scores
    OCR_confidence: float
    validation_score: float
    duplicate_score: float
    record_status: str
    
    # Checkpoints & Advisories
    verification_summary: List[Dict[str, Any]] = []
    buyer_advisories: List[str] = []
    qr_data: str
    
    # Issuance Info
    issued_at: datetime
    valid_until: datetime
    generated_by_name: str
    disclaimer: str = BUYER_DISCLAIMER_TEXT

    class Config:
        from_attributes = True

class CertificateVerificationOut(BaseModel):
    is_valid: bool
    certificate_id: str
    record_id: int
    trust_status: str
    trust_score: float
    issued_at: datetime
    valid_until: datetime
    generated_by_name: str
    current_record_status: str
    property_reference: Dict[str, Any]
    gis_summary: Dict[str, Any]
    verification_summary: List[Dict[str, Any]] = []
    buyer_advisories: List[str] = []
    disclaimer: str = BUYER_DISCLAIMER_TEXT
