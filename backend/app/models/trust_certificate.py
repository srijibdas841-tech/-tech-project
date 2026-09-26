from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class TrustCertificate(Base):
    __tablename__ = "trust_certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, index=True, nullable=False)
    record_id = Column(Integer, ForeignKey("land_records.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Trust status: VERIFIED, VERIFIED_WITH_CONDITIONS, REQUIRES_FURTHER_VERIFICATION
    trust_status = Column(String(50), nullable=False, index=True)
    trust_score = Column(Float, default=0.0)
    
    # Snapshot of verified cadastral property attributes at time of issue
    owner_name = Column(String(200), nullable=False)
    father_or_guardian_name = Column(String(200), nullable=True)
    plot_number = Column(String(50), nullable=True)
    survey_number = Column(String(50), nullable=False)
    khatian_number = Column(String(50), nullable=True)
    area = Column(Float, nullable=False)
    land_type = Column(String(50), default="Agricultural")
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    registration_number = Column(String(100), nullable=True)
    mutation_number = Column(String(100), nullable=True)
    
    # GIS location snapshot
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gis_boundary_type = Column(String(50), default="POLYGON")
    gis_polygon = Column(Text, nullable=True)
    google_maps_url = Column(String(500), nullable=True)
    
    # Intelligence assessment scores snapshot
    OCR_confidence = Column(Float, default=0.0)
    validation_score = Column(Float, default=0.0)
    duplicate_score = Column(Float, default=0.0)
    record_status = Column(String(50), default="VERIFIED")
    
    # Verification summary and advisory notes (stored as JSON text)
    verification_summary = Column(Text, nullable=True)
    buyer_advisories = Column(Text, nullable=True)
    qr_data = Column(Text, nullable=True)
    
    # Issuance metadata
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_by_name = Column(String(200), default="Government Land Revenue Officer")
    issued_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=365))

    # Relationships
    land_record = relationship("LandRecord", back_populates="trust_certificates")
    issuer = relationship("User")
