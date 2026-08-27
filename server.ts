import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getAdminAuth, getAdminFirestore, getAdminEmails } from './api/_lib/firebaseAdmin';

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
// Models in priority routing order
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

async function callGroqRouter(
  messages: Array<{ role: string; content: string }>,
  jsonMode: boolean = true,
  maxTokens: number = 1500
): Promise<GroqRouteResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  // Try routing through available models in the cascade
  for (const model of GROQ_ROUTER_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return { content, modelUsed: model };
        }
      } else {
        const errText = await response.text();
        console.warn(`Groq Router failed for model ${model} (${response.status}): ${errText.slice(0, 100)}... Routing to next model.`);
      }
    } catch (err: any) {
      console.warn(`Groq Router network error with ${model}:`, err?.message || err);
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

// 1. Health Check
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

// Admin Bootstrap Endpoint
app.all('/api/admin-bootstrap', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    const targetEmail = req.body?.email || (req.query?.email as string);
    const adminAuth = getAdminAuth();
    const adminEmails = getAdminEmails();

    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      const email = decoded.email?.toLowerCase();
      const isAdmin = Boolean(email && adminEmails.includes(email));

      await adminAuth.setCustomUserClaims(decoded.uid, {
        admin: isAdmin,
        provisionedByAdmin: true,
      });

      return res.json({
        success: true,
        uid: decoded.uid,
        email: decoded.email,
        adminClaimSet: isAdmin,
        allowlist: adminEmails,
      });
    }

    if (targetEmail && typeof targetEmail === 'string') {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!adminEmails.includes(cleanEmail)) {
        return res.status(403).json({ success: false, error: 'Email is not on the admin allowlist.' });
      }

      const user = await adminAuth.getUserByEmail(cleanEmail);
      await adminAuth.setCustomUserClaims(user.uid, {
        admin: true,
        provisionedByAdmin: true,
      });

      return res.json({
        success: true,
        uid: user.uid,
        email: user.email,
        adminClaimSet: true,
        message: `Admin claim successfully granted to ${cleanEmail}`,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Provide either an authorization idToken or a target admin email in the allowlist.',
    });
  } catch (error: any) {
    console.error('Error in /api/admin-bootstrap:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to bootstrap admin claims.',
      details: error?.message || String(error),
    });
  }
});

// Admin Account Provisioning Endpoint
app.post('/api/admin-create-business', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();
    const adminEmails = getAdminEmails();

    let callerToken;
    try {
      callerToken = await adminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token.',
        details: err?.message,
      });
    }

    const callerEmail = callerToken.email?.toLowerCase();
    const isCallerAdmin = callerToken.admin === true || Boolean(callerEmail && adminEmails.includes(callerEmail));
    if (!isCallerAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only designated super-administrators can provision new business accounts.',
      });
    }

    const {
      name: rawName,
      ownerName: rawOwnerName,
      ownerPhone: rawOwnerPhone,
      email: rawEmail,
      phone: rawPhone,
      category: rawCategory,
      address: rawAddress,
      googleReviewUrl: rawGoogleReviewUrl,
      logoUrl: rawLogoUrl,
      dailyGenerationLimit: rawLimit,
      planName: rawPlanName,
      billingCycle: rawBillingCycle,
      amountPaid: rawAmountPaid,
      currency: rawCurrency,
      nextRenewalDate: rawNextRenewalDate,
      adminNotes: rawAdminNotes,
    } = req.body || {};

    const cleanName = typeof rawName === 'string' ? rawName.trim() : '';
    const cleanOwnerName = typeof rawOwnerName === 'string' ? rawOwnerName.trim() : '';
    const cleanOwnerPhone = typeof rawOwnerPhone === 'string' ? rawOwnerPhone.trim() : '';
    const cleanEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const cleanPhone = typeof rawPhone === 'string' ? rawPhone.trim() : '';
    const cleanCategory = typeof rawCategory === 'string' ? rawCategory.trim() : 'Other';
    const cleanAddress = typeof rawAddress === 'string' ? rawAddress.trim() : '';
    const cleanGoogleReviewUrl = typeof rawGoogleReviewUrl === 'string' ? rawGoogleReviewUrl.trim() : '';
    const cleanLogoUrl = typeof rawLogoUrl === 'string' ? rawLogoUrl.trim() : '';
    const limitNum = typeof rawLimit === 'number' && rawLimit > 0 ? Math.min(1000, Math.round(rawLimit)) : 50;

    const cleanPlanName = typeof rawPlanName === 'string' && rawPlanName.trim() ? rawPlanName.trim() : 'Standard';
    const allowedCycles = ['monthly', 'quarterly', 'yearly', 'one-time'];
    const cleanBillingCycle = allowedCycles.includes(rawBillingCycle) ? rawBillingCycle : 'monthly';
    const cleanAmountPaid = typeof rawAmountPaid === 'number' ? Math.max(0, rawAmountPaid) : 0;
    const cleanCurrency = typeof rawCurrency === 'string' && rawCurrency.trim() ? rawCurrency.trim().toUpperCase() : 'INR';
    const cleanNextRenewalDate = typeof rawNextRenewalDate === 'string' && rawNextRenewalDate.trim()
      ? rawNextRenewalDate.trim()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cleanAdminNotes = typeof rawAdminNotes === 'string' ? rawAdminNotes.trim() : '';

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Business name and owner email address are required.',
      });
    }

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: cleanEmail,
        displayName: cleanOwnerName || cleanName,
        emailVerified: false,
        disabled: false,
      });
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-exists') {
        userRecord = await adminAuth.getUserByEmail(cleanEmail);
      } else {
        return res.status(500).json({
          success: false,
          error: `Failed to create Firebase Auth user: ${createErr?.message || createErr}`,
        });
      }
    }

    const newUid = userRecord.uid;

    await adminAuth.setCustomUserClaims(newUid, {
      provisionedByAdmin: true,
      admin: Boolean(adminEmails.includes(cleanEmail)),
    });

    const businessDocRef = adminDb.collection('businesses').doc();
    const businessId = businessDocRef.id;
    const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'business';
    
    let slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const checkSnap = await adminDb.collection('businesses').where('slug', '==', slug).limit(1).get();
      if (checkSnap.empty) {
        break;
      }
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const nowIso = new Date().toISOString();

    const businessData = {
      id: businessId,
      ownerId: newUid,
      name: cleanName,
      ownerName: cleanOwnerName,
      ownerPhone: cleanOwnerPhone,
      email: cleanEmail,
      phone: cleanPhone,
      category: cleanCategory,
      address: cleanAddress,
      description: '',
      logoUrl: cleanLogoUrl,
      googleReviewUrl: cleanGoogleReviewUrl,
      slug,
      status: 'active',
      dailyGenerationLimit: limitNum,
      planName: cleanPlanName,
      billingCycle: cleanBillingCycle,
      amountPaid: cleanAmountPaid,
      currency: cleanCurrency,
      nextRenewalDate: cleanNextRenewalDate,
      adminNotes: cleanAdminNotes,
      provisionedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await adminDb.collection('businesses').doc(businessId).set(businessData);

    await adminDb.collection('users').doc(newUid).set(
      {
        uid: newUid,
        email: cleanEmail,
        displayName: cleanOwnerName || cleanName,
        role: adminEmails.includes(cleanEmail) ? 'admin' : 'owner',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    let passwordResetLink = '';
    try {
      passwordResetLink = await adminAuth.generatePasswordResetLink(cleanEmail);
    } catch (linkErr: any) {
      passwordResetLink = `${process.env.APP_URL || 'http://localhost:3000'}/forgot-password?email=${encodeURIComponent(cleanEmail)}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Business account successfully created and provisioned.',
      businessId,
      uid: newUid,
      passwordResetLink,
      business: businessData,
    });
  } catch (error: any) {
    console.error('Fatal error in /api/admin-create-business:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to provision business account.',
      details: error?.message || String(error),
    });
  }
});

// Admin: Update business profile, plan, and billing configurations
app.post('/api/admin-update-business', async (req: Request, res: Response) => {
  try {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const isCallerAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email?.toLowerCase() || '');
    if (!isCallerAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required.' });
    }

    const {
      businessId: rawBizId,
      name: rawName,
      ownerName: rawOwnerName,
      ownerPhone: rawOwnerPhone,
      email: rawEmail,
      phone: rawPhone,
      category: rawCategory,
      address: rawAddress,
      googleReviewUrl: rawGoogleReviewUrl,
      logoUrl: rawLogoUrl,
      dailyGenerationLimit: rawLimit,
      planName: rawPlanName,
      billingCycle: rawBillingCycle,
      amountPaid: rawAmountPaid,
      currency: rawCurrency,
      nextRenewalDate: rawNextRenewalDate,
      adminNotes: rawAdminNotes,
      status: rawStatus,
    } = req.body || {};

    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required.' });
    }

    const bizRef = adminDb.collection('businesses').doc(businessId);
    const bizSnap = await bizRef.get();
    if (!bizSnap.exists) {
      return res.status(404).json({ success: false, error: 'Business document not found.' });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof rawName === 'string' && rawName.trim()) updates.name = rawName.trim();
    if (typeof rawOwnerName === 'string') updates.ownerName = rawOwnerName.trim();
    if (typeof rawOwnerPhone === 'string') updates.ownerPhone = rawOwnerPhone.trim();
    if (typeof rawEmail === 'string' && rawEmail.trim()) updates.email = rawEmail.trim().toLowerCase();
    if (typeof rawPhone === 'string') updates.phone = rawPhone.trim();
    if (typeof rawCategory === 'string' && rawCategory.trim()) updates.category = rawCategory.trim();
    if (typeof rawAddress === 'string') updates.address = rawAddress.trim();
    if (typeof rawGoogleReviewUrl === 'string') updates.googleReviewUrl = rawGoogleReviewUrl.trim();
    if (typeof rawLogoUrl === 'string') updates.logoUrl = rawLogoUrl.trim();
    if (typeof rawLimit === 'number' && rawLimit > 0) updates.dailyGenerationLimit = Math.min(5000, Math.round(rawLimit));
    if (typeof rawPlanName === 'string' && rawPlanName.trim()) updates.planName = rawPlanName.trim();
    if (['monthly', 'quarterly', 'yearly', 'one-time'].includes(rawBillingCycle)) updates.billingCycle = rawBillingCycle;
    if (typeof rawAmountPaid === 'number') updates.amountPaid = Math.max(0, rawAmountPaid);
    if (typeof rawCurrency === 'string' && rawCurrency.trim()) updates.currency = rawCurrency.trim().toUpperCase();
    if (typeof rawNextRenewalDate === 'string' && rawNextRenewalDate.trim()) updates.nextRenewalDate = rawNextRenewalDate.trim();
    if (typeof rawAdminNotes === 'string') updates.adminNotes = rawAdminNotes.trim();
    if (['active', 'disabled'].includes(rawStatus)) updates.status = rawStatus;

    await bizRef.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Business profile successfully updated by administrator.',
      businessId,
      updates,
    });
  } catch (error: any) {
    console.error('Error in /api/admin-update-business:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update business profile.',
      details: error?.message || String(error),
    });
  }
});

// Admin: Regenerate password setup / reset link
app.post('/api/admin-reset-password', async (req: Request, res: Response) => {
  try {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const isCallerAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email?.toLowerCase() || '');
    if (!isCallerAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required.' });
    }

    const { businessId: rawBizId, email: rawEmail } = req.body || {};
    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Target owner email is required.' });
    }

    let passwordResetLink = '';
    try {
      passwordResetLink = await adminAuth.generatePasswordResetLink(email);
    } catch (linkErr: any) {
      passwordResetLink = `${process.env.APP_URL || 'http://localhost:3000'}/forgot-password?email=${encodeURIComponent(email)}`;
    }

    const nowIso = new Date().toISOString();

    if (businessId) {
      try {
        await adminDb.collection('businesses').doc(businessId).update({
          lastCredentialResetAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (dbErr) {
        console.warn('Could not update lastCredentialResetAt on business doc:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'New password-set link generated successfully.',
      passwordResetLink,
      lastCredentialResetAt: nowIso,
    });
  } catch (error: any) {
    console.error('Error in /api/admin-reset-password:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate credential reset link.',
      details: error?.message || String(error),
    });
  }
});

// Admin: Deprovision and delete a business and associated records
app.post('/api/admin-delete-business', async (req: Request, res: Response) => {
  try {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const isCallerAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email?.toLowerCase() || '');
    if (!isCallerAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required.' });
    }

    const { businessId: rawBizId, confirmBusinessName: rawConfirmName } = req.body || {};
    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required.' });
    }

    const bizDocRef = adminDb.collection('businesses').doc(businessId);
    const bizSnap = await bizDocRef.get();

    if (!bizSnap.exists) {
      return res.status(404).json({ success: false, error: 'Business account not found.' });
    }

    const bizData = bizSnap.data() || {};
    const ownerId = bizData.ownerId;
    const businessName = bizData.name || '';

    if (typeof rawConfirmName === 'string' && rawConfirmName.trim().toLowerCase() !== businessName.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: `Confirmation failed: Typed name "${rawConfirmName}" did not match "${businessName}".`,
      });
    }

    // Cascade delete QR codes
    try {
      const qrSnap = await adminDb.collection('qrCodes').where('businessId', '==', businessId).get();
      const qrBatch = adminDb.batch();
      qrSnap.forEach((doc) => qrBatch.delete(doc.ref));
      if (!qrSnap.empty) await qrBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete qrCodes:', e);
    }

    // Cascade delete feedback
    try {
      const fbSnap = await adminDb.collection('feedback').where('businessId', '==', businessId).get();
      const fbBatch = adminDb.batch();
      fbSnap.forEach((doc) => fbBatch.delete(doc.ref));
      if (!fbSnap.empty) await fbBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete feedback:', e);
    }

    // Cascade delete review clicks
    try {
      const clicksSnap = await adminDb.collection('reviewClicks').where('businessId', '==', businessId).get();
      const clicksBatch = adminDb.batch();
      clicksSnap.forEach((doc) => clicksBatch.delete(doc.ref));
      if (!clicksSnap.empty) await clicksBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete reviewClicks:', e);
    }

    // Delete business document
    await bizDocRef.delete();

    // Delete user profile and auth account
    if (ownerId && typeof ownerId === 'string') {
      try {
        await adminDb.collection('users').doc(ownerId).delete();
      } catch (e) {
        console.warn('Could not delete user doc:', e);
      }

      try {
        await adminAuth.deleteUser(ownerId);
      } catch (e) {
        console.warn('Could not delete auth user:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Business "${businessName}" (${businessId}) and all linked records permanently deleted.`,
      businessId,
    });
  } catch (error: any) {
    console.error('Error in /api/admin-delete-business:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete business.',
      details: error?.message || String(error),
    });
  }
});

// Admin: Get daily usage metrics across businesses
app.get('/api/admin-get-usage', async (req: Request, res: Response) => {
  try {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.query.idToken) {
      idToken = req.query.idToken as string;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const isCallerAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email?.toLowerCase() || '');
    if (!isCallerAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const usageSnap = await adminDb.collection('dailyUsage').where('date', '==', today).get();

    const usageByBusiness: Record<string, number> = {};
    usageSnap.forEach((doc) => {
      const data = doc.data();
      if (data.businessId && typeof data.count === 'number') {
        usageByBusiness[data.businessId] = data.count;
      }
    });

    return res.status(200).json({
      success: true,
      date: today,
      usage: usageByBusiness,
    });
  } catch (error: any) {
    console.error('Error in /api/admin-get-usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get usage stats.',
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

