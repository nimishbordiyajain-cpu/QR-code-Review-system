import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore, verifyAdminRequest } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authenticated administrators can update enquiries.',
      });
    }

    const {
      enquiryId: rawEnquiryId,
      status: rawStatus,
      adminNotes: rawAdminNotes,
      convertedBusinessId: rawConvertedBizId,
    } = req.body || {};

    const enquiryId = typeof rawEnquiryId === 'string' ? rawEnquiryId.trim() : '';
    if (!enquiryId) {
      return res.status(400).json({ success: false, error: 'Enquiry ID is required.' });
    }

    const adminDb = getAdminFirestore();
    const docRef = adminDb.collection('enquiries').doc(enquiryId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ success: false, error: 'Enquiry record not found.' });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const validStatuses = ['new', 'contacted', 'converted', 'archived'];
    if (typeof rawStatus === 'string' && validStatuses.includes(rawStatus)) {
      updates.status = rawStatus;
    }

    if (typeof rawAdminNotes === 'string') {
      updates.adminNotes = rawAdminNotes.trim();
    }

    if (typeof rawConvertedBizId === 'string') {
      updates.convertedBusinessId = rawConvertedBizId.trim();
      if (!updates.status) {
        updates.status = 'converted';
      }
    }

    await docRef.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully.',
      enquiryId,
      updates,
    });
  } catch (error: any) {
    console.error('Error updating enquiry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update enquiry.',
      details: error?.message || String(error),
    });
  }
}
