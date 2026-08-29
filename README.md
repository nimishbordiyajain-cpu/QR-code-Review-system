# ReviewFlow AI 🚀

> **AI-Powered Customer Feedback, Authentic Google Review Generation, and Reputation Management Platform**

ReviewFlow AI is a modern SaaS platform designed to help physical and digital businesses elevate their Google Reviews organically while privately capturing and resolving constructive customer feedback. 

Using intelligent LLM review drafting (powered by Groq Llama 3.3 and Google Gemini), customers who have positive experiences can transform their authentic feedback into articulate, genuine review drafts with one click and post them directly to the business's Google Business Profile. Customers with negative feedback are gracefully routed to a private resolution inbox, preventing damaging public reviews and protecting the business's reputation.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Customer & Business Flow](#-customer--business-flow)
- [Environment Variables](#-environment-variables)
- [Getting Started (Local Dev)](#-getting-started-local-dev)
- [Deployment on Vercel](#-deployment-on-vercel)
- [Database & Security Rules](#-database--security-rules)
- [Serverless API Endpoints](#-serverless-api-endpoints)
- [Admin & Multi-Tenancy Management](#-admin--multi-tenancy-management)

---

## ✨ Key Features

### 1. 📱 Frictionless Customer Experience (Mobile-First)
- **Instant QR Code Access**: Customers scan table tents, receipts, or counter displays and land on a lightweight, branded feedback page.
- **Smart Experience Rating**: Intuitive 1-to-5 star rating selector.
- **AI Review Generation (4–5 Stars)**: Customers tap highlight tags (e.g., *Friendly Staff*, *Fast Service*, *Great Ambiance*) and the AI generates 3 distinct, authentic review drafts (Casual, Enthusiastic, Professional) ready to copy to Google Reviews in one click.
- **Private Feedback Capture (1–3 Stars)**: Constructive feedback and contact details are routed privately to the business dashboard, avoiding public 1-star reviews and enabling direct customer recovery.
- **Zero-Login Required for Customers**: Pure public submission with strict Firestore write-validation.

### 2. 📊 Business Dashboard & Analytics
- **Live Performance Metrics**: Real-time tracking of total scans, feedback submissions, Google Review redirect clicks, and conversion rates.
- **Interactive QR Code Generator**: Generate, customize, and download high-resolution QR codes with custom labels and table identifiers.
- **Customer Feedback Inbox**: Filter, search, read, and manage private customer feedback submissions.
- **AI Business Insights**: Automated sentiment analysis and actionable operational recommendations based on historical customer responses.
- **Multi-Category Customization**: Tailor highlight chips and questions specific to your business category (Café, Restaurant, Salon, Healthcare, Retail, etc.).

### 3. 🛡️ Super-Admin & Provisioning Console
- **Multi-Tenant Account Provisioning**: Super-admins can create and configure new business storefronts, assign owner emails, set daily generation limits, and define subscription terms (monthly, quarterly, yearly).
- **Automated Credential Generation**: Instant Firebase password-reset and initial onboarding links for new business owners.
- **Enquiry Management (CRM)**: Track prospective client leads from the landing page with status workflows (`new`, `contacted`, `converted`, `archived`).
- **Unified Serverless Architecture**: Consolidated admin dispatcher compliant with Vercel's Serverless Function quotas.

### 4. 🎮 Interactive Live Demo Mode
- Full sandbox environment featuring a pre-populated business (*Artisan Roast Café*) with realistic analytics, simulated QR codes, mock customer feedback, and live AI review generation.

---

## 🛠 Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────┐
│                     Client Application                    │
│      React 18 + TypeScript + Vite + Tailwind CSS          │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
    Direct Database / Auth          Serverless API Routes
               │                             │
┌──────────────▼──────────────┐ ┌────────────▼──────────────┐
│     Firebase Firestore      │ │  Vercel Serverless / Node │
│  - Businesses & Users       │ │  - /api/admin             │
│  - QR Codes & Feedback      │ │  - /api/generate-reviews  │
│  - Security Rules (RBAC)    │ │  - /api/business-insights │
└─────────────────────────────┘ └────────────┬──────────────┘
                                             │
                                ┌────────────▼──────────────┐
                                │       AI LLM Engine       │
                                │  - Groq (Llama 3.3 70B)   │
                                │  - Google Gemini 2.5/2.0  │
                                └───────────────────────────┘
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, HTML5 Canvas QR rendering
- **Backend / API**: Express (Local Dev Server) / Vercel Serverless Functions (`/api/*`)
- **AI Engines**: Groq (`llama-3.3-70b-versatile`) & Google GenAI SDK (`@google/genai`)
- **Authentication**: Firebase Authentication with custom claims (`admin: true`, `provisionedByAdmin: true`)
- **Database**: Cloud Firestore with field-validated security rules

---

## 📂 Directory Structure

```text
├── api/                        # Vercel Serverless API Functions (Max 7 for Hobby Plan compliance)
│   ├── _lib/                   # Shared backend utilities (Firebase Admin, rate limiting)
│   │   ├── firebaseAdmin.ts    # Firebase Admin SDK initialization & auth helpers
│   │   └── rateLimiter.ts      # Distributed IP & token rate limiter
│   ├── admin.ts                # Unified super-admin API dispatcher
│   ├── business-insights.ts    # AI business sentiment analysis endpoint
│   ├── generate-reviews.ts     # AI customer review generator endpoint
│   ├── health.ts               # Server health check endpoint
│   ├── submit-enquiry.ts       # Public storefront enquiry submission
│   ├── submit-feedback.ts      # Public customer feedback handler
│   └── sync-claims.ts          # Custom user claims synchronization
├── src/
│   ├── components/             # Reusable UI components (Navbar, Footer, Modals, Stars)
│   │   └── admin/              # Super-admin management modals & tables
│   ├── context/                # React Contexts (AuthContext, Admin state)
│   ├── pages/                  # Application views
│   │   ├── AdminPage.tsx       # Super-admin console
│   │   ├── CustomerFeedbackFlow.tsx # Public customer mobile feedback & review flow
│   │   ├── DashboardPage.tsx   # Business analytics dashboard
│   │   ├── DemoPage.tsx        # Interactive sandbox demo
│   │   ├── EnquiryPage.tsx     # Storefront inquiry form
│   │   ├── FeedbackListPage.tsx# Private customer feedback inbox
│   │   ├── LandingPage.tsx     # Public marketing homepage
│   │   ├── LoginPage.tsx       # Owner & Admin authentication
│   │   ├── OnboardingPage.tsx  # Initial business setup wizard
│   │   ├── QRManagementPage.tsx# QR code creator & manager
│   │   └── SettingsPage.tsx    # Storefront settings & profile management
│   ├── services/               # Frontend API & Firestore service modules
│   ├── types/                  # Shared TypeScript interfaces & types
│   ├── utils/                  # Helpers (Google Maps URL parser, sanitizers, categories)
│   ├── App.tsx                 # Main application routing & view coordinator
│   └── main.tsx                # Client entry point
├── firestore.rules             # Cloud Firestore security rules
├── vercel.json                 # Vercel deployment configuration & API rewrites
├── server.ts                   # Local Express development server
└── package.json                # Project dependencies & build scripts
```

---

## 🔄 Customer & Business Flow

### Customer Journey:
1. Customer scans a QR code generated for the storefront (`/r/[business-slug]/[qrId]`).
2. Customer selects a star rating (1 to 5 stars).
3. **If 4 or 5 Stars**:
   - Customer selects quick highlight chips describing their visit.
   - Customer clicks **"Draft My Review"**.
   - The AI generates 3 distinct, high-quality review suggestions.
   - Customer taps **"Copy & Post to Google"** which copies the review to clipboard and opens the business's direct Google Review dialog.
4. **If 1, 2, or 3 Stars**:
   - Customer is presented with a private feedback form with tags for areas of improvement.
   - Customer enters their private comments and optional contact info for follow-up.
   - Submission is logged directly to the business owner's private dashboard.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory (or configure these in your **Vercel Project Settings > Environment Variables**):

| Variable | Description | Required | Scope |
| :--- | :--- | :---: | :--- |
| `GROQ_API_KEY` | Groq API Key for ultra-fast Llama 3.3 review & insights generation | **Yes** | Server |
| `GEMINI_API_KEY` | Google Gemini API Key (Secondary/Fallback AI provider) | Optional | Server |
| `ADMIN_EMAILS` | Comma-separated list of super-admin emails authorized for admin privileges | **Yes** | Server |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full Firebase Service Account JSON string for Admin SDK | Optional | Server |
| `APP_URL` | Base public URL of your deployment (e.g. `https://your-domain.com`) | Optional | Server |
| `VITE_FIREBASE_API_KEY` | Firebase Client API Key (reads from config if omitted) | Optional | Client |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Client Auth Domain | Optional | Client |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Optional | Client |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket | Optional | Client |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | Optional | Client |

---

## 💻 Getting Started (Local Dev)

### Prerequisites
- **Node.js**: v20.x, v22.x, or v24.x
- **npm**: v10+

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/reviewflow-ai.git
   cd reviewflow-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and insert your GROQ_API_KEY, ADMIN_EMAILS, etc.
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Type Checking & Building**:
   ```bash
   # Run TypeScript typecheck
   npm run lint

   # Build production client bundle
   npm run build
   ```

---

## 🚀 Deployment on Vercel

This repository is pre-configured for **1-click deployment on Vercel** without exceeding Serverless Function plan quotas.

### Step-by-Step Deployment:

1. **Push to your GitHub repository**:
   ```bash
   git add .
   git commit -m "feat: ready for vercel deployment"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository.
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   In the Vercel project configuration, add:
   - `GROQ_API_KEY`
   - `ADMIN_EMAILS` (e.g. `your-email@gmail.com`)
   - `GEMINI_API_KEY` (if using Gemini)

4. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend into static assets and package the 7 API endpoints into serverless functions.

---

## 🔒 Database & Security Rules

All Firestore database access is governed by strict ownership and role-based policies (`firestore.rules`):

- **Public Access**: 
  - `businesses` and `qrCodes` are publicly readable so customers can view business metadata and scan QR codes.
  - `feedback` and `reviewClicks` allow unauthenticated creation with strict input validation rules (e.g., rating must be between 1 and 5).
- **Business Owner Scoping**: 
  - Business owners can only view, update, and manage QR codes and feedback belonging strictly to their verified `ownerId`.
- **Super-Admin Protection**: 
  - High-privilege collections (`enquiries`, `dailyUsage`, `rateLimits`) are locked from client writes and only accessible server-side via the Firebase Admin SDK or authenticated admin custom claims (`request.auth.token.admin == true`).

---

## 🌐 Serverless API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/generate-reviews` | `POST` | Generates 3 tailored customer review options based on selected rating and chips |
| `/api/business-insights`| `POST` | Analyzes customer sentiment and generates actionable business recommendations |
| `/api/submit-feedback`  | `POST` | Server-validated endpoint for customer feedback submissions |
| `/api/submit-enquiry`   | `POST` | Captures prospective client enquiries from the landing page |
| `/api/sync-claims`      | `POST` | Synchronizes user super-admin status and sets Firebase Auth claims |
| `/api/admin`            | `ALL`  | Consolidated admin actions (`create-business`, `update-business`, `reset-password`, `delete-business`, `get-usage`, `get-enquiries`, `update-enquiry`) |
| `/api/health`           | `GET`  | Health check endpoint returning system status and timestamp |

---

## 👑 Admin & Multi-Tenancy Management

To grant super-admin access to your account:
1. Add your email address to the `ADMIN_EMAILS` variable in `.env` (or Vercel Environment Variables).
2. Log into the application with that email address.
3. The platform will automatically sync your custom claims via `/api/sync-claims` and unlock the `/admin` navigation link.
4. From the **Admin Console**, you can provision new business clients, issue password reset links, set daily AI review generation limits, and monitor live API usage.

---

## 📄 License

This project is licensed under the MIT License.
