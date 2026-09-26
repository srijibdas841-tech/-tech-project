from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.records import router as records_router
from app.api.duplicates import router as duplicates_router
from app.api.review import router as review_router
from app.api.dashboard import router as dashboard_router
from app.api.audit import router as audit_router
from app.api.admin import router as admin_router
from app.api.certificates import router as certificates_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(records_router)
api_router.include_router(duplicates_router)
api_router.include_router(review_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_router)
api_router.include_router(admin_router)
api_router.include_router(certificates_router)

