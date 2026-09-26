from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False) # e.g. UPLOAD_DOCUMENT, APPROVE_RECORD, REJECT_RECORD, UPDATE_FIELDS, CONFIRM_DUPLICATE
    record_id = Column(Integer, ForeignKey("land_records.id"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(Text, nullable=True) # JSON details of the modification or review reason

    user = relationship("User", back_populates="audit_logs")
    record = relationship("LandRecord", back_populates="audit_logs")
