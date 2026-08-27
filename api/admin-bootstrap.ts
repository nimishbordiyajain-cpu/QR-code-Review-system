import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminEmails, isEmailInAdminAllowlist } from './_lib/firebaseAdmin';

/**
 * Endpoint to bootstrap / assign `admin: true` custom claim to authorized administrators.
 * Can be called with an authorized idToken or bootstrap email check.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    const targetEmail = req.body?.email || req.query?.email;
    const adminAuth = getAdminAuth();
    const adminEmails = getAdminEmails();

    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      const email = decoded.email?.toLowerCase();
      const isAdmin = isEmailInAdminAllowlist(email);

      await adminAuth.setCustomUserClaims(decoded.uid, {
        admin: isAdmin,
        provisionedByAdmin: true,
      });

      return res.status(200).json({
        success: true,
        uid: decoded.uid,
        email: decoded.email,
        adminClaimSet: isAdmin,
        allowlist: adminEmails,
      });
    }

    if (targetEmail && typeof targetEmail === 'string') {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!isEmailInAdminAllowlist(cleanEmail)) {
        return res.status(403).json({
          success: false,
          error: 'Email is not on the admin allowlist.',
        });
      }

      const user = await adminAuth.getUserByEmail(cleanEmail);
      await adminAuth.setCustomUserClaims(user.uid, {
        admin: true,
        provisionedByAdmin: true,
      });

      return res.status(200).json({
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
}
