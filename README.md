# IND-voice (बोल कर लिखो)

> **Multilingual Voice-First Business Ledger and Financial Intelligence Platform for Indian Small Merchants**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119-009688)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB)](https://python.org)
[![Gnani AI](https://img.shields.io/badge/Gnani_AI-Prisma_STT_%26_Timbre_TTS-orange)](https://vachana.ai)
[![Design System](https://img.shields.io/badge/Design_System-Morgan_Stanley_Institutional-2075CC)](design.md)

---

## 1. Product Vision

Small retailers, Kirana shopkeepers, and local distributors across India handle dozens of daily credit (*udhaar*) and payment (*jama*) transactions. Typing these transactions during peak store hours is slow, error-prone, and fraught with linguistic barriers.

**IND-voice** transforms merchant record-keeping into a natural, voice-driven experience:
1. **Speak Naturally:** The merchant speaks in Hindi, Hinglish, Marathi, or English (*"Rahul ko paanch sau rupaye udhaar diye"*, *"Amit ne do sau rupaye wapas kiye"*).
2. **Understand Accurately:** Transcribed in real-time via **Gnani Prisma v3 STT** and extracted with our deterministic linguistic engine.
3. **Confirm Explicitly:** The parsed transaction is shown for human verification. No AI output directly modifies records without explicit confirmation.
4. **Record Reliably:** Commits atomically to a double-entry ledger with integer paise precision and synthesizes spoken voice confirmation via **Gnani Timbre TTS**.

---

## 2. Core Capabilities

* **Voice Transaction Capture:** Browser `MediaRecorder` integration with noise suppression, waveform audio indicator, duration counters, and retry controls.
* **Gnani Prisma v3 STT:** Direct API integration with `api.vachana.ai/stt/v3` supporting `indic-auto` language detection across Indian languages.
* **Transaction Intelligence:** Parses customer names, amounts in paise, and transaction directions (`CREDIT` vs `PAYMENT`).
* **Human Confirmation Modal:** Explicit review and edit screen preventing ambiguous model assumptions.
* **Spoken Voice Confirmation:** Synthesizes natural spoken Hindi/Indian confirmation audio using **Gnani Timbre TTS** (`timbre-v3.0`).
* **Digital Ledger & Directory:** Real-time customer balances, search, credit vs payment timeline, and CSV export.
* **Video Hero Login:** Atmospheric video background with dark backdrop blur and zero component overlap.

---

## 3. Financial Invariants & Correctness (Non-Negotiable)

1. **Integer Arithmetic:** All monetary amounts are strictly stored as integer `paise` (1 INR = 100 paise). Floating-point math is banned.
2. **Double-Entry Balance Formula:**
   $$\text{Customer Outstanding Balance} = \sum \text{CREDIT} - \sum \text{PAYMENT}$$
   * Positive balance = Customer owes the shopkeeper (*Baaki / Udhaar*).
   * Negative balance = Customer paid an advance.
3. **Idempotency Protection:** Every transaction includes an optional `idempotency_key` ensuring duplicate network submissions do not corrupt account balances.
4. **Atomic Transactions:** Customer balance updates, transaction entries, and audit logs are committed within a single database transaction block.

---

## 4. System Architecture

```
IND-voice/
├── frontend/                     # Next.js 15 App Router (Mercury Dark)
│   ├── app/                      # App router pages (/, /customers, /history)
│   ├── components/               # Navbar, VoiceModal, ManualModal, CustomerModal, LoginPage
│   ├── hooks/                    # useAudioRecorder hook
│   ├── lib/                      # Typed API client
│   ├── public/                   # Logo, background video
│   ├── types/                    # TypeScript interfaces
│   └── vercel.json               # Vercel deployment config
├── backend/                      # Python FastAPI Backend
│   ├── app/
│   │   ├── api/                  # Routes (voice, transactions, customers, dashboard)
│   │   ├── core/                 # Config, database engine, logging, security
│   │   ├── integrations/         # Gnani Prisma STT, Gnani Timbre TTS, Evon adapter
│   │   ├── models/               # SQLAlchemy ORM (Customer, Transaction, AuditLog)
│   │   ├── repositories/         # Database access layer
│   │   ├── schemas/              # Pydantic v2 validation models
│   │   ├── services/             # LedgerService, IntelligenceService, VoiceService
│   │   ├── db_seed.py            # Demo Kirana data seeder
│   │   └── main.py               # FastAPI entrypoint
│   ├── tests/                    # Pytest suite for financial math & intelligence
│   └── requirements.txt
├── render.yaml                   # Render deployment for FastAPI + PostgreSQL
├── .env.example                  # Environment template
└── README.md
```

---

## 5. Gnani AI Integration Details

### Prisma STT (Speech-to-Text)
* **Endpoint:** `POST https://api.vachana.ai/stt/v3`
* **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`, `User-Agent: IND-voice/1.0`
* **Form Parameters:** `audio_file` (binary WAV/WebM), `model="prisma-v3.0"`, `language_code="indic-auto"`, `format="transcribe"`.
* **Output:** Transcript string, detected language code, processing latency.

### Timbre TTS (Text-to-Speech)
* **Endpoint:** `POST https://api.vachana.ai/api/v1/tts/inference`
* **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`, `Content-Type: application/json`
* **Payload:** `text`, `model="timbre-v3.0"`, `voice="Avinash"`, `language="hi-IN"`, `speed=1.0`.
* **Audio Container:** Gnani returns 16-bit linear PCM (`audio.raw`), which our backend automatically wraps into a standard RIFF WAVE stream for browser playback.

### Evon Model Integration Boundary
* **Model ID:** `gnani/gnani-evon-v3.3-30B-A3B` on Hugging Face.
* **Boundary:** Evon is an open 30B foundation model requiring an inference host (vLLM, SGLang, TGI). When `EVON_API_BASE_URL` is set, the system uses Evon for complex disambiguation; otherwise, our verified deterministic NLP engine handles real-time extraction with zero external latency.

---

## 6. Local Development Setup

### Prerequisites
* Python 3.11+
* Node.js 18+ and npm

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/hardikkaurani/IND-voice.git
cd IND-voice

# Create virtual environment
python -m venv backend/.venv
# Activate virtual environment (Windows):
backend\.venv\Scripts\activate
# Activate virtual environment (Linux/macOS):
source backend/.venv/bin/activate

# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed initial Kirana demo data
python -m app.db_seed

# Run tests
pytest tests/ -v

# Start FastAPI server (matching Render configuration)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend will be live at: `http://localhost:8000` (Swagger UI at `/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: `http://localhost:3000`.

---

## 7. Production Deployment Instructions

### Frontend on Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   * `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g. `https://ind-voice-api.onrender.com`).
4. Deploy.

### Backend on Render
1. Create a New Web Service from the repository on [Render](https://render.com).
2. Render automatically detects `render.yaml`:
   * **Service:** `ind-voice-api` (Python 3.11).
   * **Database:** `ind-voice-db` (PostgreSQL).
3. Set Secret Environment Variable in Render Dashboard:
   * `GNANI_API_KEY`: Your official Gnani Vachana API key.
4. Deploy.

---

## 8. License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
