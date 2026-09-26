from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.schemas.auth import UserOut, UserCreate
from app.auth.security import get_password_hash
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserOut)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User successfully deleted"}

@router.get("/failures")
def get_processing_failures(db: Session = Depends(get_db)):
    """Returns documents that encountered OCR or pipeline processing failures or warnings."""
    failed_docs = db.query(Document).filter(
        Document.OCR_status.in_(["FAILED", "WARNING"])
    ).all()
    return failed_docs
