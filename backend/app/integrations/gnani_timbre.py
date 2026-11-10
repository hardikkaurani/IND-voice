"""Gnani Timbre Text-to-Speech (TTS) Client Wrapper.
Official Gnani Vachana Timbre v2.5 REST Integration.
"""
import io
import wave
import base64
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.voice import VoiceSynthesisResponse


class GnaniTimbreClient:
    """Official Gnani Vachana Timbre TTS integration wrapper."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.base_url = (base_url or settings.GNANI_BASE_URL).rstrip("/")
        self.endpoint = f"{self.base_url}/api/v1/tts/inference"
        self.timeout = timeout or settings.GNANI_TIMEOUT_SECONDS

    @staticmethod
    def _ensure_wav_container(audio_bytes: bytes, sample_rate: int = 24000) -> bytes:
        """
        Ensures the returned audio has a valid RIFF WAVE header.
        If the provider already returned a RIFF container (standard WAV), returns as-is.
        If raw PCM was returned, wraps it with a standard RIFF header.
        Never double-wraps existing WAV or MP3 bytes.
        """
        if audio_bytes.startswith(b"RIFF") or audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
            # Already valid WAV, MP3 ID3, or MP3 sync frame
            return audio_bytes

        # Fallback wrapper for raw headerless PCM bytes
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_bytes)
        wav_buffer.seek(0)
        return wav_buffer.read()

    async def synthesize_speech(
        self,
        text: str,
        voice: str = "Kaveri",
        language: str = "hi-IN",
        speed: float = 1.0,
        model: str = "timbre-v2.5"
    ) -> VoiceSynthesisResponse:
        """
        Synthesizes text into natural Indian language voice audio via Gnani Timbre v2.5.
        Supported voices include 'Kaveri' (Hindi, English, Marathi).
        """
        if not self.api_key:
            logger.warning("GNANI_API_KEY is not configured. TTS synthesis skipped.")
            return VoiceSynthesisResponse(
                success=False,
                error="GNANI_API_KEY is not configured in backend environment."
            )

        if not text or not text.strip():
            return VoiceSynthesisResponse(
                success=False,
                error="Text for voice synthesis cannot be empty."
            )

        payload = {
            "text": text.strip(),
            "model": model,
            "voice": voice,
            "language": language,
            "speed": speed,
            "audio_config": {
                "encoding": "linear_pcm",
                "container": "wav",
                "num_channels": 1,
                "sample_rate": 24000,
                "sample_width": 2
            }
        }
        headers = {
            "Content-Type": "application/json",
            "X-API-Key-ID": self.api_key,
            "User-Agent": "IND-voice/1.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        # Privacy safe logging: only log character count and language
        logger.info(
            f"Gnani Timbre TTS request: chars={len(text)}, model={model}, voice={voice}, lang={language}"
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    json=payload
                )
            except httpx.TimeoutException:
                logger.error(f"Gnani Timbre TTS timed out after {self.timeout}s.")
                return VoiceSynthesisResponse(
                    success=False,
                    error=f"Gnani TTS service timed out after {self.timeout} seconds."
                )
            except httpx.RequestError as exc:
                logger.error(f"Network error connecting to Gnani Timbre TTS: {exc}")
                return VoiceSynthesisResponse(
                    success=False,
                    error=f"Network error connecting to Gnani TTS: {str(exc)}"
                )

        if response.status_code == 200:
            raw_content = response.content
            if not raw_content:
                logger.warning("Gnani Timbre returned 200 OK but empty audio payload.")
                return VoiceSynthesisResponse(
                    success=False,
                    error="Gnani TTS returned empty audio payload."
                )

            # Ensure valid browser-playable WAV container without double-wrapping
            wav_bytes = self._ensure_wav_container(raw_content)
            audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
            logger.info(f"Gnani Timbre TTS success: size={len(wav_bytes)}B audio generated.")

            return VoiceSynthesisResponse(
                success=True,
                audio_base64=audio_b64,
                content_type="audio/wav"
            )
        elif response.status_code in (401, 403):
            logger.error(f"Gnani Timbre authentication failure [{response.status_code}]")
            return VoiceSynthesisResponse(
                success=False,
                error="Gnani API authentication failed for TTS. Verify GNANI_API_KEY."
            )
        elif response.status_code == 429:
            logger.error("Gnani Timbre rate limit exceeded [429]")
            return VoiceSynthesisResponse(
                success=False,
                error="Gnani TTS rate limit exceeded. Please retry shortly."
            )
        else:
            logger.error(f"Gnani Timbre error [{response.status_code}]: {response.text[:200]}")
            return VoiceSynthesisResponse(
                success=False,
                error=f"Gnani TTS provider error (HTTP {response.status_code})."
            )
