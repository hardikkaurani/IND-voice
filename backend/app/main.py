"""IND-voice FastAPI Application Entrypoint with Security Headers and Observability."""
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import logger
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing IND-voice database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("IND-voice backend service started successfully.")
    yield
    logger.info("IND-voice backend service shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Voice-First Business Ledger and Intelligence Platform for Indian Small Merchants.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_and_latency_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Security audit headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


app.include_router(api_router)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


@app.get("/", tags=["System"])
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Bol Kar Likho — Voice-First Business Ledger",
        "docs": "/docs",
        "health": "/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again."}
    )
