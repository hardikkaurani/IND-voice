"""Database Seeder with realistic Kirana merchant transactions."""
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.transaction import TransactionType, TransactionSource
from backend.app.services.ledger_service import LedgerService
from backend.app.core.logging import logger

def seed_demo_data():
    logger.info("Seeding realistic Kirana shopkeeper demo data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    ledger = LedgerService(db)

    try:
        # Check if already seeded
        if ledger.customer_repo.count_total() > 0:
            logger.info("Database already contains records. Skipping seed.")
            return

        # Transaction 1: Rahul (Credit 500 Rs)
        t1 = ledger.record_transaction(
            customer_id=None,
            customer_name="Rahul",
            transaction_type=TransactionType.CREDIT,
            amount_paise=50000,
            description="5kg Aashirvaad Atta, 1L Fortune Oil",
            source=TransactionSource.VOICE,
            raw_transcript="Rahul ko paanch sau rupaye udhaar diye.",
            confidence_score=0.96,
            detected_language="hi-IN",
            idempotency_key="seed-tx-1"
        )

        # Transaction 2: Amit (Credit 800 Rs, then Payment 200 Rs)
        t2 = ledger.record_transaction(
            customer_id=None,
            customer_name="Amit",
            transaction_type=TransactionType.CREDIT,
            amount_paise=80000,
            description="Dairy milk, basmati rice, Tata tea",
            source=TransactionSource.MANUAL,
            idempotency_key="seed-tx-2"
        )
        t3 = ledger.record_transaction(
            customer_id=t2.customer_id,
            customer_name=None,
            transaction_type=TransactionType.PAYMENT,
            amount_paise=20000,
            description="Cash payment received",
            source=TransactionSource.VOICE,
            raw_transcript="Amit ne do sau rupaye wapas kiye.",
            confidence_score=0.98,
            detected_language="hi-IN",
            idempotency_key="seed-tx-3"
        )

        # Transaction 3: Suresh (Credit 1500 Rs)
        t4 = ledger.record_transaction(
            customer_id=None,
            customer_name="Suresh",
            transaction_type=TransactionType.CREDIT,
            amount_paise=150000,
            description="Monthly ration groceries",
            source=TransactionSource.VOICE,
            raw_transcript="Suresh ne pandrah sau rupaye udhar liya",
            confidence_score=0.95,
            detected_language="hi-IN",
            idempotency_key="seed-tx-4"
        )

        # Transaction 4: Pooja Verma (Credit 350 Rs)
        t5 = ledger.record_transaction(
            customer_id=None,
            customer_name="Pooja Verma",
            transaction_type=TransactionType.CREDIT,
            amount_paise=35000,
            description="Detergent, shampoo, biscuits",
            source=TransactionSource.MANUAL,
            idempotency_key="seed-tx-5"
        )

        logger.info("Demo database seeded successfully with 4 customers and 5 transactions!")

    except Exception as e:
        logger.error(f"Error seeding demo database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
