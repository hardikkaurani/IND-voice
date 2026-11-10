"""Structured Logging Configuration."""
import logging
import sys
from app.core.config import settings

def setup_logging():
    log_format = "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    logging.basicConfig(
        level=level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Silence noisy external libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    return logging.getLogger("ind_voice")

logger = setup_logging()
