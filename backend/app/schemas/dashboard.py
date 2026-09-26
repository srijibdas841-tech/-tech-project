from typing import List, Dict, Any
from pydantic import BaseModel

class StatMetric(BaseModel):
    title: str
    value: Any
    subtext: str
    trend: str = "neutral"

class DashboardStats(BaseModel):
    total_records: int
    processed_documents: int
    verified_records: int
    pending_review: int
    duplicate_candidates: int
    validation_errors: int
    avg_ocr_confidence: float

class StatusDistribution(BaseModel):
    name: str
    count: int
    color: str

class MonthlyDigitization(BaseModel):
    month: str
    count: int
    verified: int

class DashboardData(BaseModel):
    stats: DashboardStats
    status_distribution: List[StatusDistribution]
    monthly_trend: List[MonthlyDigitization]
    confidence_distribution: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
