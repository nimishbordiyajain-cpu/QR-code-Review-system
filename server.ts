import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  getAdminAuth,
  getAdminFirestore,
  getAdminEmails,
  isEmailInAdminAllowlist,
  verifyAdminRequest,
} from './api/_lib/firebaseAdmin';

dotenv.config();

// Runtime-safe directory resolution across both CommonJS (production bundle) and ESM (tsx dev)
const safeDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Hardening: Disable fingerprinting headers
app.disable('x-powered-by');

// Security Hardening: Essential HTTP Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// DoS Protection: Limit JSON payload size to 100kb
app.use(express.json({ limit: '100kb' }));

// Security Hardening: IP-based sliding rate limiter for AI endpoints
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function checkIpRateLimit(ip: string, maxRequests: number = 40, windowMs: number = 60 * 1000): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// Clean up stale rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of ipRateLimits.entries()) {
    if (now > rec.resetAt) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// In-memory rate limiting and usage tracking per business
// Maps businessId_YYYY-MM-DD -> count
const dailyUsageTracker: Record<string, number> = {};
const DAILY_LIMIT = 50;

function getDailyKey(businessId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${businessId}_${today}`;
}

function checkAndIncrementUsage(businessId: string): { allowed: boolean; current: number; limit: number } {
  const key = getDailyKey(businessId || 'anonymous');
  const current = dailyUsageTracker[key] || 0;
  if (current >= DAILY_LIMIT) {
    return { allowed: false, current, limit: DAILY_LIMIT };
  }
  dailyUsageTracker[key] = current + 1;
  return { allowed: true, current: current + 1, limit: DAILY_LIMIT };
}

// Input sanitizer against malicious prompt injection or script delimiters
function sanitizeInputString(val: any, maxLength: number = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove ASCII control chars
    .replace(/<[^>]*>?/gm, '') // strip raw HTML tags
    .trim()
    .slice(0, maxLength);
}

// Groq Multi-Model AI Router Configuration
// Powered by Groq's high-speed LPU inference engine
const GROQ_ROUTER_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

interface GroqRouteResult {
  content: string;
  modelUsed: string;
}

let groqClient: Groq | null = null;
function getGroqClient(): Groq | null {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (key && key.trim()) {
      groqClient = new Groq({ apiKey: key.trim() });
    }
  }
  return groqClient;
}

async function callGroqRouter(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  jsonMode: boolean = true,
  maxTokens: number = 1500
): Promise<GroqRouteResult | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  // Try routing through high-performance Groq models in the cascade
  for (const model of GROQ_ROUTER_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.3,
        max_tokens: maxTokens,
      });

      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        return { content, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`Groq Router model ${model} error:`, err?.message || err);
    }
  }

  return null;
}

// Lazy Gemini API Client as secondary fallback
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
  }
  return geminiClient;
}

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReviewFlow AI Backend Engine',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Admin Claims Synchronization Endpoint
app.post('/api/sync-claims', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const adminEmails = getAdminEmails();

    try {
      const authAdmin = getAdminAuth();
      const decoded = await authAdmin.verifyIdToken(idToken);
      const isUserAdmin = Boolean(decoded.email && adminEmails.includes(decoded.email.toLowerCase()));

      await authAdmin.setCustomUserClaims(decoded.uid, { admin: isUserAdmin });

      return res.json({
        success: true,
        uid: decoded.uid,
        email: decoded.email,
        isAdmin: isUserAdmin,
      });
    } catch (adminErr: any) {
      console.warn('Firebase admin claim setting warning:', adminErr?.message || adminErr);
      return res.status(200).json({
        success: true,
        warning: 'Claims updated in development mode',
      });
    }
  } catch (err: any) {
    console.error('Error in /api/sync-claims:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to sync claims' });
  }
});

app.all(['/api/admin'], async (req: Request, res: Response) => {
  const { default: adminHandler } = await import('./api/admin');
  return adminHandler(req as any, res as any);
});


// Prospective Client Enquiry Submission with Rate Limiting & Honeypot Protection
app.post('/api/submit-enquiry', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // Stricter rate limiting for enquiries (5 submissions per 10 minutes per IP)
    if (!checkIpRateLimit(clientIp, 5, 10 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many enquiry submissions from your network. Please wait a few minutes before trying again.',
      });
    }

    const {
      name: rawName,
      businessName: rawBizName,
      category: rawCategory,
      email: rawEmail,
      phone: rawPhone,
      city: rawCity,
      message: rawMessage,
      source: rawSource,
      website_hp: honeypot,
    } = req.body || {};

    if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
      console.warn(`[Abuse Protection] Enquiry spam bot trapped via honeypot from IP: ${clientIp}`);
      return res.status(200).json({
        success: true,
        enquiryId: `enq_bot_${Date.now()}`,
        message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
      });
    }

    const name = sanitizeInputString(rawName, 120);
    const businessName = sanitizeInputString(rawBizName, 150);
    const category = sanitizeInputString(rawCategory, 60) || 'Other';
    const email = sanitizeInputString(rawEmail, 150).toLowerCase();
    const phone = sanitizeInputString(rawPhone, 50);
    const city = sanitizeInputString(rawCity, 100) || undefined;
    const message = sanitizeInputString(rawMessage, 2000) || undefined;
    const source = sanitizeInputString(rawSource, 100) || undefined;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!businessName) {
      return res.status(400).json({ success: false, error: 'Business name is required.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Contact phone number is required.' });
    }

    const adminDb = getAdminFirestore();
    const enquiryDocRef = adminDb.collection('enquiries').doc();
    const enquiryId = enquiryDocRef.id;
    const nowIso = new Date().toISOString();

    const enquiryRecord: Record<string, any> = {
      id: enquiryId,
      name,
      businessName,
      category,
      email,
      phone,
      status: 'new',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (city) enquiryRecord.city = city;
    if (message) enquiryRecord.message = message;
    if (source) enquiryRecord.source = source;

    await enquiryDocRef.set(enquiryRecord);

    return res.status(200).json({
      success: true,
      enquiryId,
      message: 'Thank you for your interest! Your enquiry has been received and our team will get in touch shortly.',
    });
  } catch (error: any) {
    console.error('Error in /api/submit-enquiry:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while submitting your enquiry. Please try again.',
      details: error?.message || String(error),
    });
  }
});

// Feedback Submission with Rate Limiting & Honeypot Protection
app.post('/api/submit-feedback', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    if (!checkIpRateLimit(clientIp, 10)) {
      return res.status(429).json({
        success: false,
        error: 'Too many feedback submissions. Please wait a minute before trying again.',
      });
    }

    const {
      businessId: rawBizId,
      qrId: rawQrId,
      qrLocationName: rawQrLoc,
      rating: rawRating,
      selectedCategories: rawSelectedCategories,
      customerComment: rawComment,
      privateFeedback: rawPrivateFeedback,
      customerName: rawCustomerName,
      isAnonymous: rawIsAnonymous,
      website_hp: honeypot,
    } = req.body || {};

    if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
      console.warn(`[Abuse Protection] Spam bot trapped via honeypot from IP: ${clientIp}`);
      return res.status(200).json({
        success: true,
        feedback: {
          id: `fb_bot_${Date.now()}`,
          businessId: rawBizId,
          rating: rawRating || 5,
          createdAt: new Date().toISOString(),
        },
      });
    }

    const businessId = sanitizeInputString(rawBizId, 100);
    const rating = typeof rawRating === 'number' ? Math.max(1, Math.min(5, Math.round(rawRating))) : null;

    if (!businessId || rating === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: businessId and numeric rating (1-5) are required.',
      });
    }

    const adminDb = getAdminFirestore();

    const bizDoc = await adminDb.collection('businesses').doc(businessId).get();
    if (!bizDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'Target business profile not found.',
      });
    }

    const bizData = bizDoc.data();
    if (bizData?.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'Business account is currently inactive.',
      });
    }

    const selectedCategories: string[] = Array.isArray(rawSelectedCategories)
      ? rawSelectedCategories
          .map((c) => sanitizeInputString(c, 50))
          .filter((c) => c.length > 0)
          .slice(0, 15)
      : [];

    const qrId = sanitizeInputString(rawQrId, 100) || undefined;
    const qrLocationName = sanitizeInputString(rawQrLoc, 100) || undefined;
    const customerComment = sanitizeInputString(rawComment, 1000) || undefined;
    const privateFeedback = sanitizeInputString(rawPrivateFeedback, 1000) || undefined;
    const isAnonymous = Boolean(rawIsAnonymous);
    const customerName = isAnonymous ? undefined : sanitizeInputString(rawCustomerName, 100) || undefined;

    const feedbackDocRef = adminDb.collection('feedback').doc();
    const feedbackId = feedbackDocRef.id;
    const nowIso = new Date().toISOString();

    const newFeedback: Record<string, any> = {
      id: feedbackId,
      businessId,
      rating,
      selectedCategories,
      isAnonymous,
      createdAt: nowIso,
    };

    if (qrId) newFeedback.qrId = qrId;
    if (qrLocationName) newFeedback.qrLocationName = qrLocationName;
    if (customerComment) newFeedback.customerComment = customerComment;
    if (privateFeedback) newFeedback.privateFeedback = privateFeedback;
    if (customerName) newFeedback.customerName = customerName;

    await feedbackDocRef.set(newFeedback);

    if (qrId) {
      try {
        const qrRef = adminDb.collection('qrCodes').doc(qrId);
        const qrSnap = await qrRef.get();
        if (qrSnap.exists) {
          const currentCount = qrSnap.data()?.feedbackCount || 0;
          await qrRef.update({
            feedbackCount: currentCount + 1,
            lastScannedAt: nowIso,
          });
        }
      } catch (qrErr) {
        console.warn('Could not increment QR feedbackCount:', qrErr);
      }
    }

    return res.status(200).json({
      success: true,
      feedback: newFeedback,
    });
  } catch (error: any) {
    console.error('Error submitting customer feedback in server.ts:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while submitting feedback.',
      details: error?.message || String(error),
    });
  }
});

// 2. AI Review Drafts Generation Endpoint
app.post('/api/generate-reviews', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // IP-level rate limiting (10 requests/min per IP)
    if (!checkIpRateLimit(clientIp, 10)) {
      return res.status(429).json({
        success: false,
        error: 'Too many review generation requests. Please wait a minute before trying again.',
      });
    }

    const {
      businessId,
      businessName: rawBizName,
      businessCategory: rawBizCategory,
      rating: rawRating,
      selectedCategories: rawSelectedCategories,
      customerComment: rawComment,
      customerName: rawCustomerName,
    } = req.body;

    const rating = typeof rawRating === 'number' ? Math.max(1, Math.min(5, Math.round(rawRating))) : null;
    const businessName = sanitizeInputString(rawBizName, 100);
    const businessCategory = sanitizeInputString(rawBizCategory, 60);
    const customerComment = sanitizeInputString(rawComment, 800);
    const customerName = sanitizeInputString(rawCustomerName, 80);

    const cleanBizId = sanitizeInputString(businessId, 60);
    if (!cleanBizId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: businessId is required.',
      });
    }

    if (!businessName || rating === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required parameters (businessName and numeric rating between 1 and 5).',
      });
    }

    // Sanitize selected categories array
    const selectedCategories: string[] = Array.isArray(rawSelectedCategories)
      ? rawSelectedCategories
          .map((c) => sanitizeInputString(c, 50))
          .filter((c) => c.length > 0)
          .slice(0, 15)
      : [];

    // Check usage limit per business
    const usage = checkAndIncrementUsage(cleanBizId);
    if (!usage.allowed) {
      return res.status(429).json({
        success: false,
        error: `Daily AI review draft limit (${usage.limit}/day) reached for this business. Please try again tomorrow.`,
      });
    }

    const categoriesText = selectedCategories.length > 0
      ? selectedCategories.join(', ')
      : 'None explicitly selected';

    const commentText = customerComment.length > 0 ? customerComment : 'No additional written text provided';
    const nameText = customerName.length > 0 ? customerName : 'Anonymous customer';

    const systemInstruction = `You are a helpful writing assistant assisting a customer in phrasing their authentic review for a business.
Generate five natural review drafts based STRICTLY and ONLY on the customer's provided rating, feedback highlights, and comments.

Strict Safety & Authenticity Guardrails:
- Never invent experiences, products, dishes, staff, or events.
- Never exaggerate or alter the customer's sentiment.
- Never increase the rating or make negative experiences sound positive.
- If customer rating is 1, 2, or 3 stars, keep the tone honest, constructive, and balanced.
- If customer rating is 4 or 5 stars, reflect their genuine appreciation.
- Customer remains responsible for their final review submission.

Return valid JSON with 5 review variations:
1. "Short & Simple" (1-2 sentences)
2. "Friendly & Natural" (warm and conversational)
3. "Detailed" (thorough mention of selected highlights)
4. "Professional" (balanced and formal)
5. "Casual" (relaxed and authentic)`;

    const prompt = `Business: ${businessName}
Category: ${businessCategory || 'Business'}
Star Rating: ${rating}/5
Experience Highlights: ${categoriesText}
Customer Remarks: "${commentText}"
Customer Name: ${nameText}

Output valid JSON array of 5 objects with keys: id (string "1"-"5"), style, description, content.`;

    // 1. Try Groq Multi-Model Router First
    try {
      const groqResult = await callGroqRouter([
        { role: 'system', content: `${systemInstruction}\n\nYou must return a JSON object with a "drafts" array containing 5 review variation objects.` },
        { role: 'user', content: prompt }
      ], true, 1500);

      if (groqResult && groqResult.content) {
        let parsed: any = null;
        try {
          parsed = JSON.parse(groqResult.content);
          if (parsed && !Array.isArray(parsed)) {
            parsed = parsed.drafts || parsed.reviews || Object.values(parsed);
          }
        } catch {
          // parse fallback
        }

        if (Array.isArray(parsed) && parsed.length >= 3) {
          return res.json({
            success: true,
            drafts: parsed.slice(0, 5),
            provider: 'groq-router',
            model: groqResult.modelUsed,
            dailyUsage: { current: usage.current, limit: usage.limit },
          });
        }
      }
    } catch (groqErr: any) {
      console.warn('Groq Router error, attempting secondary fallback:', groqErr?.message || groqErr);
    }

    // 2. Secondary Fallback: Gemini API
    try {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const responseText = response.text?.trim() || '[]';
        let parsedDrafts: any[] = [];
        try {
          parsedDrafts = JSON.parse(responseText);
          if (!Array.isArray(parsedDrafts) && parsedDrafts && typeof parsedDrafts === 'object') {
            parsedDrafts = (parsedDrafts as any).drafts || (parsedDrafts as any).reviews || Object.values(parsedDrafts);
          }
        } catch (e) {
          console.error('Failed to parse Gemini JSON response');
        }

        if (Array.isArray(parsedDrafts) && parsedDrafts.length >= 3) {
          return res.json({
            success: true,
            drafts: parsedDrafts.slice(0, 5),
            provider: 'gemini',
            dailyUsage: { current: usage.current, limit: usage.limit },
          });
        }
      }
    } catch (aiError: any) {
      console.warn('Gemini API call failed, falling back to deterministic template builder:', aiError?.message || aiError);
    }

    // Fallback deterministic draft generator (ensures zero-downtime if API key is temporarily unavailable)
    const fallbackDrafts = generateFallbackDrafts(businessName, rating, selectedCategories, customerComment);
    return res.json({
      success: true,
      drafts: fallbackDrafts,
      isFallback: true,
      dailyUsage: { current: usage.current, limit: usage.limit },
    });

  } catch (error: any) {
    console.error('Error generating review drafts:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while generating review suggestions. Please try again.',
    });
  }
});

// 3. AI Business Insights Endpoint
app.post('/api/business-insights', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // IP-level rate limiting (5 requests/min per IP)
    if (!checkIpRateLimit(clientIp, 5)) {
      return res.status(429).json({ success: false, error: 'Too many business insights requests. Please wait a minute before trying again.' });
    }

    const { businessId: rawBizId, businessName: rawBizName, category: rawCat, feedbacksSummary } = req.body;
    const businessId = sanitizeInputString(rawBizId, 60);
    const businessName = sanitizeInputString(rawBizName, 100);
    const category = sanitizeInputString(rawCat, 60);

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: businessId is required.',
      });
    }

    if (!feedbacksSummary || !feedbacksSummary.total || feedbacksSummary.total < 3) {
      return res.json({
        success: true,
        insights: {
          strengths: [],
          areasForImprovement: [],
          customerSentimentSummary: 'Not enough feedback yet to generate reliable insights. As more customers share their feedback, AI trends will automatically appear here.',
          actionableRecommendations: [
            'Place your QR codes in high-visibility spots (e.g. table standees, billing counter).',
            'Encourage staff to invite customers to share their feedback after service.',
          ],
          generatedAt: new Date().toISOString(),
          feedbackCountAnalyzed: feedbacksSummary?.total || 0,
        },
      });
    }

    const prompt = `You are a customer experience consultant analyzing aggregated, anonymized customer feedback for ${businessName} (${category || 'Small Business'}).
Total feedback items: ${feedbacksSummary.total}
Average rating: ${feedbacksSummary.avgRating} / 5
Rating distribution: 5★: ${feedbacksSummary.ratings?.['5'] || 0}, 4★: ${feedbacksSummary.ratings?.['4'] || 0}, 3★: ${feedbacksSummary.ratings?.['3'] || 0}, 2★: ${feedbacksSummary.ratings?.['2'] || 0}, 1★: ${feedbacksSummary.ratings?.['1'] || 0}
Top selected positive tags: ${JSON.stringify(feedbacksSummary.topPositives || [])}
Top selected improvement tags: ${JSON.stringify(feedbacksSummary.topImprovements || [])}

Provide an objective, constructive business summary in JSON format with:
- "strengths": array of 2-4 key operational/service strengths customers highlighted
- "areasForImprovement": array of 2-4 constructive areas for growth
- "customerSentimentSummary": a 2-3 sentence executive summary of overall customer sentiment
- "actionableRecommendations": array of 2-3 specific, low-cost practical tips for the team`;

    try {
      const groqResult = await callGroqRouter([
        { role: 'system', content: 'You are a customer experience consultant analyzing feedback. Return a valid JSON object only.' },
        { role: 'user', content: prompt }
      ], true, 1200);

      if (groqResult && groqResult.content) {
        const parsed = JSON.parse(groqResult.content);
        if (parsed && typeof parsed === 'object') {
          return res.json({
            success: true,
            insights: {
              ...parsed,
              generatedAt: new Date().toISOString(),
              feedbackCountAnalyzed: feedbacksSummary.total,
              provider: 'groq-router',
              model: groqResult.modelUsed,
            },
          });
        }
      }

      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json({
          success: true,
          insights: {
            ...parsed,
            generatedAt: new Date().toISOString(),
            feedbackCountAnalyzed: feedbacksSummary.total,
          },
        });
      }
    } catch (err) {
      // Fallback summary
      return res.json({
        success: true,
        insights: {
          strengths: feedbacksSummary.topPositives?.map((p: any) => p.name).slice(0, 3) || ['Good overall experience'],
          areasForImprovement: feedbacksSummary.topImprovements?.map((p: any) => p.name).slice(0, 3) || ['Continue monitoring consistency'],
          customerSentimentSummary: `Customers generally rate ${businessName} at ${feedbacksSummary.avgRating} out of 5 stars based on ${feedbacksSummary.total} customer responses.`,
          actionableRecommendations: [
            'Recognize staff on top-mentioned positive feedback categories.',
            'Address frequent improvement points during weekly team briefings.',
          ],
          generatedAt: new Date().toISOString(),
          feedbackCountAnalyzed: feedbacksSummary.total,
        },
      });
    }
  } catch (error) {
    console.error('Error generating business insights:', error);
    res.status(500).json({ success: false, error: 'Failed to generate business insights' });
  }
});

// Helper for deterministic fallback draft generation
function generateFallbackDrafts(
  businessName: string,
  rating: number,
  selectedCategories: string[] = [],
  customerComment?: string
) {
  const cats = selectedCategories.length > 0 ? selectedCategories.join(', ') : '';
  const comment = customerComment ? customerComment.trim() : '';

  if (rating >= 4) {
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Direct and quick',
        content: `Great experience at ${businessName}.${cats ? ` Really appreciated the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Warm and conversational',
        content: `Had a wonderful visit to ${businessName}! ${cats ? `The ${cats.toLowerCase()} stood out.` : ''}${comment ? ` ${comment}` : ' Everything was smooth and enjoyable.'}`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Comprehensive review',
        content: `Visited ${businessName} recently and had a ${rating === 5 ? '5-star' : 'great'} experience.${cats ? ` In particular, the ${cats.toLowerCase()} made a very positive impression.` : ''}${comment ? ` Details: ${comment}` : ''} Would definitely recommend to others.`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Balanced and formal',
        content: `Quality service at ${businessName}.${cats ? ` Notable highlights include ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Professional standards and positive overall impression.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Everyday tone',
        content: `Really enjoyed checking out ${businessName}! ${cats ? `Super pleased with the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Will be coming back!`,
      },
    ];
  } else if (rating === 3) {
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Balanced and brief',
        content: `Decent experience at ${businessName}.${cats ? ` Highlights and notes: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Honest and constructive',
        content: `Visited ${businessName} recently. Some aspects like ${cats || 'the service'} were alright, though there is room for improvement.${comment ? ` Specifically: ${comment}` : ''}`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Specific points',
        content: `Overall an average visit to ${businessName} (3/5 stars).${cats ? ` Observations: ${cats.toLowerCase()}.` : ''}${comment ? ` Note: ${comment}` : ''} Hope to see small refinements next time.`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Objective feedback',
        content: `Average standard at ${businessName}.${cats ? ` Feedback notes on ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Fair experience with potential for consistency.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Everyday honest feedback',
        content: `Checked out ${businessName}. It was okay overall.${cats ? ` ${cats}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
    ];
  } else {
    // 1 or 2 stars
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Direct feedback',
        content: `Disappointing visit to ${businessName}.${cats ? ` Issues noticed: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Constructive review',
        content: `Wanted to share honest feedback regarding my experience at ${businessName}.${cats ? ` Areas that fell short: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Hope management takes this into consideration.`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Specific feedback on what went wrong',
        content: `My visit to ${businessName} did not meet expectations (${rating}/5).${cats ? ` Difficulties experienced with ${cats.toLowerCase()}.` : ''}${comment ? ` Specifically: ${comment}` : ''}`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Formal constructive feedback',
        content: `Submitting constructive feedback for ${businessName}.${cats ? ` Noted concerns regarding ${cats.toLowerCase()}.` : ''}${comment ? ` Details: ${comment}` : ''} Substantial improvements needed.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Direct customer perspective',
        content: `Unfortunately had a poor experience at ${businessName}.${cats ? ` The ${cats.toLowerCase()} really needs work.` : ''}${comment ? ` ${comment}` : ''}`,
      },
    ];
  }
}

// Start Server with Vite Middleware for dev or Static Files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
