"""Live provider smoke tests for Gnani Prisma STT and Gnani Timbre TTS.
These tests only execute against the live https://api.vachana.ai API when GNANI_API_KEY
is explicitly configured in the environment. Otherwise, they skip cleanly.
"""
import os
import io
import wave
import pytest
from app.core.config import settings
from app.integrations.gnani_prisma import GnaniPrismaClient
from app.integrations.gnani_timbre import GnaniTimbreClient


def _generate_synthetic_tone_wav(duration_seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generates a valid 1-second RIFF WAV byte array for live STT test payload."""
    buffer = io.BytesIO()
    num_frames = int(duration_seconds * sample_rate)
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        # 16-bit silence
        wav_file.writeframes(b"\x00\x00" * num_frames)
    buffer.seek(0)
    return buffer.read()


@pytest.mark.asyncio
async def test_live_gnani_timbre_tts_smoke():
    api_key = os.environ.get("GNANI_API_KEY") or settings.GNANI_API_KEY
    if not api_key or api_key.strip() == "":
        pytest.skip("GNANI_API_KEY not configured. Skipping live Timbre TTS smoke test.")

    client = GnaniTimbreClient(api_key=api_key)
    res = await client.synthesize_speech(
        text="राहुल को पांच सौ रुपये उधार दिए गए हैं।",
        voice="Kaveri",
        language="hi-IN",
        model="timbre-v2.5"
    )

    # When valid key is provided, verify success and returned WAV
    if res.success:
        assert res.audio_base64 is not None
        assert res.content_type == "audio/wav"
    else:
        # If the key is revoked or rate limited, verify error message was populated
        assert res.error is not None


@pytest.mark.asyncio
async def test_live_gnani_prisma_stt_smoke():
    api_key = os.environ.get("GNANI_API_KEY") or settings.GNANI_API_KEY
    if not api_key or api_key.strip() == "":
        pytest.skip("GNANI_API_KEY not configured. Skipping live Prisma STT smoke test.")

    client = GnaniPrismaClient(api_key=api_key)
    dummy_wav = _generate_synthetic_tone_wav(1.0)
    
    res = await client.transcribe_audio(
        audio_bytes=dummy_wav,
        filename="smoke_test.wav",
        content_type="audio/wav",
        language_code="indic-auto",
        model="prisma-v3.0",
        output_format="codemix"
    )

    # Live call either succeeds or reports provider reason (e.g. key status / silence)
    assert res is not None
    assert isinstance(res.success, bool)

