"""Voice and AI Integration Schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.models.transaction import TransactionType


class VoiceTranscribeResponse(BaseModel):
    success: bool
    transcript: str
    detected_language: str
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    request_id: Optional[str] = None


class ExtractedTransaction(BaseModel):
    customer_name: Optional[str] = None
    customer_id: Optional[int] = None
    amount_paise: Optional[int] = Field(None, gt=0)
    amount_rupees: Optional[float] = None
    transaction_type: Optional[TransactionType] = None
    description: Optional[str] = None
    currency: str = "INR"
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    language: Optional[str] = None
    original_transcript: str
    needs_clarification: bool = False
    clarification_reason: Optional[str] = None


class VoiceSynthesisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="hi-IN")
    voice: str = Field(default="Avinash")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class VoiceSynthesisResponse(BaseModel):
    success: bool
    audio_base64: Optional[str] = None
    content_type: str = "audio/wav"
    error: Optional[str] = None
