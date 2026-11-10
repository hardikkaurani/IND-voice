"""Gnani Prisma Speech-to-Text (STT) Client Wrapper."""
import io
import uuid
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.voice import VoiceTranscribeResponse


class GnaniPrismaClient:
    """Official Gnani Vachana STT v3 integration wrapper."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.base_url = (base_url or settings.GNANI_BASE_URL).rstrip("/")
        self.endpoint = f"{self.base_url}/stt/v3"
        self.timeout = timeout or settings.GNANI_TIMEOUT_SECONDS

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language_code: str = "indic-auto",
        model: str = "prisma-v3.0"
    ) -> VoiceTranscribeResponse:
        """
        Sends recorded audio to Gnani Prisma v3 endpoint.
        """
        if not self.api_key:
            raise ValueError("Gnani API Key is missing. Configure GNANI_API_KEY in environment.")

        if not audio_bytes:
            raise ValueError("Audio payload cannot be empty.")

        # Gnani expects multipart form data
        files = {
            "audio_file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": model,
            "language_code": language_code,
            "format": "transcribe"
        }
        headers = {
            "X-API-Key-ID": self.api_key,
            # Cloudflare requires a standard browser User-Agent to avoid 403 error 1010
            "User-Agent": "IND-voice/1.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        logger.info(f"Sending {len(audio_bytes)} bytes audio to Gnani Prisma STT ({language_code})")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    data=data,
                    files=files
                )
            except httpx.TimeoutException:
                logger.error("Gnani Prisma STT timed out.")
                raise TimeoutError("Gnani transcription service timed out after 30 seconds.")
            except httpx.RequestError as e:
                logger.error(f"Network error connecting to Gnani STT: {e}")
                raise ConnectionError(f"Network error connecting to Gnani STT: {str(e)}")

        if response.status_code == 200:
            res_json: Dict[str, Any] = response.json()
            logger.info(f"Gnani STT success: transcript='{res_json.get('transcript', '')}'")
            return VoiceTranscribeResponse(
                success=True,
                transcript=res_json.get("transcript", "").strip(),
                detected_language=res_json.get("detected_language_code", language_code),
                confidence=res_json.get("confidence", 0.95),
                processing_time=res_json.get("processing_time"),
                request_id=res_json.get("request_id")
            )
        else:
            error_text = response.text
            logger.error(f"Gnani STT error [{response.status_code}]: {error_text}")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                request_id=f"error_{response.status_code}"
            )
