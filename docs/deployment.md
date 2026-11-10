# Production Deployment Guide: Vercel & Render

This guide outlines step-by-step instructions to deploy IND-voice to production using **Render** (FastAPI backend + PostgreSQL) and **Vercel** (Next.js 15 frontend).

---

## 1. Backend & Database Deployment on Render

### Step A: Connect Repository
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `https://github.com/hardikkaurani/IND-voice`.
4. Render automatically parses `render.yaml` to provision:
   * **Web Service:** `ind-voice-api`
   * **PostgreSQL Database:** `ind-voice-db`

### Step B: Configure Secret Environment Variables
In the Render dashboard for `ind-voice-api`:
1. Navigate to **Environment**.
2. Add the secret key:
   * `GNANI_API_KEY`: `vach_1ytE2CY5X2PpTSkjUGV8kLW9KIHYQyCNYAPKS31WjE32KBAvotI9UTwi4PwPRvadmUJMjyeZstmsiHn8jpAeYnwHHftXoyiu_c33505d73045cfb8a72723c706a18da5`
3. Click **Save Changes** and trigger deploy.

---

## 2. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import `https://github.com/hardikkaurani/IND-voice`.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: Your Render backend service URL (e.g. `https://ind-voice-api.onrender.com`).
6. Click **Deploy**.

---

## 3. Post-Deployment Verification

1. **Backend Health Check:**
   ```bash
   curl -i https://ind-voice-api.onrender.com/health
   # Expected: {"status":"healthy","app":"IND-voice",...}
   ```

2. **Frontend End-to-End Verification:**
   * Open `https://ind-voice.vercel.app` in your browser.
   * Verify the video hero login page plays smoothly with zero element overlap.
   * Click **Launch Instant Kirana Merchant Demo** to enter.
   * Click **Speak Transaction** and grant microphone permissions.
   * Speak: *"Rahul ko paanch sau rupaye udhaar diye"*.
   * Verify transcription, check the human confirmation dialog, and click **Confirm & Record**.
   * Listen to the synthesized voice confirmation from Gnani Timbre TTS!
