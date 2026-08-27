import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminFirestore, verifyAdminRequest } from './firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authenticated administrators can generate credential reset links.',
      });
    }

    const { businessId: rawBizId, email: rawEmail } = req.body || {};
    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Target owner email is required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    // 1. Generate new password reset / setup link
    let passwordResetLink = '';
    try {
      passwordResetLink = await adminAuth.generatePasswordResetLink(email);
    } catch (linkErr: any) {
      console.warn('Could not generate reset link via Admin SDK:', linkErr);
      passwordResetLink = `${process.env.APP_URL || 'https://reviewflow.ai'}/forgot-password?email=${encodeURIComponent(email)}`;
    }

    const nowIso = new Date().toISOString();

    // 2. If businessId is supplied, update lastCredentialResetAt on the business doc
    if (businessId) {
      try {
        await adminDb.collection('businesses').doc(businessId).update({
          lastCredentialResetAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (dbErr) {
        console.warn('Could not update lastCredentialResetAt timestamp on business doc:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'New password-set link generated successfully.',
      passwordResetLink,
      lastCredentialResetAt: nowIso,
    });
  } catch (error: any) {
    console.error('Error generating credential reset link in admin endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate credential reset link.',
      details: error?.message || String(error),
    });
  }
}
