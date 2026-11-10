"""Customer repository for direct database queries."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()

    def get_by_name(self, name: str) -> Optional[Customer]:
        clean_name = name.strip()
        # Case-insensitive match
        return self.db.query(Customer).filter(
            func.lower(Customer.name) == clean_name.lower()
        ).first()

    def get_or_create(self, name: str, phone: Optional[str] = None) -> Customer:
        clean_name = name.strip()
        customer = self.get_by_name(clean_name)
        if not customer:
            customer = Customer(
                name=clean_name,
                phone=phone.strip() if phone else None,
                current_balance_paise=0
            )
            self.db.add(customer)
            self.db.flush()
        return customer

    def search(self, query: str, limit: int = 50, offset: int = 0) -> List[Customer]:
        search_term = f"%{query.strip().lower()}%"
        return self.db.query(Customer).filter(
            func.lower(Customer.name).like(search_term) |
            func.lower(Customer.phone).like(search_term)
        ).order_by(Customer.name.asc()).limit(limit).offset(offset).all()

    def list_customers(
        self,
        limit: int = 100,
        offset: int = 0,
        has_balance_only: bool = False
    ) -> List[Customer]:
        q = self.db.query(Customer)
        if has_balance_only:
            q = q.filter(Customer.current_balance_paise != 0)
        return q.order_by(Customer.current_balance_paise.desc(), Customer.name.asc()).limit(limit).offset(offset).all()

    def count_total(self) -> int:
        return self.db.query(func.count(Customer.id)).scalar() or 0

    def count_active_credit(self) -> int:
        return self.db.query(func.count(Customer.id)).filter(Customer.current_balance_paise > 0).scalar() or 0

    def recalculate_balance(self, customer_id: int) -> int:
        """
        Calculates exact ledger balance strictly from transactions:
        Balance = sum(CREDIT) - sum(PAYMENT)
        """
        credit_sum = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(
                Transaction.customer_id == customer_id,
                Transaction.transaction_type == TransactionType.CREDIT
            )
            .scalar()
        )
        payment_sum = (
            self.db.query(func.coalesce(func.sum(Transaction.amount_paise), 0))
            .filter(
                Transaction.customer_id == customer_id,
                Transaction.transaction_type == TransactionType.PAYMENT
            )
            .scalar()
        )
        calculated_balance = credit_sum - payment_sum
        customer = self.get_by_id(customer_id)
        if customer:
            customer.current_balance_paise = calculated_balance
            self.db.flush()
        return calculated_balance
