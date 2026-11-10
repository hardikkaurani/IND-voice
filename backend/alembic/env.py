import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import Base, normalize_database_url
import app.models.customer  # noqa: F401
import app.models.transaction  # noqa: F401
import app.models.audit  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata

# Use the URL passed to Alembic Config (e.g. CLI or test suite), or fallback to settings.DATABASE_URL
cmd_url = config.get_main_option("sqlalchemy.url")
if not cmd_url or "driver://user:pass@localhost/dbname" in cmd_url:
    db_url = normalize_database_url(settings.DATABASE_URL)
    config.set_main_option("sqlalchemy.url", db_url)
else:
    db_url = normalize_database_url(cmd_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = db_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = db_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
