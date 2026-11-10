"""Customer ORM Model."""
from sqlalchemy import Column, Integer, String, BigInteger, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(30), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Financial integrity: Balance is strictly represented as integer paise.
    # Outstanding balance = Sum(CREDIT) - Sum(PAYMENT)
    # Positive: customer owes merchant
    # Negative: advance paid by customer
    current_balance_paise = Column(BigInteger, default=0, nullable=False)

    transactions = relationship(
        "Transaction",
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="desc(Transaction.created_at)"
    )

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}', balance_paise={self.current_balance_paise})>"
