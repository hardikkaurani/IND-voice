"""Gnani Timbre Text-to-Speech (TTS) Client Wrapper."""
import io
import wave
import base64
import httpx
from typing import Optional, Dict, Any, Tuple
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
    def _pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 16000, channels: int = 1, sampwidth: int = 2) -> bytes:
        """
        Wraps raw 16-bit linear PCM into a standard browser-playable RIFF WAV container.
        """
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sampwidth)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_bytes)
        wav_buffer.seek(0)
        return wav_buffer.read()

    async def synthesize_speech(
        self,
        text: str,
        voice: str = "Avinash",
        language: str = "hi-IN",
        speed: float = 1.0,
        model: str = "timbre-v3.0"
    ) -> VoiceSynthesisResponse:
        """
        Synthesizes text into natural voice audio.
        """
        if not self.api_key:
            return VoiceSynthesisResponse(
                success=False,
                error="GNANI_API_KEY is not configured."
            )

        payload = {
            "text": text,
            "model": model,
            "voice": voice,
            "language": language,
            "speed": speed
        }
        headers = {
            "Content-Type": "application/json",
            "X-API-Key-ID": self.api_key,
            "User-Agent": "IND-voice/1.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        logger.info(f"Synthesizing voice confirmation via Gnani Timbre for text: '{text[:50]}...'")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    json=payload
                )
            except Exception as e:
                logger.error(f"Error calling Gnani Timbre TTS: {e}")
                return VoiceSynthesisResponse(
                    success=False,
                    error=f"TTS synthesis network failure: {str(e)}"
                )

        if response.status_code == 200:
            pcm_content = response.content
            # Wrap raw PCM into standard WAV
            wav_bytes = self._pcm_to_wav(pcm_content)
            audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
            return VoiceSynthesisResponse(
                success=True,
                audio_base64=audio_b64,
                content_type="audio/wav"
            )
        else:
            logger.error(f"Gnani Timbre TTS error [{response.status_code}]: {response.text}")
            return VoiceSynthesisResponse(
                success=False,
                error=f"Gnani TTS returned status {response.status_code}"
            )
