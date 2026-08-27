import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore, verifyAdminRequest } from './firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authenticated administrators can update business configurations.',
      });
    }

    const {
      businessId: rawBizId,
      name: rawName,
      ownerName: rawOwnerName,
      ownerPhone: rawOwnerPhone,
      email: rawEmail,
      phone: rawPhone,
      category: rawCategory,
      address: rawAddress,
      googleReviewUrl: rawGoogleReviewUrl,
      logoUrl: rawLogoUrl,
      dailyGenerationLimit: rawLimit,
      planName: rawPlanName,
      billingCycle: rawBillingCycle,
      amountPaid: rawAmountPaid,
      currency: rawCurrency,
      nextRenewalDate: rawNextRenewalDate,
      adminNotes: rawAdminNotes,
      status: rawStatus,
    } = req.body || {};

    const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required.' });
    }

    const adminDb = getAdminFirestore();
    const bizRef = adminDb.collection('businesses').doc(businessId);
    const bizSnap = await bizRef.get();

    if (!bizSnap.exists) {
      return res.status(404).json({ success: false, error: 'Business document not found.' });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof rawName === 'string' && rawName.trim()) updates.name = rawName.trim();
    if (typeof rawOwnerName === 'string') updates.ownerName = rawOwnerName.trim();
    if (typeof rawOwnerPhone === 'string') updates.ownerPhone = rawOwnerPhone.trim();
    if (typeof rawEmail === 'string' && rawEmail.trim()) updates.email = rawEmail.trim().toLowerCase();
    if (typeof rawPhone === 'string') updates.phone = rawPhone.trim();
    if (typeof rawCategory === 'string' && rawCategory.trim()) updates.category = rawCategory.trim();
    if (typeof rawAddress === 'string') updates.address = rawAddress.trim();
    if (typeof rawGoogleReviewUrl === 'string') updates.googleReviewUrl = rawGoogleReviewUrl.trim();
    if (typeof rawLogoUrl === 'string') updates.logoUrl = rawLogoUrl.trim();
    if (typeof rawLimit === 'number' && rawLimit > 0) updates.dailyGenerationLimit = Math.min(5000, Math.round(rawLimit));
    if (typeof rawPlanName === 'string' && rawPlanName.trim()) updates.planName = rawPlanName.trim();
    if (['monthly', 'quarterly', 'yearly', 'one-time'].includes(rawBillingCycle)) updates.billingCycle = rawBillingCycle;
    if (typeof rawAmountPaid === 'number') updates.amountPaid = Math.max(0, rawAmountPaid);
    if (typeof rawCurrency === 'string' && rawCurrency.trim()) updates.currency = rawCurrency.trim().toUpperCase();
    if (typeof rawNextRenewalDate === 'string' && rawNextRenewalDate.trim()) updates.nextRenewalDate = rawNextRenewalDate.trim();
    if (typeof rawAdminNotes === 'string') updates.adminNotes = rawAdminNotes.trim();
    if (['active', 'disabled'].includes(rawStatus)) updates.status = rawStatus;

    await bizRef.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Business profile successfully updated by administrator.',
      businessId,
      updates,
    });
  } catch (error: any) {
    console.error('Error updating business profile in admin endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update business profile.',
      details: error?.message || String(error),
    });
  }
}
