"""Tests for Financial Ledger and Balance Calculation Invariants."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.core.database import Base
from app.models.transaction import TransactionType
from app.services.ledger_service import LedgerService
from app.schemas.transaction import TransactionConfirmRequest


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_credit_transaction_updates_balance(test_db):
    ledger = LedgerService(test_db)
    
    # 1. First credit: 500 rupees (50000 paise) to Rahul
    res1 = ledger.record_transaction(
        customer_id=None,
        customer_name="Rahul",
        transaction_type=TransactionType.CREDIT,
        amount_paise=50000,
        description="Kirana groceries on credit"
    )
    assert res1.customer_id is not None
    assert res1.amount_paise == 50000
    assert res1.amount_rupees == 500.0

    customer = ledger.customer_repo.get_by_id(res1.customer_id)
    assert customer.current_balance_paise == 50000


def test_payment_transaction_reduces_balance(test_db):
    ledger = LedgerService(test_db)
    
    # Credit of 50000 paise
    res1 = ledger.record_transaction(
        customer_id=None,
        customer_name="Amit",
        transaction_type=TransactionType.CREDIT,
        amount_paise=50000
    )
    # Payment of 20000 paise
    res2 = ledger.record_transaction(
        customer_id=res1.customer_id,
        customer_name=None,
        transaction_type=TransactionType.PAYMENT,
        amount_paise=20000
    )
    assert res2.amount_paise == 20000

    customer = ledger.customer_repo.get_by_id(res1.customer_id)
    # 50000 - 20000 = 30000 paise
    assert customer.current_balance_paise == 30000
    # Recalculate directly from all transactions
    recalculated = ledger.customer_repo.recalculate_balance(customer.id)
    assert recalculated == 30000


def test_overpayment_leads_to_negative_balance(test_db):
    ledger = LedgerService(test_db)
    
    # Credit of 20000 paise
    res1 = ledger.record_transaction(
        customer_id=None,
        customer_name="Deepak",
        transaction_type=TransactionType.CREDIT,
        amount_paise=20000
    )
    # Payment of 30000 paise (advance)
    ledger.record_transaction(
        customer_id=res1.customer_id,
        customer_name=None,
        transaction_type=TransactionType.PAYMENT,
        amount_paise=30000
    )
    customer = ledger.customer_repo.get_by_id(res1.customer_id)
    # 20000 - 30000 = -10000 paise (Customer has 100 Rs advance)
    assert customer.current_balance_paise == -10000


def test_invalid_zero_or_negative_amount_raises_error(test_db):
    ledger = LedgerService(test_db)
    
    with pytest.raises(HTTPException) as exc_info:
        ledger.record_transaction(
            customer_id=None,
            customer_name="Test User",
            transaction_type=TransactionType.CREDIT,
            amount_paise=0
        )
    assert exc_info.value.status_code == 422


def test_duplicate_submission_prevented_by_idempotency_key(test_db):
    ledger = LedgerService(test_db)
    
    idempotency_key = "unique-tx-12345"
    
    res1 = ledger.record_transaction(
        customer_id=None,
        customer_name="Suresh",
        transaction_type=TransactionType.CREDIT,
        amount_paise=10000,
        idempotency_key=idempotency_key
    )
    # Same request submitted again
    res2 = ledger.record_transaction(
        customer_id=None,
        customer_name="Suresh",
        transaction_type=TransactionType.CREDIT,
        amount_paise=10000,
        idempotency_key=idempotency_key
    )
    assert res1.id == res2.id
    customer = ledger.customer_repo.get_by_id(res1.customer_id)
    # Balance should only have been added ONCE (10000 paise), not twice
    assert customer.current_balance_paise == 10000
