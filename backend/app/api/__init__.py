"""API router aggregation."""
from fastapi import APIRouter
from backend.app.api.routes_voice import router as voice_router
from backend.app.api.routes_transactions import router as transactions_router
from backend.app.api.routes_customers import router as customers_router
from backend.app.api.routes_dashboard import router as dashboard_router

api_router = APIRouter(prefix="/api")
api_router.include_router(voice_router)
api_router.include_router(transactions_router)
api_router.include_router(customers_router)
api_router.include_router(dashboard_router)
