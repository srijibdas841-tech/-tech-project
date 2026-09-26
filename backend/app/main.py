import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings, BASE_DIR
from app.database.base import Base
from app.database.session import init_db_engine, SessionLocal
from app.api.api_v1 import api_router
from app.utils.seeder import seed_database, seed_trust_certificates
from app.utils.create_samples import generate_all_samples
from app.utils.gis_data import migrate_and_seed_gis

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sih.landrecords")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} (ID: {settings.PROJECT_ID})...")
    engine = init_db_engine()
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas and indexes created/verified.")

    # Generate sample deeds
    try:
        generate_all_samples()
    except Exception as e:
        logger.warning(f"Could not generate sample deeds: {e}")

    # Seed data
    db = SessionLocal()
    try:
        seed_database(db)
        migrate_and_seed_gis(db)
        seed_trust_certificates(db)
    except Exception as e:
        logger.error(f"Error seeding database, GIS spatial data, or certificates: {e}")
    finally:
        db.close()

    logger.info("Application ready to accept requests!")
    yield
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title=f"{settings.PROJECT_NAME} ({settings.PROJECT_ID})",
    description="Smart India Hackathon 2026 Prototype - AI-Powered Land Record Digitization, Validation & Duplicate Detection System. Built by Team #TECH.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads & sample deeds
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/sample_documents", StaticFiles(directory=str(settings.SAMPLE_DIR)), name="sample_documents")

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve Frontend SPA from frontend/dist if built
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    logger.info(f"Mounting frontend SPA from {FRONTEND_DIST}")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend_assets")

    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_frontend_spa(full_path: str):
        # Allow docs, redoc, openapi
        if full_path in ["docs", "redoc", "openapi.json"] or full_path.startswith("api/"):
            return None
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.exists() and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "problem_statement_id": settings.PROJECT_ID,
            "team": settings.TEAM_NAME,
            "status": "ONLINE",
            "api_docs": "/docs",
            "version": "1.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
