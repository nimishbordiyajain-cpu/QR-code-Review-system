import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore, verifyAdminRequest } from './firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin authorization required.',
      });
    }

    const adminDb = getAdminFirestore();
    const today = new Date().toISOString().split('T')[0];

    // Query dailyUsage collection for today
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
    console.error('Error fetching admin usage stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage stats.',
      details: error?.message || String(error),
    });
  }
}
