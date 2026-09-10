import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdminApp } from './_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getFirebaseAdminApp();
    return res.status(200).json({ 
      success: true, 
      appName: app.name,
      projectId: app.options.projectId || 'unknown',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
}
