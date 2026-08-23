# ReviewFlow AI 🚀

A modern, authentic customer review generation and feedback platform for businesses. ReviewFlow AI empowers customers to share real feedback in seconds, generates personalized AI review drafts from their authentic experiences using Google Gemini, and helps businesses elevate their Google Reviews while privately managing constructive customer feedback.

---

## 🔒 Security & Architecture Best Practices

This repository has been configured with strict security guidelines:

1. **Zero Secret Leakage**:
   - `GEMINI_API_KEY` is maintained **strictly on the backend server** (`server.ts`) and is never sent or exposed to client browsers.
   - All `.env` and `.env.local` files, certificates, and service account keys are excluded in `.gitignore`.
   - Never commit real private keys or backend service account credentials to GitHub.

2. **DoS & Rate Limiting**:
   - The Express backend implements sliding-window IP rate limiting (40 requests/min) to prevent brute-force attacks and abuse.
   - Input payload sizes are capped at 100kb with aggressive input sanitization against prompt injection.

3. **Firestore Security Rules**:
   - Database rules (`firestore.rules`) enforce owner-only access for business edits and ensure public review submissions cannot modify other records.

---

## ⚙️ Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your required environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Running Locally

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```
