import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getFirebaseAdminApp } from './_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers?.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) return res.status(400).json({ error: 'No token provided' });

    const adminAuth = await getAdminAuth();
    const app = await getFirebaseAdminApp();
    
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return res.status(200).json({ success: true, decoded, appName: app.name });
    } catch (verifyErr: any) {
      return res.status(403).json({ error: 'verifyIdToken failed', message: verifyErr.message, code: verifyErr.code });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Global catch', message: err.message });
  }
}
