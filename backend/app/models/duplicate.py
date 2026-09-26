from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False, index=True)
    matched_record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False) # e.g. 92.5
    matching_fields = Column(Text, nullable=False) # JSON encoded or comma-separated field list
    # Status: POTENTIAL_DUPLICATE, CONFIRMED_DUPLICATE, RESOLVED_NOT_DUPLICATE
    status = Column(String(50), default="POTENTIAL_DUPLICATE", index=True)
    reviewer_comment = Column(Text, nullable=True)

    record = relationship("LandRecord", foreign_keys=[record_id], back_populates="duplicate_candidates")
    matched_record = relationship("LandRecord", foreign_keys=[matched_record_id])
