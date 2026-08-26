import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, isEmailInAdminAllowlist } from './firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      // In development or if server credentials aren't configured, fallback gracefully if valid structure
      return res.status(401).json({ success: false, error: 'Invalid authentication token', details: err?.message });
    }

    const { uid, email } = decodedToken;
    const shouldBeAdmin = isEmailInAdminAllowlist(email);

    // Update custom user claims
    await adminAuth.setCustomUserClaims(uid, {
      admin: shouldBeAdmin,
    });

    return res.status(200).json({
      success: true,
      uid,
      email,
      isAdmin: shouldBeAdmin,
      message: shouldBeAdmin ? 'Admin claim granted' : 'Standard owner claim assigned',
    });
  } catch (error: any) {
    console.error('Error syncing claims:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to synchronize claims',
      details: error?.message || String(error),
    });
  }
}
