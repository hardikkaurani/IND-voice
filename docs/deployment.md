# Production Deployment Guide: Vercel & Render

This guide outlines step-by-step instructions to deploy IND-voice to production using **Render** (FastAPI backend + PostgreSQL) and **Vercel** (Next.js 15 frontend).

---

## 1. Backend & Database Deployment on Render

### Step A: Connect Repository & Deploy via Blueprint
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `https://github.com/hardikkaurani/IND-voice`.
4. Render automatically parses `render.yaml` to provision:
   * **Web Service:** `ind-voice-api` (Python 3.11 environment in `rootDir: backend`)
   * **PostgreSQL Database:** `ind-voice-db`
   * **Build Command:** `pip install -r requirements.txt && alembic upgrade head` (automatically executes all Alembic schema migrations before startup).
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step B: Configure Environment Variables
In the Render dashboard for `ind-voice-api`:
1. Navigate to **Environment**.
2. Add the secret key:
   * `GNANI_API_KEY`: `<your_gnani_vachana_api_key>` (kept strictly backend-only, never exposed in frontend).
   * `DATABASE_URL`: Automatically linked from `ind-voice-db` using internal connection string.
   * `CORS_ORIGINS`: `["https://ind-voice.vercel.app","http://localhost:3000"]`
3. Click **Save Changes** and trigger deploy.

### ⚠️ IMPORTANT: Render Free PostgreSQL Expiration & Backup Procedure
> **Notice on Render Free Tier Retention:**
> Free PostgreSQL databases on Render expire after **30 days**. Render does not provide automated backups on the free tier. Never assume free tier storage is permanent.

#### Database Backup & Export Procedure:
To safely backup your shopkeeper ledger data:
1. **Automated CSV Ledger Export:**
   Merchants can click **Export Statement (CSV)** directly from the `/history` screen to download a timestamped CSV of all transactions.
2. **PostgreSQL Dump (`pg_dump`):**
   Run the following command using the External Connection String from your Render database dashboard:
   ```bash
   pg_dump "postgres://ind_voice_user:<PASSWORD>@<EXTERNAL_HOST>.render.com/ind_voice" > ind_voice_backup_$(date +%F).sql
   ```
3. **Restoring to a New Database:**
   ```bash
   psql "postgres://<NEW_USER>:<PASSWORD>@<NEW_HOST>/ind_voice" < ind_voice_backup_2026-11-10.sql
   ```

---

## 2. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import `https://github.com/hardikkaurani/IND-voice`.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_BASE_URL`: Your Render backend service URL (e.g. `https://ind-voice-api.onrender.com`).
   * (Alternatively `NEXT_PUBLIC_API_URL` is also supported as a fallback).
6. Click **Deploy**.

---

## 3. Post-Deployment Verification

1. **Backend Health Check:**
   ```bash
   curl -i https://ind-voice-api.onrender.com/health
   # Expected: HTTP 200 OK
   # {
   #   "status": "healthy",
   #   "database": {"status": "connected", "driver": "postgresql"},
   #   "app": "IND-voice",
   #   "version": "1.0.0"
   # }
   ```

2. **Frontend End-to-End Verification:**
   * Open `https://ind-voice.vercel.app` in your browser.
   * Check the split-screen login page with background video and institutional theme.
   * Click **Launch Instant Kirana Merchant Demo** to enter.
   * Click **Speak Transaction** and grant microphone permissions.
   * Speak: *"Rahul ko paanch sau rupaye udhaar diye"*.
   * Verify the original transcript and editable transaction review card.
   * Click **Confirm & Save**.
   * Verify atomic ledger update and listen to spoken audio confirmation via Gnani Timbre TTS!
