"""End-to-end integration test of the full speech-to-ledger workflow."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.core.database import Base, get_db
import app.models.customer  # noqa: F401
import app.models.transaction  # noqa: F401
import app.models.audit  # noqa: F401


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


def test_full_ledger_workflow(client):
    # Step 1: Parse first speech statement (Credit)
    parse_res = client.post("/api/transactions/parse?transcript=Rahul%20ko%20paanch%20sau%20rupaye%20udhaar%20diye.")
    assert parse_res.status_code == 200
    extracted = parse_res.json()
    assert extracted["customer_name"] == "Rahul"
    assert extracted["amount_paise"] == 50000
    assert extracted["transaction_type"] == "CREDIT"

    # Step 2: Explicit human confirmation of transaction
    confirm_payload = {
        "customer_name": extracted["customer_name"],
        "transaction_type": extracted["transaction_type"],
        "amount_paise": extracted["amount_paise"],
        "description": "Kirana credit for Rahul",
        "raw_transcript": extracted["original_transcript"],
        "idempotency_key": "e2e-test-1"
    }
    confirm_res = client.post("/api/transactions/confirm", json=confirm_payload)
    assert confirm_res.status_code == 200
    tx_data = confirm_res.json()
    assert tx_data["transaction"]["amount_rupees"] == 500.0
    assert tx_data["transaction"]["customer_name"] == "Rahul"
    assert tx_data["customer_balance_rupees"] >= 500.0

    # Step 3: Parse second speech statement (Payment)
    parse_res_2 = client.post("/api/transactions/parse?transcript=Rahul%20ne%20do%20sau%20rupaye%20wapas%20kiye.")
    assert parse_res_2.status_code == 200
    extracted_2 = parse_res_2.json()
    assert extracted_2["customer_name"] == "Rahul"
    assert extracted_2["amount_paise"] == 20000
    assert extracted_2["transaction_type"] == "PAYMENT"

    # Step 4: Confirm payment
    confirm_payload_2 = {
        "customer_name": extracted_2["customer_name"],
        "transaction_type": extracted_2["transaction_type"],
        "amount_paise": extracted_2["amount_paise"],
        "description": "Cash return from Rahul",
        "raw_transcript": extracted_2["original_transcript"],
        "idempotency_key": "e2e-test-2"
    }
    confirm_res_2 = client.post("/api/transactions/confirm", json=confirm_payload_2)
    assert confirm_res_2.status_code == 200

    # Step 5: Verify dashboard metrics reflect the updates
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_customers"] >= 1
    assert len(dash_data["recent_transactions"]) >= 2
