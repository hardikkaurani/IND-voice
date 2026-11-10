"""Transaction repository for ledger database queries."""
from datetime import datetime, timezone, time
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction, TransactionType


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, transaction_id: int) -> Optional[Transaction]:
        return self.db.query(Transaction).filter(Transaction.id == transaction_id).first()

    def get_by_idempotency_key(self, key: str) -> Optional[Transaction]:
        if not key:
            return None
        return self.db.query(Transaction).filter(Transaction.idempotency_key == key).first()

    def create(self, transaction: Transaction) -> Transaction:
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def list_by_customer(
        self,
        customer_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[Transaction]:
        return (
            self.db.query(Transaction)
            .filter(Transaction.customer_id == customer_id)
            .order_by(Transaction.created_at.desc(), Transaction.id.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def list_recent(self, limit: int = 20) -> List[Transaction]:
        return (
            self.db.query(Transaction)
            .order_by(Transaction.created_at.desc(), Transaction.id.desc())
            .limit(limit)
            .all()
        )

    def get_today_metrics(self) -> Tuple[int, int]:
        """
        Returns (today_credit_paise, today_payment_paise) for the current UTC day.
        """
        now = datetime.now(timezone.utc)
        start_of_day = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
        
        today_credit = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(
                Transaction.transaction_type == TransactionType.CREDIT,
                Transaction.created_at >= start_of_day
            )
            .scalar()
        )
        today_payment = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(
                Transaction.transaction_type == TransactionType.PAYMENT,
                Transaction.created_at >= start_of_day
            )
            .scalar()
        )
        return today_credit, today_payment

    def get_total_outstanding(self) -> int:
        """
        Returns total credit outstanding across all customers:
        sum(CREDIT) - sum(PAYMENT)
        """
        total_credit = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(Transaction.transaction_type == TransactionType.CREDIT)
            .scalar()
        )
        total_payment = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(Transaction.transaction_type == TransactionType.PAYMENT)
            .scalar()
        )
        return total_credit - total_payment
