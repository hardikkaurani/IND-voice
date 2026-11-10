"""Tests for PostgreSQL compatibility, URL normalization, health checks, and Alembic migrations."""
import os
import pytest
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command
from app.core.database import normalize_database_url, check_database_health


def test_normalize_database_url():
    # 1. Render legacy postgres:// prefix
    render_url = "postgres://user:secret@dpg-abc123-a:5432/ind_voice"
    normalized = normalize_database_url(render_url)
    assert normalized == "postgresql+psycopg2://user:secret@dpg-abc123-a:5432/ind_voice"

    # 2. Modern postgresql:// prefix
    pg_url = "postgresql://user:secret@localhost:5432/ind_voice"
    assert normalize_database_url(pg_url) == "postgresql+psycopg2://user:secret@localhost:5432/ind_voice"

    # 3. Explicit postgresql+psycopg2:// remains unchanged
    psycopg_url = "postgresql+psycopg2://user:secret@localhost:5432/ind_voice"
    assert normalize_database_url(psycopg_url) == psycopg_url

    # 4. Empty or None fallback
    assert normalize_database_url("") == "sqlite:///./ind_voice.db"

    # 5. SQLite remains unchanged
    sqlite_url = "sqlite:///./test.db"
    assert normalize_database_url(sqlite_url) == sqlite_url


def test_database_health_check():
    is_healthy, driver, error_msg = check_database_health()
    assert is_healthy is True
    assert driver in ("sqlite", "postgresql")
    assert error_msg is None


def test_health_check_returns_503_when_database_fails(monkeypatch):
    """Verifies that /health returns HTTP 503 with degraded status when database fails."""
    from fastapi.testclient import TestClient
    from app.main import app

    monkeypatch.setattr(
        "app.main.check_database_health",
        lambda: (False, "postgresql", "OperationalError: could not connect to server: Connection refused")
    )

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"]["status"] == "disconnected"
    assert data["database"]["driver"] == "postgresql"
    assert "Connection refused" in data["database"]["error"]


def test_alembic_migration_from_clean_database(tmp_path):
    """
    Verifies that Alembic can run 'upgrade head' on a completely clean database,
    creating all tables, and then clean rollback with 'downgrade base'.
    """
    test_db_file = tmp_path / "alembic_test.db"
    db_url = f"sqlite:///{test_db_file}"

    # Prepare Alembic configuration pointing to clean database
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ini_path = os.path.join(backend_dir, "alembic.ini")
    
    alembic_cfg = Config(ini_path)
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))

    # 1. Run upgrade head
    command.upgrade(alembic_cfg, "head")

    # 2. Inspect created tables
    engine = create_engine(db_url)
    with engine.connect() as conn:
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
        table_names = [t[0] for t in tables]
        assert "customers" in table_names
        assert "transactions" in table_names
        assert "audit_logs" in table_names
        assert "alembic_version" in table_names

    # 3. Test downgrade base
    command.downgrade(alembic_cfg, "base")
    with engine.connect() as conn:
        tables_after = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name != 'alembic_version';")).fetchall()
        assert len(tables_after) == 0

