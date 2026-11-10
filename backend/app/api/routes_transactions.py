"""Transactions API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ledger_service import LedgerService
from app.services.intelligence_service import TransactionIntelligenceService
from app.services.voice_service import VoiceService
from app.schemas.transaction import (
    TransactionCreate,
    TransactionConfirmRequest,
    TransactionResponse
)
from app.schemas.voice import ExtractedTransaction

router = APIRouter(prefix="/transactions", tags=["Transactions & Ledger"])


def get_ledger_service(db: Session = Depends(get_db)) -> LedgerService:
    return LedgerService(db)


def get_intelligence_service() -> TransactionIntelligenceService:
    return TransactionIntelligenceService()


def get_voice_service() -> VoiceService:
    return VoiceService()


@router.post("/parse", response_model=ExtractedTransaction)
async def parse_text_transcript(
    transcript: str = Query(..., min_length=1, description="Raw speech or text statement"),
    detected_language: Optional[str] = Query("hi-IN"),
    service: TransactionIntelligenceService = Depends(get_intelligence_service)
):
    """
    Parses natural Hindi / Hinglish / Marathi / English speech transcript into structured transaction.
    """
    return await service.extract_transaction(transcript, detected_language)


@router.post("/confirm", response_model=dict)
async def confirm_transaction(
    req: TransactionConfirmRequest,
    ledger: LedgerService = Depends(get_ledger_service),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Explicit human confirmation: Commits interpreted transaction to database,
    updates customer ledger, and returns natural voice confirmation via Gnani Timbre.
    """
    tx_response = ledger.confirm_voice_transaction(req)

    # Fetch updated customer balance for voice synthesis
    customer = ledger.customer_repo.get_by_id(tx_response.customer_id)
    balance_rupees = customer.current_balance_paise / 100.0 if customer else 0.0

    # Generate voice feedback in Hindi/Indian language
    tts_result = await voice_service.generate_confirmation_audio(
        customer_name=tx_response.customer_name or "Customer",
        transaction_type=tx_response.transaction_type,
        amount_rupees=tx_response.amount_rupees,
        remaining_balance_rupees=balance_rupees,
        language=req.detected_language or "hi-IN"
    )

    return {
        "transaction": tx_response.model_dump(),
        "customer_balance_rupees": balance_rupees,
        "voice_confirmation": tts_result.model_dump()
    }


@router.post("", response_model=TransactionResponse)
def create_manual_transaction(
    req: TransactionCreate,
    ledger: LedgerService = Depends(get_ledger_service)
):
    """Manual transaction entry fallback."""
    return ledger.record_transaction(
        customer_id=req.customer_id,
        customer_name=req.customer_name,
        transaction_type=req.transaction_type,
        amount_paise=req.amount_paise,
        description=req.description,
        source=req.source,
        raw_transcript=req.raw_transcript,
        idempotency_key=req.idempotency_key
    )


@router.get("/recent", response_model=List[TransactionResponse])
def get_recent_transactions(
    limit: int = Query(20, ge=1, le=100),
    ledger: LedgerService = Depends(get_ledger_service)
):
    """Retrieves most recent ledger transactions across all customers."""
    return ledger.get_recent_transactions(limit=limit)
