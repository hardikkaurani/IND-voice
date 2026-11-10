"""Gnani Prisma Speech-to-Text (STT) Client Wrapper.
Official Gnani Vachana STT v3 REST Integration (prisma-v3.0).
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.voice import VoiceTranscribeResponse


# Supported browser & telephony audio MIME types
ALLOWED_AUDIO_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/aac",
    "audio/flac"
}


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
        model: str = "prisma-v3.0",
        output_format: str = "codemix"
    ) -> VoiceTranscribeResponse:
        """
        Sends recorded browser audio to Gnani Prisma v3 endpoint.
        Uses codemix output format for seamless Indian language / Hinglish transcription.
        """
        if not self.api_key:
            logger.error("Gnani API Key is missing. STT cannot be invoked.")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error="Gnani API key is not configured in backend environment."
            )

        if not audio_bytes or len(audio_bytes) == 0:
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error="Empty audio recording received."
            )

        # Clean/normalize content_type (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
        base_mime = content_type.split(";")[0].strip().lower()
        if base_mime not in ALLOWED_AUDIO_MIME_TYPES:
            logger.warning(f"Unrecognized audio MIME type '{content_type}', defaulting to audio/wav")
            base_mime = "audio/wav"

        files = {
            "audio_file": (filename, audio_bytes, base_mime)
        }
        data = {
            "model": model,
            "language_code": language_code,
            "format": output_format
        }
        headers = {
            "X-API-Key-ID": self.api_key,
            # Cloudflare requires a standard browser User-Agent to avoid 403 error 1010
            "User-Agent": "IND-voice/1.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        # Privacy-safe logging: Never log API key or customer audio bytes
        logger.info(
            f"Gnani Prisma STT request: size={len(audio_bytes)}B, "
            f"mime={base_mime}, model={model}, lang={language_code}, format={output_format}"
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    data=data,
                    files=files
                )
            except httpx.TimeoutException:
                logger.error(f"Gnani Prisma STT timed out after {self.timeout}s.")
                return VoiceTranscribeResponse(
                    success=False,
                    transcript="",
                    detected_language=language_code,
                    error=f"Gnani STT service timed out after {self.timeout} seconds."
                )
            except httpx.RequestError as exc:
                logger.error(f"Network error connecting to Gnani STT: {exc}")
                return VoiceTranscribeResponse(
                    success=False,
                    transcript="",
                    detected_language=language_code,
                    error=f"Network error connecting to Gnani STT: {str(exc)}"
                )

        if response.status_code == 200:
            try:
                res_json: Dict[str, Any] = response.json()
            except Exception:
                logger.error("Failed to parse Gnani STT response JSON")
                return VoiceTranscribeResponse(
                    success=False,
                    transcript="",
                    detected_language=language_code,
                    error="Malformed JSON response received from Gnani STT."
                )

            transcript = res_json.get("transcript", "").strip()
            # Privacy safe logging: only log transcript length and sanitized prefix
            prefix = transcript[:20] + "..." if len(transcript) > 20 else transcript
            logger.info(f"Gnani STT success: length={len(transcript)}, preview='{prefix}'")

            return VoiceTranscribeResponse(
                success=True,
                transcript=transcript,
                detected_language=res_json.get("detected_language_code", language_code),
                confidence=res_json.get("confidence", 0.95),
                processing_time=res_json.get("processing_time"),
                request_id=res_json.get("request_id")
            )
        elif response.status_code in (401, 403):
            logger.error(f"Gnani STT authentication failure [{response.status_code}]")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error="Gnani API authentication failed. Please verify GNANI_API_KEY."
            )
        elif response.status_code == 429:
            logger.error("Gnani STT rate limit exceeded [429]")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error="Gnani STT rate limit exceeded. Please wait a moment and try again."
            )
        elif response.status_code == 400:
            logger.error(f"Gnani STT bad request [400]: {response.text[:200]}")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error="Audio format rejected by Gnani STT. Ensure clear, audible recording."
            )
        else:
            logger.error(f"Gnani STT provider error [{response.status_code}]: {response.text[:200]}")
            return VoiceTranscribeResponse(
                success=False,
                transcript="",
                detected_language=language_code,
                error=f"Gnani STT provider error (HTTP {response.status_code})."
            )
