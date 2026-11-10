"""Dashboard analytics and metrics service."""
from sqlalchemy.orm import Session
from app.repositories.customer_repo import CustomerRepository
from app.repositories.transaction_repo import TransactionRepository
from app.services.customer_service import CustomerService
from app.services.ledger_service import LedgerService
from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.customer_repo = CustomerRepository(db)
        self.tx_repo = TransactionRepository(db)
        self.customer_service = CustomerService(db)
        self.ledger_service = LedgerService(db)

    def get_summary(self) -> DashboardSummaryResponse:
        total_outstanding = self.tx_repo.get_total_outstanding()
        today_credit, today_payment = self.tx_repo.get_today_metrics()
        total_customers = self.customer_repo.count_total()
        active_credit = self.customer_repo.count_active_credit()

        recent_txs = self.ledger_service.get_recent_transactions(limit=10)
        top_debtors = self.customer_service.list_customers(limit=5, has_balance_only=True)

        return DashboardSummaryResponse(
            total_outstanding_paise=total_outstanding,
            total_outstanding_rupees=round(total_outstanding / 100.0, 2),
            today_credit_paise=today_credit,
            today_credit_rupees=round(today_credit / 100.0, 2),
            today_payment_paise=today_payment,
            today_payment_rupees=round(today_payment / 100.0, 2),
            total_customers=total_customers,
            active_credit_customers=active_credit,
            recent_transactions=recent_txs,
            top_debtors=top_debtors
        )
