from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="image/jpeg")
    upload_date = Column(DateTime, default=datetime.utcnow)
    OCR_status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    processing_status = Column(String(50), default="UPLOADED") # UPLOADED, OCR_DONE, EXTRACTED, VALIDATED, COMPLETED
    extracted_text = Column(Text, nullable=True)
    language = Column(String(50), default="en")

    land_records = relationship("LandRecord", back_populates="source_doc")
