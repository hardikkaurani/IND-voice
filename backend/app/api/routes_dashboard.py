"""Dashboard metrics API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(service: DashboardService = Depends(get_dashboard_service)):
    """
    Returns high-level business intelligence:
    - Total outstanding balance
    - Today's credit & payment totals
    - Active customer counts
    - Top debtor accounts
    - Recent transactions
    """
    return service.get_summary()
