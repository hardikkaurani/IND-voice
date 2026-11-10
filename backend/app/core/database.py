"""Database engine, session management, URL normalization, and health check."""
from typing import Tuple, Optional
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logging import logger


def normalize_database_url(url: str) -> str:
    """
    Normalizes database connection string for SQLAlchemy compatibility.
    Converts legacy 'postgres://' or 'postgresql://' to 'postgresql+psycopg2://'
    ensuring SQLAlchemy unambiguously binds to the installed psycopg2 driver.
    """
    if not url:
        return "sqlite:///./ind_voice.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


database_url = normalize_database_url(settings.DATABASE_URL)

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False
}

if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL pool configuration optimized for Neon & Render
    # Conservative limits to prevent connection exhaustion on serverless / pgBouncer tiers
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["pool_recycle"] = 180
    engine_kwargs["pool_timeout"] = 30

engine = create_engine(database_url, **engine_kwargs)

# Enable SQLite foreign keys and WAL mode when running SQLite
if database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides an atomic database session per request."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session exception: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def check_database_health() -> Tuple[bool, str, Optional[str]]:
    """
    Executes a lightweight query (SELECT 1) to verify database connectivity.
    Returns: (is_healthy, driver_name, error_message)
    """
    driver_name = "sqlite" if database_url.startswith("sqlite") else "postgresql"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, driver_name, None
    except Exception as exc:
        logger.error(f"Database health check failed ({driver_name}): {exc}")
        return False, driver_name, str(exc)
