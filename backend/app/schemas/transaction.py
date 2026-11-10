"""Transaction Pydantic Schemas."""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.transaction import TransactionType, TransactionSource


class TransactionBase(BaseModel):
    transaction_type: TransactionType = Field(..., description="CREDIT or PAYMENT")
    amount_paise: int = Field(..., gt=0, description="Monetary value in integer paise")
    currency: str = Field(default="INR", max_length=10)
    description: Optional[str] = Field(None, max_length=255)
    source: TransactionSource = Field(default=TransactionSource.MANUAL)
    raw_transcript: Optional[str] = None
    confidence_score: Optional[float] = None
    detected_language: Optional[str] = None
    idempotency_key: Optional[str] = None


class TransactionCreate(BaseModel):
    customer_id: Optional[int] = Field(None, description="Existing customer ID")
    customer_name: Optional[str] = Field(None, min_length=1, max_length=150, description="Customer name if ID not known")
    transaction_type: TransactionType
    amount_paise: int = Field(..., gt=0, description="Monetary value in integer paise")
    description: Optional[str] = None
    source: TransactionSource = TransactionSource.MANUAL
    raw_transcript: Optional[str] = None
    confidence_score: Optional[float] = None
    detected_language: Optional[str] = None
    idempotency_key: Optional[str] = None

    @field_validator("customer_name")
    @classmethod
    def validate_customer_target(cls, v, info):
        # Either customer_id or customer_name must be present
        return v.strip() if v else v


class TransactionConfirmRequest(BaseModel):
    """Explicit human confirmation payload before committing to ledger."""
    customer_name: str = Field(..., min_length=1)
    customer_id: Optional[int] = None
    transaction_type: TransactionType
    amount_paise: int = Field(..., gt=0)
    description: Optional[str] = None
    raw_transcript: Optional[str] = None
    detected_language: Optional[str] = None
    idempotency_key: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    amount_rupees: float = Field(..., description="Amount formatted in rupees")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
