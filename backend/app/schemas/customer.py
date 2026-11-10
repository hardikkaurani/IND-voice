"""Customer Pydantic Schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Customer name")
    phone: Optional[str] = Field(None, max_length=30, description="Optional phone number")
    notes: Optional[str] = Field(None, description="Optional notes")


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    phone: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    current_balance_paise: int = Field(
        ...,
        description="Outstanding balance in paise (Sum(CREDIT) - Sum(PAYMENT))"
    )
    current_balance_rupees: float = Field(
        ...,
        description="Formatted balance in rupees"
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
