"""Customer API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.customer_service import CustomerService
from backend.app.services.ledger_service import LedgerService
from backend.app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from backend.app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db)


def get_ledger_service(db: Session = Depends(get_db)) -> LedgerService:
    return LedgerService(db)


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    query: Optional[str] = Query(None, description="Search by customer name or phone"),
    has_balance_only: bool = Query(False, description="Filter customers with outstanding balances only"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: CustomerService = Depends(get_customer_service)
):
    """Lists and searches customers with real-time balance calculations."""
    return service.list_customers(
        query=query,
        limit=limit,
        offset=offset,
        has_balance_only=has_balance_only
    )


@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    service: CustomerService = Depends(get_customer_service)
):
    """Creates a new customer."""
    return service.create_customer(data)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int = Path(..., ge=1),
    service: CustomerService = Depends(get_customer_service)
):
    """Retrieves customer details and balance."""
    return service.get_customer(customer_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int = Path(..., ge=1),
    data: CustomerUpdate = ...,
    service: CustomerService = Depends(get_customer_service)
):
    """Updates customer details."""
    return service.update_customer(customer_id, data)


@router.get("/{customer_id}/transactions", response_model=List[TransactionResponse])
def get_customer_transactions(
    customer_id: int = Path(..., ge=1),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ledger: LedgerService = Depends(get_ledger_service)
):
    """Retrieves complete ledger statement history for a customer."""
    return ledger.get_customer_transactions(customer_id, limit=limit, offset=offset)
