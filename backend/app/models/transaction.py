"""Transaction ORM Model."""
import enum
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Text,
    Float,
    ForeignKey,
    Enum as SQLEnum,
    CheckConstraint,
    Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin


class TransactionType(str, enum.Enum):
    CREDIT = "CREDIT"    # Udhaar diya (Customer debt increases)
    PAYMENT = "PAYMENT"  # Jama kiya / Wapas kiya (Customer debt decreases)


class TransactionSource(str, enum.Enum):
    VOICE = "VOICE"
    MANUAL = "MANUAL"


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    
    # Financial integrity: Amount strictly in integer paise (> 0)
    amount_paise = Column(BigInteger, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    
    description = Column(String(255), nullable=True)
    source = Column(SQLEnum(TransactionSource), default=TransactionSource.VOICE, nullable=False)
    
    # AI & Observability audit trail
    raw_transcript = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    detected_language = Column(String(20), nullable=True)
    
    # Duplicate prevention (Idempotency key)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)

    customer = relationship("Customer", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("amount_paise > 0", name="check_positive_amount"),
        Index("idx_transactions_customer_created", "customer_id", "created_at"),
    )

    def __repr__(self):
        return (
            f"<Transaction(id={self.id}, customer_id={self.customer_id}, "
            f"type='{self.transaction_type}', amount_paise={self.amount_paise})>"
        )
