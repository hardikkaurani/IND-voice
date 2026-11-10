"""Tests for Gnani Prisma STT, Gnani Timbre TTS, and Audio Validation (Mocked Provider Responses)."""
import pytest
import io
import httpx
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import UploadFile, HTTPException
from app.integrations.gnani_prisma import GnaniPrismaClient
from app.integrations.gnani_timbre import GnaniTimbreClient
from app.services.voice_service import VoiceService
from app.models.transaction import TransactionType


@pytest.mark.asyncio
async def test_prisma_successful_codemix_transcription():
    client = GnaniPrismaClient(api_key="mock-api-key")
    fake_response = MagicMock(status_code=200)
    fake_response.json.return_value = {
        "transcript": "Rahul ko 500 rupaye udhaar diye",
        "detected_language_code": "hi-IN",
        "confidence": 0.98,
        "processing_time": 0.45,
        "request_id": "req-12345"
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_response
        res = await client.transcribe_audio(
            audio_bytes=b"fake-audio-bytes",
            filename="test.wav",
            content_type="audio/wav",
            output_format="codemix"
        )

        assert res.success is True
        assert res.transcript == "Rahul ko 500 rupaye udhaar diye"
        assert res.detected_language == "hi-IN"
        assert res.confidence == 0.98
        assert res.error is None


@pytest.mark.asyncio
async def test_prisma_provider_authentication_failure():
    client = GnaniPrismaClient(api_key="invalid-key")
    fake_response = MagicMock(status_code=401)
    fake_response.text = "Unauthorized: Invalid API key"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_response
        res = await client.transcribe_audio(audio_bytes=b"test-bytes")

        assert res.success is False
        assert "authentication failed" in res.error.lower()
        assert res.transcript == ""


@pytest.mark.asyncio
async def test_prisma_rate_limit_failure():
    client = GnaniPrismaClient(api_key="valid-key")
    fake_response = MagicMock(status_code=429)
    fake_response.text = "Too Many Requests"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_response
        res = await client.transcribe_audio(audio_bytes=b"test-bytes")

        assert res.success is False
        assert "rate limit" in res.error.lower()


@pytest.mark.asyncio
async def test_prisma_timeout_handling():
    client = GnaniPrismaClient(api_key="valid-key", timeout=1.0)

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        res = await client.transcribe_audio(audio_bytes=b"test-bytes")
        assert res.success is False
        assert "timed out" in res.error.lower()


@pytest.mark.asyncio
async def test_timbre_successful_speech_synthesis():
    client = GnaniTimbreClient(api_key="mock-api-key")
    # Provide dummy RIFF WAV bytes
    fake_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00data\x00\x00\x00\x00"
    fake_response = MagicMock(status_code=200, content=fake_wav)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_response
        res = await client.synthesize_speech(
            text="Rahul ko paanch sau rupaye udhaar likh diye gaye hain.",
            voice="Kaveri",
            language="hi-IN",
            model="timbre-v2.5"
        )

        assert res.success is True
        assert res.content_type == "audio/wav"
        assert res.audio_base64 is not None
        assert res.error is None


@pytest.mark.asyncio
async def test_timbre_missing_key_graceful_handling():
    client = GnaniTimbreClient(api_key="")
    res = await client.synthesize_speech(text="Test transaction")
    assert res.success is False
    assert "not configured" in res.error


@pytest.mark.asyncio
async def test_audio_validation_empty_audio_raises_400():
    voice_service = VoiceService()
    empty_file = UploadFile(filename="empty.wav", file=io.BytesIO(b""))

    with pytest.raises(HTTPException) as exc_info:
        await voice_service.process_audio_file(empty_file)
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_audio_validation_unsupported_mime_raises_415():
    voice_service = VoiceService()
    text_file = UploadFile(
        filename="notes.txt",
        file=io.BytesIO(b"this is text, not audio"),
        headers={"content-type": "text/plain"}
    )

    with pytest.raises(HTTPException) as exc_info:
        await voice_service.process_audio_file(text_file)
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_voice_confirmation_multilingual_phrasing():
    voice_service = VoiceService()
    
    # Mock Timbre client so we inspect the text passed to it
    with patch.object(voice_service.timbre_client, "synthesize_speech", new_callable=AsyncMock) as mock_synth:
        # 1. Hindi Credit
        await voice_service.generate_confirmation_audio(
            customer_name="Rahul",
            transaction_type=TransactionType.CREDIT,
            amount_rupees=500.0,
            remaining_balance_rupees=500.0,
            language="hi-IN"
        )
        hindi_call_args = mock_synth.call_args[1]
        assert "उधार" in hindi_call_args["text"]
        assert "Rahul" in hindi_call_args["text"]

        # 2. English Payment
        await voice_service.generate_confirmation_audio(
            customer_name="Amit",
            transaction_type=TransactionType.PAYMENT,
            amount_rupees=200.0,
            remaining_balance_rupees=300.0,
            language="en-IN"
        )
        en_call_args = mock_synth.call_args[1]
        assert "payment" in en_call_args["text"].lower()
        assert "Amit" in en_call_args["text"]

        # 3. Marathi Credit
        await voice_service.generate_confirmation_audio(
            customer_name="Pooja",
            transaction_type=TransactionType.CREDIT,
            amount_rupees=150.0,
            remaining_balance_rupees=150.0,
            language="mr-IN"
        )
        mr_call_args = mock_synth.call_args[1]
        assert "उधारी" in mr_call_args["text"]

