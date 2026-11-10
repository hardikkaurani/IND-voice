# IND-voice (बोल कर लिखो)

> **Multilingual Voice-First Business Ledger and Financial Intelligence Platform for Indian Small Merchants**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119-009688)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_Alembic-336791)](https://www.postgresql.org/)
[![Gnani AI](https://img.shields.io/badge/Gnani_AI-Prisma_v3.0_%26_Timbre_v2.5-orange)](https://vachana.ai)
[![Design System](https://img.shields.io/badge/Design_System-Morgan_Stanley_Institutional-2075CC)](design.md)

---

## 1. Product Vision

Small retailers, Kirana shopkeepers, and local distributors across India handle dozens of daily credit (*udhaar*) and payment (*jama*) transactions. Typing these transactions during busy store hours is inconvenient, error-prone, and fraught with literacy or language friction.

**IND-voice** turns merchant record-keeping into a reliable, voice-driven experience:
1. **Speak Naturally:** The merchant speaks in Hindi, Hinglish, Marathi, or English (*"Rahul ko paanch sau rupaye udhaar diye"*, *"Amit ne do sau rupaye wapas kiye"*).
2. **Understand Accurately:** Transcribed in real-time via **Gnani Prisma v3.0 STT** using `codemix` output mode and extracted with our deterministic linguistic engine.
3. **Confirm Explicitly:** The parsed transaction is shown for human verification. No AI output directly modifies records without explicit shopkeeper confirmation.
4. **Record Reliably:** Commits atomically to a PostgreSQL ledger with integer paise precision and synthesizes spoken voice confirmation via **Gnani Timbre v2.5 TTS** (`Kaveri`).

---

## 2. Architecture & API Workflow

```
[ Browser / Kirana Merchant ]
         │
         ▼ 1. MediaRecorder (WAV/WebM)
[ Next.js 15 App Frontend ]
         │
         ▼ 2. POST /api/voice/process-audio
[ FastAPI Backend Gateway ]
         │
         ├──► 3. POST https://api.vachana.ai/stt/v3 (Prisma v3.0, indic-auto, codemix)
         │       └── Returns: Clean Transcript
         │
         ├──► 4. Linguistic Extraction Engine
         │       └── Extracts: Customer, Amount (paise), Direction (CREDIT / PAYMENT)
         │
         ▼ 5. Review & Human Confirmation Screen (Frontend)
   Merchant approves transaction details
         │
         ▼ 6. POST /api/transactions/confirm (Atomic Transaction)
[ PostgreSQL Database (Render) ]
         │
         ├──► Customer Balance Updated (Outstanding = Sum(Credit) - Sum(Payment))
         ├──► Transaction Created (Idempotency Key protected)
         └──► AuditLog Created (Immutable trace)
         │
         ▼ 7. POST https://api.vachana.ai/api/v1/tts/inference (Timbre v2.5, Kaveri, WAV)
[ Spoken Confirmation Audio ]
         │
         ▼ 8. Playback in Browser + Written Statement Fallback
```

---

## 3. Financial Invariants & Correctness (Non-Negotiable)

1. **Integer Arithmetic:** All monetary amounts are strictly stored as integer `paise` (1 INR = 100 paise). Floating-point arithmetic for financial calculations is strictly avoided.
2. **Double-Entry Balance Invariant:**
   $$\text{Customer Outstanding Balance} = \sum \text{CREDIT} - \sum \text{PAYMENT}$$
   * Positive balance = Customer owes money to merchant (*Baaki / Udhaar*).
   * Negative balance = Customer has paid an advance deposit.
   * Zero balance = Settled (*Hisab barabar*).
3. **Idempotency Protection:** Every transaction submission accepts an optional `idempotency_key` ensuring network retries never record duplicate charges.
4. **Atomic Transactions:** Customer balance updates, transaction entries, and audit logs are committed within a single database transaction block with rollback protection.
5. **Strict Validation:** Rejects ambiguous amounts, missing customer names, invalid directions, zero and negative amounts without guessing.

---

## 4. Gnani AI Integration Details

### Prisma STT (Speech-to-Text v3.0)
* **Endpoint:** `POST https://api.vachana.ai/stt/v3`
* **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`, `User-Agent: IND-voice/1.0`
* **Form Parameters:** 
  * `audio_file`: Browser-recorded audio stream (WAV, WebM, MP3, M4A, OGG).
  * `model`: `"prisma-v3.0"`
  * `language_code`: `"indic-auto"` (multilingual auto-detection across Indian languages).
  * `format`: `"codemix"` (keeps English brand/product words in Latin script and regional words in native script for maximum legibility).
* **Privacy:** Audio bytes and raw customer transcripts are never logged in plaintext.

### Timbre TTS (Text-to-Speech v2.5)
* **Endpoint:** `POST https://api.vachana.ai/api/v1/tts/inference`
* **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`, `Content-Type: application/json`
* **Payload:** 
  * `model`: `"timbre-v2.5"`
  * `voice`: `"Kaveri"` (verified voice supporting Hindi, English, and Marathi).
  * `language`: `"hi-IN"` (or `"en-IN"` / `"mr-IN"`).
  * `speed`: `1.0`
  * `audio_config`: `{"container": "wav", "encoding": "linear_pcm", "sample_rate": 24000, "num_channels": 1, "sample_width": 2}`
* **Direct Audio Format:** Gnani returns a valid WAV container when `container: "wav"` is passed; the backend encodes it to standard base64 for browser playback without double-wrapping.
* **Failure Isolation:** Voice confirmation is generated **after** the transaction is committed to PostgreSQL. If TTS fails, the transaction remains safe, and an on-screen text confirmation statement is displayed.

---

## 5. PostgreSQL & Database Migrations

### Render Free PostgreSQL Retention Notice
> ⚠️ **Free Tier 30-Day Expiration:**
> Free PostgreSQL instances on Render expire after **30 days**. Render does not provide automated backups on the free tier.
> 
> **Backup Procedure:**
> 1. In the app: Navigate to `/history` and click **Export Statement (CSV)** for an immediate data export.
> 2. Via CLI: Use `pg_dump` with your external database connection string:
>    ```bash
>    pg_dump "postgres://user:password@host.render.com/ind_voice" > backup_$(date +%F).sql
>    ```

### Alembic Migration Commands
```bash
# In backend/ directory:
# Run all pending migrations to head
alembic upgrade head

# Rollback last migration if needed
alembic downgrade -1
```

---

## 6. Local Development Setup

### Prerequisites
* Python 3.11+
* Node.js 18+ and npm
* PostgreSQL (or fallback SQLite for local dev)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed demo Kirana dataset (Rahul, Amit, Suresh, Pooja)
python -m app.db_seed

# Run comprehensive test suite
pytest tests/ -v

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend will be live at `http://localhost:8000` (Interactive docs at `/docs`, Health check at `/health`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

## 7. Demo Script (Evaluation Guide)

Follow this step-by-step evaluation script to test the complete voice-ledger workflow:

### Scenario 1: Hindi Credit Transaction (Udhaar)
1. Open the app (`https://ind-voice.vercel.app` or `http://localhost:3000`).
2. Log in or click **Launch Instant Kirana Merchant Demo**.
3. Click the blue **Speak Transaction** button.
4. Click the microphone and speak:
   > *"Rahul ko paanch sau rupaye udhaar diye"*
5. Observe the real-time transcription and review screen:
   * **Customer:** Rahul
   * **Amount:** ₹500.00 (50,000 paise)
   * **Direction:** Udhaar (CREDIT)
6. Click **Confirm & Save**.
7. Hear the synthesized Hindi spoken confirmation:
   > *"Rahul ko 500 rupaye udhaar likh diye gaye hain. Kul baaki ... rupaye hai."*
8. Notice Rahul's updated ledger balance on the dashboard.

### Scenario 2: Hinglish Payment Transaction (Jama / Wapas)
1. Click **Speak Transaction**.
2. Click the microphone and speak:
   > *"Amit ne do sau rupaye wapas kiye"*
3. Review screen shows:
   * **Customer:** Amit
   * **Amount:** ₹200.00 (20,000 paise)
   * **Direction:** Jama (PAYMENT)
4. Click **Confirm & Save**.
5. Listen to spoken confirmation:
   > *"Amit se 200 rupaye jama kar liye gaye hain. Ab bacha hua baaki ... rupaye hai."*
6. Check `/history` to see both transactions with audit timestamps and download the CSV statement.

---

## 8. Known Limitations Honestly Documented

1. **Synchronous Audio Duration:** Gnani Prisma v3.0 REST endpoint handles audio clips up to 30 seconds. For merchant transactions (typically 3–8 seconds), this is optimal; longer recordings should be split.
2. **Render Free Tier Expiration:** Free Render PostgreSQL instances expire in 30 days. Regular CSV exports or a paid Render PostgreSQL plan are required for permanent business ledgers.
3. **Noisy Street Backgrounds:** Extreme background ambient noise (e.g. traffic horns >80dB) can affect STT confidence. The explicit human confirmation screen ensures shopkeepers always verify extracted amounts before records are committed.

---

## 9. License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
