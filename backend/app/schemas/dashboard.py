"""Dashboard metrics schemas."""
from typing import List
from pydantic import BaseModel
from backend.app.schemas.customer import CustomerResponse
from backend.app.schemas.transaction import TransactionResponse


class DashboardSummaryResponse(BaseModel):
    total_outstanding_paise: int
    total_outstanding_rupees: float
    today_credit_paise: int
    today_credit_rupees: float
    today_payment_paise: int
    today_payment_rupees: float
    total_customers: int
    active_credit_customers: int
    recent_transactions: List[TransactionResponse]
    top_debtors: List[CustomerResponse]
