from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class LandRecordBase(BaseModel):
    owner_name: str
    father_or_guardian_name: Optional[str] = None
    address: Optional[str] = None
    district: str
    state: str
    village: str
    survey_number: str
    plot_number: Optional[str] = None
    area: float
    land_type: Optional[str] = "Agricultural"
    registration_number: Optional[str] = None
    mutation_number: Optional[str] = None
    document_date: Optional[str] = None
    # GIS attributes
    khatian_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gis_polygon: Optional[str] = None
    gis_boundary_type: Optional[str] = "POLYGON"

class LandRecordCreate(LandRecordBase):
    source_document: Optional[int] = None
    OCR_confidence: Optional[float] = 0.0
    validation_score: Optional[float] = 0.0
    duplicate_score: Optional[float] = 0.0
    status: Optional[str] = "PENDING_REVIEW"

class LandRecordUpdate(BaseModel):
    owner_name: Optional[str] = None
    father_or_guardian_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None
    survey_number: Optional[str] = None
    plot_number: Optional[str] = None
    area: Optional[float] = None
    land_type: Optional[str] = None
    registration_number: Optional[str] = None
    mutation_number: Optional[str] = None
    document_date: Optional[str] = None
    khatian_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gis_polygon: Optional[str] = None
    gis_boundary_type: Optional[str] = None
    status: Optional[str] = None
    reviewer_comment: Optional[str] = None

class ValidationResultOut(BaseModel):
    id: int
    field_name: str
    extracted_value: Optional[str] = None
    validation_status: str
    confidence: float
    validation_message: Optional[str] = None

    class Config:
        from_attributes = True

class LandRecordOut(LandRecordBase):
    id: int
    source_document: Optional[int] = None
    OCR_confidence: float
    validation_score: float
    duplicate_score: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LandRecordDetailOut(LandRecordOut):
    validation_results: List[ValidationResultOut] = []
    has_potential_duplicates: bool = False

    class Config:
        from_attributes = True

class LandRecordGisOut(BaseModel):
    id: int
    owner_name: str
    father_or_guardian_name: Optional[str] = None
    district: str
    state: str
    village: str
    survey_number: str
    plot_number: Optional[str] = None
    khatian_number: Optional[str] = None
    area: float
    land_type: Optional[str] = "Agricultural"
    registration_number: Optional[str] = None
    mutation_number: Optional[str] = None
    document_date: Optional[str] = None
    status: str
    OCR_confidence: float
    validation_score: float
    duplicate_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gis_boundary_type: Optional[str] = "POLYGON"
    coordinates: List[List[float]] = []
    google_maps_url: Optional[str] = None
    bounds: Optional[dict] = None
    cadastral_metadata: Optional[dict] = None

    class Config:
        from_attributes = True

