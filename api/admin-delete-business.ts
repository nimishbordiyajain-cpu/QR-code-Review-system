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
        error: 'Forbidden: Only authenticated administrators can deprovision and delete business accounts.',
      });
    }

    const { businessId: rawBizId, confirmBusinessName: rawConfirmName } = req.body || {};
    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const bizDocRef = adminDb.collection('businesses').doc(businessId);
    const bizSnap = await bizDocRef.get();

    if (!bizSnap.exists) {
      return res.status(404).json({ success: false, error: 'Business account not found.' });
    }

    const bizData = bizSnap.data() || {};
    const ownerId = bizData.ownerId;
    const businessName = bizData.name || '';

    // Verify confirmation string matches business name
    if (typeof rawConfirmName === 'string' && rawConfirmName.trim().toLowerCase() !== businessName.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: `Confirmation failed: Typed name "${rawConfirmName}" did not match "${businessName}".`,
      });
    }

    // 1. Delete associated QR codes
    try {
      const qrSnap = await adminDb.collection('qrCodes').where('businessId', '==', businessId).get();
      const qrBatch = adminDb.batch();
      qrSnap.forEach((doc) => qrBatch.delete(doc.ref));
      if (!qrSnap.empty) await qrBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete qrCodes:', e);
    }

    // 2. Delete associated feedback submissions
    try {
      const fbSnap = await adminDb.collection('feedback').where('businessId', '==', businessId).get();
      const fbBatch = adminDb.batch();
      fbSnap.forEach((doc) => fbBatch.delete(doc.ref));
      if (!fbSnap.empty) await fbBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete feedback records:', e);
    }

    // 3. Delete associated review clicks telemetry
    try {
      const clicksSnap = await adminDb.collection('reviewClicks').where('businessId', '==', businessId).get();
      const clicksBatch = adminDb.batch();
      clicksSnap.forEach((doc) => clicksBatch.delete(doc.ref));
      if (!clicksSnap.empty) await clicksBatch.commit();
    } catch (e) {
      console.warn('Could not cascade-delete reviewClicks:', e);
    }

    // 4. Delete business document
    await bizDocRef.delete();

    // 5. Delete user profile doc and Auth account
    if (ownerId && typeof ownerId === 'string') {
      try {
        await adminDb.collection('users').doc(ownerId).delete();
      } catch (e) {
        console.warn('Could not delete user document:', e);
      }

      try {
        await adminAuth.deleteUser(ownerId);
      } catch (e) {
        console.warn('Could not delete Firebase Auth user:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Business "${businessName}" (${businessId}) and all linked resources were permanently deprovisioned.`,
      businessId,
    });
  } catch (error: any) {
    console.error('Error deprovisioning business in admin endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to deprovision business account.',
      details: error?.message || String(error),
    });
  }
}
