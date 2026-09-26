from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DocumentOut(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_type: str
    upload_date: datetime
    OCR_status: str
    processing_status: str
    extracted_text: Optional[str] = None
    language: str

    class Config:
        from_attributes = True

class OCRFieldExtraction(BaseModel):
    owner_name: Optional[str] = None
    father_or_guardian_name: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: Optional[str] = None
    plot_number: Optional[str] = None
    area: Optional[float] = None
    land_type: Optional[str] = "Agricultural"
    registration_number: Optional[str] = None
    mutation_number: Optional[str] = None
    document_date: Optional[str] = None
    field_confidences: Dict[str, float] = {}

class OCRProcessingResult(BaseModel):
    document_id: int
    extracted_text: str
    fields: OCRFieldExtraction
    overall_ocr_confidence: float
    validation_score: float
    duplicate_score: float
    overall_confidence: float
    status: str
    validation_issues: List[Dict[str, Any]] = []
    duplicate_candidates: List[Dict[str, Any]] = []
    record_id: Optional[int] = None
