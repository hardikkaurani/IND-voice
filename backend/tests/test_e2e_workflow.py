"""End-to-end integration test of the full speech-to-ledger workflow."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


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
