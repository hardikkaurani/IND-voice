"""Customer Service."""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.customer import Customer
from app.repositories.customer_repo import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CustomerRepository(db)

    def _to_response(self, customer: Customer) -> CustomerResponse:
        return CustomerResponse(
            id=customer.id,
            name=customer.name,
            phone=customer.phone,
            notes=customer.notes,
            current_balance_paise=customer.current_balance_paise,
            current_balance_rupees=round(customer.current_balance_paise / 100.0, 2),
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )

    def get_customer(self, customer_id: int) -> CustomerResponse:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found."
            )
        return self._to_response(customer)

    def list_customers(
        self,
        query: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        has_balance_only: bool = False
    ) -> List[CustomerResponse]:
        if query and query.strip():
            customers = self.repo.search(query.strip(), limit=limit, offset=offset)
        else:
            customers = self.repo.list_customers(limit=limit, offset=offset, has_balance_only=has_balance_only)
        return [self._to_response(c) for c in customers]

    def create_customer(self, data: CustomerCreate) -> CustomerResponse:
        existing = self.repo.get_by_name(data.name)
        if existing:
            return self._to_response(existing)
        
        customer = Customer(
            name=data.name.strip(),
            phone=data.phone.strip() if data.phone else None,
            notes=data.notes,
            current_balance_paise=0
        )
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return self._to_response(customer)

    def update_customer(self, customer_id: int, data: CustomerUpdate) -> CustomerResponse:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found."
            )
        if data.name is not None and data.name.strip():
            customer.name = data.name.strip()
        if data.phone is not None:
            customer.phone = data.phone.strip() if data.phone else None
        if data.notes is not None:
            customer.notes = data.notes
        
        self.db.commit()
        self.db.refresh(customer)
        return self._to_response(customer)
