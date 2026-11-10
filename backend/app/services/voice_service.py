"""Voice Service orchestrating audio processing, STT, intelligence and TTS synthesis."""
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.integrations.gnani_prisma import GnaniPrismaClient
from app.integrations.gnani_timbre import GnaniTimbreClient
from app.services.intelligence_service import TransactionIntelligenceService
from app.schemas.voice import (
    VoiceTranscribeResponse,
    ExtractedTransaction,
    VoiceSynthesisResponse
)
from app.models.transaction import TransactionType


class VoiceService:
    def __init__(self):
        self.prisma_client = GnaniPrismaClient()
        self.timbre_client = GnaniTimbreClient()
        self.intelligence_service = TransactionIntelligenceService()

    async def process_audio_file(self, file: UploadFile) -> Tuple[VoiceTranscribeResponse, ExtractedTransaction]:
        """
        Validates audio, transcribes with Gnani Prisma, and extracts transaction details.
        """
        # Security checks: file size & format
        max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
        audio_bytes = await file.read()

        if len(audio_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file exceeds maximum size of {settings.MAX_AUDIO_SIZE_MB}MB."
            )

        if len(audio_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio payload received."
            )

        filename = file.filename or "recording.wav"
        content_type = file.content_type or "audio/wav"

        # 1. Gnani Prisma STT
        stt_result = await self.prisma_client.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language_code="indic-auto",
            model="prisma-v3.0"
        )

        if not stt_result.success or not stt_result.transcript:
            logger.warning("Gnani STT returned empty or unsuccessful transcription.")
            extracted = ExtractedTransaction(
                original_transcript="",
                needs_clarification=True,
                clarification_reason="Could not transcribe audio. Please ensure microphone permissions and speak clearly."
            )
            return stt_result, extracted

        # 2. Intelligence extraction
        extracted = await self.intelligence_service.extract_transaction(
            transcript=stt_result.transcript,
            detected_language=stt_result.detected_language
        )

        return stt_result, extracted

    async def generate_confirmation_audio(
        self,
        customer_name: str,
        transaction_type: TransactionType,
        amount_rupees: float,
        remaining_balance_rupees: float,
        language: str = "hi-IN"
    ) -> VoiceSynthesisResponse:
        """
        Synthesizes spoken confirmation audio via Gnani Timbre TTS.
        """
        amt_str = int(amount_rupees) if amount_rupees.is_integer() else f"{amount_rupees:.2f}"
        bal_str = int(abs(remaining_balance_rupees)) if remaining_balance_rupees.is_integer() else f"{abs(remaining_balance_rupees):.2f}"

        if transaction_type == TransactionType.CREDIT:
            text = f"{customer_name} को {amt_str} रुपये उधार लिख दिए गए हैं। कुल बाकी {bal_str} रुपये है।"
        else:
            text = f"{customer_name} से {amt_str} रुपये जमा कर लिए गए हैं। अब बचा हुआ बाकी {bal_str} रुपये है।"

        return await self.timbre_client.synthesize_speech(
            text=text,
            voice="Avinash",
            language=language,
            speed=1.0
        )
