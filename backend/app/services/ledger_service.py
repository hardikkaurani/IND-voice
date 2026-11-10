"""Financial Ledger Service enforcing double-entry integrity and atomic transactions."""
import json
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.logging import logger
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType, TransactionSource
from app.models.audit import AuditLog
from app.repositories.customer_repo import CustomerRepository
from app.repositories.transaction_repo import TransactionRepository
from app.schemas.transaction import (
    TransactionCreate,
    TransactionConfirmRequest,
    TransactionResponse
)


class LedgerService:
    def __init__(self, db: Session):
        self.db = db
        self.customer_repo = CustomerRepository(db)
        self.tx_repo = TransactionRepository(db)

    def _to_response(self, tx: Transaction) -> TransactionResponse:
        customer_name = tx.customer.name if tx.customer else None
        return TransactionResponse(
            id=tx.id,
            customer_id=tx.customer_id,
            customer_name=customer_name,
            transaction_type=tx.transaction_type,
            amount_paise=tx.amount_paise,
            amount_rupees=round(tx.amount_paise / 100.0, 2),
            currency=tx.currency,
            description=tx.description,
            source=tx.source,
            raw_transcript=tx.raw_transcript,
            confidence_score=tx.confidence_score,
            detected_language=tx.detected_language,
            idempotency_key=tx.idempotency_key,
            created_at=tx.created_at
        )

    def record_transaction(
        self,
        customer_id: Optional[int],
        customer_name: Optional[str],
        transaction_type: TransactionType,
        amount_paise: int,
        description: Optional[str] = None,
        source: TransactionSource = TransactionSource.VOICE,
        raw_transcript: Optional[str] = None,
        confidence_score: Optional[float] = None,
        detected_language: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> TransactionResponse:
        """
        Records a transaction atomically, updating customer balance.
        Guarantees:
        - amount_paise > 0
        - customer exists or is created cleanly
        - idempotency key prevents duplicate execution
        - balance invariant: Outstanding = Sum(CREDIT) - Sum(PAYMENT)
        """
        # 1. Validation
        if amount_paise <= 0:
            raise HTTPException(
                status_code=422,
                detail="Transaction amount must be greater than zero paise."
            )

        # 2. Check duplicate submission via idempotency_key
        if idempotency_key:
            existing_tx = self.tx_repo.get_by_idempotency_key(idempotency_key)
            if existing_tx:
                logger.info(f"Duplicate submission prevented by idempotency_key: {idempotency_key}")
                return self._to_response(existing_tx)

        # 3. Resolve customer
        customer = None
        if customer_id:
            customer = self.customer_repo.get_by_id(customer_id)
        if not customer and customer_name and customer_name.strip():
            customer = self.customer_repo.get_or_create(customer_name.strip())

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid customer_id or customer_name must be provided."
            )

        try:
            # 4. Create Transaction record
            tx = Transaction(
                customer_id=customer.id,
                transaction_type=transaction_type,
                amount_paise=amount_paise,
                currency="INR",
                description=description or ("Credit given" if transaction_type == TransactionType.CREDIT else "Payment received"),
                source=source,
                raw_transcript=raw_transcript,
                confidence_score=confidence_score,
                detected_language=detected_language,
                idempotency_key=idempotency_key
            )
            self.tx_repo.create(tx)

            # 5. Balance arithmetic update
            if transaction_type == TransactionType.CREDIT:
                customer.current_balance_paise += amount_paise
            elif transaction_type == TransactionType.PAYMENT:
                customer.current_balance_paise -= amount_paise

            # 6. Audit Trail
            audit = AuditLog(
                entity_type="TRANSACTION",
                entity_id=tx.id,
                action="RECORD_TRANSACTION",
                payload=json.dumps({
                    "customer_id": customer.id,
                    "customer_name": customer.name,
                    "type": transaction_type.value,
                    "amount_paise": amount_paise,
                    "source": source.value,
                    "balance_after_paise": customer.current_balance_paise
                })
            )
            self.db.add(audit)

            # 7. Commit atomically
            self.db.commit()
            self.db.refresh(tx)
            self.db.refresh(customer)

            logger.info(
                f"Recorded transaction {tx.id} for {customer.name}: {transaction_type.value} "
                f"Rs.{amount_paise/100:.2f}. New Balance: Rs.{customer.current_balance_paise/100:.2f}"
            )
            return self._to_response(tx)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Transaction failed and was rolled back: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Financial transaction failed: {str(e)}"
            )

    def confirm_voice_transaction(self, req: TransactionConfirmRequest) -> TransactionResponse:
        """Explicit human confirmation endpoint before committing voice-interpreted transaction."""
        return self.record_transaction(
            customer_id=req.customer_id,
            customer_name=req.customer_name,
            transaction_type=req.transaction_type,
            amount_paise=req.amount_paise,
            description=req.description,
            source=TransactionSource.VOICE,
            raw_transcript=req.raw_transcript,
            detected_language=req.detected_language,
            idempotency_key=req.idempotency_key
        )

    def get_customer_transactions(
        self,
        customer_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[TransactionResponse]:
        txs = self.tx_repo.list_by_customer(customer_id, limit=limit, offset=offset)
        return [self._to_response(t) for t in txs]

    def get_recent_transactions(self, limit: int = 20) -> List[TransactionResponse]:
        txs = self.tx_repo.list_recent(limit=limit)
        return [self._to_response(t) for t in txs]
