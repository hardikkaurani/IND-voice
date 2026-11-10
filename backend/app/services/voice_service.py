"""Voice Service orchestrating audio validation, STT transcription, intelligence, and TTS synthesis."""
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.integrations.gnani_prisma import GnaniPrismaClient, ALLOWED_AUDIO_MIME_TYPES
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
        Validates audio, transcribes with Gnani Prisma v3.0, and extracts structured transaction data.
        """
        # 1. Audio size validation
        max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
        audio_bytes = await file.read()

        if len(audio_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio payload received. Please record audio before uploading."
            )

        if len(audio_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file exceeds maximum size of {settings.MAX_AUDIO_SIZE_MB}MB."
            )

        filename = file.filename or "recording.wav"
        content_type = file.content_type or "audio/wav"

        # Validate / normalize MIME type
        base_mime = content_type.split(";")[0].strip().lower()
        if base_mime not in ALLOWED_AUDIO_MIME_TYPES and not base_mime.startswith("audio/"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio format '{content_type}'. Supported formats: WAV, WebM, MP3, OGG, M4A, AAC."
            )

        # 2. Invoke Gnani Prisma v3.0 STT
        stt_result = await self.prisma_client.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=base_mime,
            language_code="indic-auto",
            model="prisma-v3.0",
            output_format="codemix"
        )

        if not stt_result.success or not stt_result.transcript:
            logger.warning(f"Gnani STT returned failure: error='{stt_result.error}'")
            extracted = ExtractedTransaction(
                original_transcript="",
                needs_clarification=True,
                clarification_reason=stt_result.error or "Could not transcribe audio. Please ensure microphone permissions and speak clearly."
            )
            return stt_result, extracted

        # 3. Multilingual transaction intelligence extraction
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
        language: str = "hi-IN",
        voice: str = "Kaveri"
    ) -> VoiceSynthesisResponse:
        """
        Synthesizes spoken confirmation audio via Gnani Timbre v2.5 with language-specific phrasing.
        Supports Hindi, English, and Marathi confirmation phrasing.
        """
        amt_str = int(amount_rupees) if amount_rupees.is_integer() else f"{amount_rupees:.2f}"
        bal_str = int(abs(remaining_balance_rupees)) if remaining_balance_rupees.is_integer() else f"{abs(remaining_balance_rupees):.2f}"

        lang_code = (language or "hi-IN").lower()

        if lang_code.startswith("en"):
            # English confirmation
            if transaction_type == TransactionType.CREDIT:
                text = f"Recorded credit of {amt_str} rupees for {customer_name}. Total outstanding balance is {bal_str} rupees."
            else:
                text = f"Received payment of {amt_str} rupees from {customer_name}. Updated outstanding balance is {bal_str} rupees."
        elif lang_code.startswith("mr"):
            # Marathi confirmation
            if transaction_type == TransactionType.CREDIT:
                text = f"{customer_name} ला {amt_str} रुपये उधारी नोंदवली गेली आहे. एकूण बाकी {bal_str} रुपये आहे."
            else:
                text = f"{customer_name} कडून {amt_str} रुपये जमा झाले आहेत. आता शिल्लक बाकी {bal_str} रुपये आहे."
        else:
            # Hindi / Hinglish confirmation (default)
            if transaction_type == TransactionType.CREDIT:
                text = f"{customer_name} को {amt_str} रुपये उधार लिख दिए गए हैं। कुल बाकी {bal_str} रुपये है।"
            else:
                text = f"{customer_name} से {amt_str} रुपये जमा कर लिए गए हैं। अब बचा हुआ बाकी {bal_str} रुपये है।"

        return await self.timbre_client.synthesize_speech(
            text=text,
            voice=voice,
            language=language or "hi-IN",
            speed=1.0,
            model="timbre-v2.5"
        )
