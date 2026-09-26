from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    extracted_value = Column(String(255), nullable=True)
    # Status: VALID, MISMATCH, CONFLICT, INVALID, WARNING
    validation_status = Column(String(50), nullable=False, default="VALID")
    confidence = Column(Float, default=100.0)
    validation_message = Column(Text, nullable=True)

    land_record = relationship("LandRecord", back_populates="validation_results")
