"""Tests for Transaction Intelligence speech parsing."""
import pytest
from backend.app.services.intelligence_service import TransactionIntelligenceService
from backend.app.models.transaction import TransactionType


@pytest.fixture
def parser():
    return TransactionIntelligenceService()


@pytest.mark.asyncio
async def test_example_1_rahul_credit(parser):
    text = "Rahul ko paanch sau rupaye udhaar diye."
    extracted = await parser.extract_transaction(text)
    
    assert extracted.customer_name == "Rahul"
    assert extracted.amount_paise == 50000
    assert extracted.amount_rupees == 500.0
    assert extracted.transaction_type == TransactionType.CREDIT
    assert extracted.needs_clarification is False


@pytest.mark.asyncio
async def test_example_2_amit_payment(parser):
    text = "Amit ne do sau rupaye wapas kiye."
    extracted = await parser.extract_transaction(text)
    
    assert extracted.customer_name == "Amit"
    assert extracted.amount_paise == 20000
    assert extracted.amount_rupees == 200.0
    assert extracted.transaction_type == TransactionType.PAYMENT
    assert extracted.needs_clarification is False


@pytest.mark.asyncio
async def test_digits_and_marathi_hinglish(parser):
    text = "Suresh ne 1500 rupaye jama kiye"
    extracted = await parser.extract_transaction(text)
    
    assert extracted.customer_name == "Suresh"
    assert extracted.amount_paise == 150000
    assert extracted.amount_rupees == 1500.0
    assert extracted.transaction_type == TransactionType.PAYMENT


@pytest.mark.asyncio
async def test_ambiguous_missing_amount_requests_clarification(parser):
    text = "Rahul ko udhaar diya"
    extracted = await parser.extract_transaction(text)
    
    assert extracted.needs_clarification is True
    assert "amount" in extracted.clarification_reason.lower()


@pytest.mark.asyncio
async def test_ambiguous_missing_direction_requests_clarification(parser):
    text = "Rahul ko paanch sau rupaye"
    extracted = await parser.extract_transaction(text)
    
    assert extracted.needs_clarification is True
    assert "direction" in extracted.clarification_reason.lower()
