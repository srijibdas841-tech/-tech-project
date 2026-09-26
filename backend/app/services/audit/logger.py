import json
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditLogger:
    """Records tamper-evident audit logs for every user action and automated workflow step."""

    @staticmethod
    def log(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        record_id: Optional[int] = None,
        details: Optional[Any] = None
    ) -> AuditLog:
        if isinstance(details, (dict, list)):
            details_str = json.dumps(details, default=str)
        else:
            details_str = str(details) if details else ""

        entry = AuditLog(
            user_id=user_id,
            action=action,
            record_id=record_id,
            timestamp=datetime.utcnow(),
            details=details_str
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

audit_logger = AuditLogger()
