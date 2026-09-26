from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True)
    owner_name = Column(String(200), index=True, nullable=False)
    father_or_guardian_name = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    district = Column(String(100), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    village = Column(String(100), index=True, nullable=False)
    survey_number = Column(String(50), index=True, nullable=False)
    plot_number = Column(String(50), index=True, nullable=True)
    area = Column(Float, nullable=False)  # Area in acres
    land_type = Column(String(50), default="Agricultural")
    registration_number = Column(String(100), index=True, nullable=True)
    mutation_number = Column(String(100), index=True, nullable=True)
    document_date = Column(String(50), nullable=True)
    
    # GIS & Cadastral Spatial Data
    khatian_number = Column(String(50), index=True, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gis_polygon = Column(Text, nullable=True)  # JSON-encoded array of [lat, lng] vertices
    gis_boundary_type = Column(String(50), default="POLYGON")
    
    # Source Document Link
    source_document = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Quality & Intelligence Scores (0.0 to 100.0)
    OCR_confidence = Column(Float, default=0.0)
    validation_score = Column(Float, default=0.0)
    duplicate_score = Column(Float, default=0.0)
    
    # Status: VERIFIED, PENDING_REVIEW, DUPLICATE, REJECTED
    status = Column(String(50), default="PENDING_REVIEW", index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source_doc = relationship("Document", back_populates="land_records")
    validation_results = relationship("ValidationResult", back_populates="land_record", cascade="all, delete-orphan")
    duplicate_candidates = relationship(
        "DuplicateCandidate", 
        foreign_keys="[DuplicateCandidate.record_id]", 
        back_populates="record", 
        cascade="all, delete-orphan"
    )
    audit_logs = relationship("AuditLog", back_populates="record", cascade="all, delete-orphan")
    trust_certificates = relationship("TrustCertificate", back_populates="land_record", cascade="all, delete-orphan")

