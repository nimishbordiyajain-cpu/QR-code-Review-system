# ReviewFlow AI 🚀

A modern, authentic customer review generation and feedback platform for businesses. ReviewFlow AI empowers customers to share real feedback in seconds, generates personalized AI review drafts from their authentic experiences using Google Gemini, and helps businesses elevate their Google Reviews while privately managing constructive customer feedback.

---

## 🚀 Deploy to Vercel (1-Click Ready)

This repository is optimized out-of-the-box for **Vercel**:
- **SPA Routing**: Configured via `vercel.json` with fallback rewriting to `/index.html`.
- **Serverless API Routes**: `/api/generate-reviews`, `/api/business-insights`, and `/api/health` automatically run as Vercel Serverless Functions.
- **Client Zero-Downtime Fallback**: If serverless functions are disabled or unconfigured, the app automatically generates deterministic, high-quality review suggestions client-side without errors.

### Vercel Deployment Steps:

1. **Push to GitHub**:
   - Push this repository to your GitHub account (e.g. `https://github.com/your-username/reviewflow-ai`).

2. **Import Project into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.
   - Framework Preset: **Vite** (automatically detected).
   - Build Command: `vite build` (or leave default).
   - Output Directory: `dist` (default).

3. **Configure Environment Variables in Vercel Dashboard** *(Optional but recommended)*:
   Under **Project Settings > Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*

4. **Click Deploy**:
   - Your app will be live globally on your `*.vercel.app` domain with instant HTTPS!

---

## 🔒 Security & Architecture Best Practices

1. **Zero Secret Leakage**:
   - `GEMINI_API_KEY` is maintained **strictly in backend serverless functions** and is never sent or exposed to client browsers.
   - All `.env` and `.env.local` files, certificates, and service account keys are excluded in `.gitignore`.

2. **Firestore Security Rules**:
   - Database rules (`firestore.rules`) enforce owner-only access for business edits and ensure public review submissions cannot modify other records.

---

## ⚙️ Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 💻 Running Locally

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build and test locally:
```bash
npm run build
npm start
```
