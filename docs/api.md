# IND-voice API Documentation

Base URL: `http://localhost:8000/api` (Production: `https://ind-voice-api.onrender.com/api`)

---

## 1. Voice & Speech Endpoints

### `POST /voice/process-audio`
Uploads raw browser-recorded audio, transcribes via **Gnani Prisma v3 STT**, and runs multilingual extraction.
* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (audio binary in WAV / WebM format)
* **Response:**
```json
{
  "stt": {
    "success": true,
    "transcript": "Rahul ko paanch sau rupaye udhaar diye.",
    "detected_language": "hi-IN",
    "confidence": 0.96,
    "processing_time": 0.08
  },
  "extracted": {
    "customer_name": "Rahul",
    "amount_paise": 50000,
    "amount_rupees": 500.0,
    "transaction_type": "CREDIT",
    "description": "Credit given to Rahul",
    "currency": "INR",
    "confidence": 0.95,
    "original_transcript": "Rahul ko paanch sau rupaye udhaar diye.",
    "needs_clarification": false
  }
}
```

### `POST /voice/synthesize`
Synthesizes natural confirmation speech using **Gnani Timbre TTS** (`timbre-v3.0`).
* **Request Body:**
```json
{
  "text": "Rahul ko 500 rupaye udhaar likh diye gaye hain.",
  "language": "hi-IN",
  "voice": "Avinash",
  "speed": 1.0
}
```
* **Response:**
```json
{
  "success": true,
  "audio_base64": "<base64_encoded_wav_stream>",
  "content_type": "audio/wav"
}
```

---

## 2. Transactions & Ledger Endpoints

### `POST /transactions/parse`
Parses plain speech transcript into structured transaction attributes.

### `POST /transactions/confirm`
Commits a human-confirmed transaction atomically into the ledger, updates the customer's balance, and returns the synthesized voice audio.

### `POST /transactions`
Manual fallback transaction entry.

---

## 3. Customer & Ledger History

* `GET /customers`: Returns list and search of customers with real-time outstanding balances.
* `POST /customers`: Registers a new customer.
* `GET /customers/{id}/transactions`: Returns complete chronological ledger statement for an account.

---

## 4. Dashboard Analytics

* `GET /dashboard/summary`: Returns total outstanding debt, today's credit and collections, customer counts, and recent transactions.
