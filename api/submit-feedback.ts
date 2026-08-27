import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore } from './firebaseAdmin';
import { checkRateLimit, getClientIp } from './rateLimiter';

function sanitizeInputString(val: any, maxLength: number = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, maxLength);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 1. IP-based rate limiting (10 submissions per minute per IP)
  const clientIp = getClientIp(req.headers, req.socket?.remoteAddress);
  const rateLimit = await checkRateLimit(clientIp, 'submit-feedback', 10, 60);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many feedback submissions from your network. Please wait a moment before trying again.',
      retryAfterSeconds: rateLimit.resetInSeconds,
    });
  }

  try {
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
      website_hp: honeypot, // Bot honeypot field
    } = req.body || {};

    // 2. Honeypot check: If filled, silently return fake success to trick spam bots without persisting
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

    // 3. Verify business exists and is active
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

    // If submitted via QR code, increment its feedbackCount
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
    console.error('Error submitting customer feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while submitting feedback.',
      details: error?.message || String(error),
    });
  }
}
