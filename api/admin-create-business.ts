import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminFirestore, isEmailInAdminAllowlist } from './_lib/firebaseAdmin';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function generateUniqueAdminSlug(adminDb: any, name: string): Promise<string> {
  const baseSlug = generateSlug(name) || 'business';

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidateSuffix = Math.random().toString(36).substring(2, 6);
    const candidateSlug = `${baseSlug}-${candidateSuffix}`;

    try {
      const snap = await adminDb.collection('businesses').where('slug', '==', candidateSlug).limit(1).get();
      if (snap.empty) {
        return candidateSlug;
      }
    } catch (err) {
      console.warn('Could not query candidate slug in Admin SDK:', err);
    }
  }

  const fallbackSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  return `${baseSlug}-${fallbackSuffix}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate caller as Admin
    const authHeader = req.headers.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    let callerToken;
    try {
      callerToken = await adminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token.',
        details: err?.message,
      });
    }

    const isCallerAdmin = callerToken.admin === true || isEmailInAdminAllowlist(callerToken.email);
    if (!isCallerAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only designated super-administrators can provision new business accounts.',
      });
    }

    // 2. Validate request payload
    const {
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
    } = req.body || {};

    const cleanName = typeof rawName === 'string' ? rawName.trim() : '';
    const cleanOwnerName = typeof rawOwnerName === 'string' ? rawOwnerName.trim() : '';
    const cleanOwnerPhone = typeof rawOwnerPhone === 'string' ? rawOwnerPhone.trim() : '';
    const cleanEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const cleanPhone = typeof rawPhone === 'string' ? rawPhone.trim() : '';
    const cleanCategory = typeof rawCategory === 'string' ? rawCategory.trim() : 'Other';
    const cleanAddress = typeof rawAddress === 'string' ? rawAddress.trim() : '';
    const cleanGoogleReviewUrl = typeof rawGoogleReviewUrl === 'string' ? rawGoogleReviewUrl.trim() : '';
    const cleanLogoUrl = typeof rawLogoUrl === 'string' ? rawLogoUrl.trim() : '';
    const limitNum = typeof rawLimit === 'number' && rawLimit > 0 ? Math.min(1000, Math.round(rawLimit)) : 50;

    const cleanPlanName = typeof rawPlanName === 'string' && rawPlanName.trim() ? rawPlanName.trim() : 'Standard';
    const allowedCycles = ['monthly', 'quarterly', 'yearly', 'one-time'];
    const cleanBillingCycle = allowedCycles.includes(rawBillingCycle) ? rawBillingCycle : 'monthly';
    const cleanAmountPaid = typeof rawAmountPaid === 'number' ? Math.max(0, rawAmountPaid) : 0;
    const cleanCurrency = typeof rawCurrency === 'string' && rawCurrency.trim() ? rawCurrency.trim().toUpperCase() : 'INR';
    const cleanNextRenewalDate = typeof rawNextRenewalDate === 'string' && rawNextRenewalDate.trim()
      ? rawNextRenewalDate.trim()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cleanAdminNotes = typeof rawAdminNotes === 'string' ? rawAdminNotes.trim() : '';

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Business name and owner email address are required.',
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    // 3. Create or fetch Firebase Auth User for the business owner
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: cleanEmail,
        displayName: cleanOwnerName || cleanName,
        emailVerified: false,
        disabled: false,
      });
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-exists') {
        // Fetch existing user
        userRecord = await adminAuth.getUserByEmail(cleanEmail);
      } else {
        console.error('Error creating user in Firebase Auth:', createErr);
        return res.status(500).json({
          success: false,
          error: `Failed to create Firebase Auth user: ${createErr?.message || createErr}`,
        });
      }
    }

    const newUid = userRecord.uid;

    // 4. Set custom claim indicating this account was provisioned by an admin
    await adminAuth.setCustomUserClaims(newUid, {
      provisionedByAdmin: true,
      admin: isEmailInAdminAllowlist(cleanEmail),
    });

    // 5. Create Firestore business document with unique slug and high-entropy ID
    const businessDocRef = adminDb.collection('businesses').doc();
    const businessId = businessDocRef.id;
    const slug = await generateUniqueAdminSlug(adminDb, cleanName);
    const nowIso = new Date().toISOString();

    const businessData = {
      id: businessId,
      ownerId: newUid,
      name: cleanName,
      ownerName: cleanOwnerName,
      ownerPhone: cleanOwnerPhone,
      email: cleanEmail,
      phone: cleanPhone,
      category: cleanCategory,
      address: cleanAddress,
      description: '',
      logoUrl: cleanLogoUrl,
      googleReviewUrl: cleanGoogleReviewUrl,
      slug,
      status: 'active',
      dailyGenerationLimit: limitNum,
      planName: cleanPlanName,
      billingCycle: cleanBillingCycle,
      amountPaid: cleanAmountPaid,
      currency: cleanCurrency,
      nextRenewalDate: cleanNextRenewalDate,
      adminNotes: cleanAdminNotes,
      provisionedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await adminDb.collection('businesses').doc(businessId).set(businessData);

    // 6. Create or update Firestore user record
    await adminDb.collection('users').doc(newUid).set(
      {
        uid: newUid,
        email: cleanEmail,
        displayName: cleanOwnerName || cleanName,
        role: isEmailInAdminAllowlist(cleanEmail) ? 'admin' : 'owner',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // 7. Generate Password Reset / Setup Link
    let passwordResetLink = '';
    try {
      passwordResetLink = await adminAuth.generatePasswordResetLink(cleanEmail);
    } catch (linkErr: any) {
      console.warn('Could not generate password reset link:', linkErr?.message || linkErr);
      passwordResetLink = `${process.env.APP_URL || 'https://reviewflow.ai'}/forgot-password?email=${encodeURIComponent(cleanEmail)}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Business account successfully created and provisioned.',
      businessId,
      uid: newUid,
      passwordResetLink,
      business: businessData,
    });
  } catch (error: any) {
    console.error('Fatal error in /api/admin-create-business:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to provision business account.',
      details: error?.message || String(error),
    });
  }
}
