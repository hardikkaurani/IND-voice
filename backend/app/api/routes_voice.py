"""Voice API endpoints."""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.services.voice_service import VoiceService
from app.schemas.voice import (
    VoiceTranscribeResponse,
    ExtractedTransaction,
    VoiceSynthesisRequest,
    VoiceSynthesisResponse
)

router = APIRouter(prefix="/voice", tags=["Voice & Speech"])


def get_voice_service() -> VoiceService:
    return VoiceService()


@router.post("/process-audio", response_model=dict)
async def process_voice_audio(
    file: UploadFile = File(..., description="Recorded audio clip from browser microphone"),
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Receives browser audio, transcribes with Gnani Prisma STT,
    and runs multilingual intelligence extraction.
    """
    stt_result, extracted = await voice_service.process_audio_file(file)
    return {
        "stt": stt_result.model_dump(),
        "extracted": extracted.model_dump()
    }


@router.post("/synthesize", response_model=VoiceSynthesisResponse)
async def synthesize_confirmation(
    req: VoiceSynthesisRequest,
    voice_service: VoiceService = Depends(get_voice_service)
):
    """
    Synthesizes natural spoken confirmation audio via Gnani Timbre TTS.
    Returns base64 encoded standard WAV for browser playback.
    """
    return await voice_service.timbre_client.synthesize_speech(
        text=req.text,
        voice=req.voice,
        language=req.language,
        speed=req.speed
    )
