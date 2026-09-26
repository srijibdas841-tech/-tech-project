import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings, BASE_DIR

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None

def init_db_engine():
    global engine, SessionLocal
    db_url = settings.DATABASE_URL
    try:
        # Attempt PostgreSQL or configured DB
        if db_url.startswith("postgresql"):
            logger.info("Attempting connection to PostgreSQL...")
            test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with test_engine.connect():
                logger.info("Successfully connected to PostgreSQL database!")
                engine = test_engine
        else:
            engine = create_engine(
                db_url, 
                connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
            )
    except Exception as e:
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to local SQLite database for uninterrupted operation."
        )
        sqlite_path = (BASE_DIR / "land_records.db").resolve()
        sqlite_url = f"sqlite:///{sqlite_path.as_posix()}"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        logger.info(f"Initialized fallback database at {sqlite_url}")

    if engine is None:
        sqlite_path = (BASE_DIR / "land_records.db").resolve()
        engine = create_engine(f"sqlite:///{sqlite_path.as_posix()}", connect_args={"check_same_thread": False})

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

init_db_engine()

def get_db():
    if SessionLocal is None:
        init_db_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
