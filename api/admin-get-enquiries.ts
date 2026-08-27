import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore, verifyAdminRequest } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authenticated administrators can view client enquiries.',
      });
    }

    const adminDb = getAdminFirestore();
    const snapshot = await adminDb.collection('enquiries').orderBy('createdAt', 'desc').get();

    const enquiries: any[] = [];
    snapshot.forEach((doc) => {
      enquiries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      enquiries,
    });
  } catch (error: any) {
    console.error('Error fetching enquiries for admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch enquiries.',
      details: error?.message || String(error),
    });
  }
}
