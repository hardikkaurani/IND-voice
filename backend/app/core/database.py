"""Database engine, session management and Base."""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logging import logger

database_url = settings.DATABASE_URL

# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility (Render standard)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

# Enable SQLite foreign keys and WAL mode for reliability and concurrency
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
