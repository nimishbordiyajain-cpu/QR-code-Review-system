import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAdminAuth,
  getAdminFirestore,
  getAdminEmails,
  isEmailInAdminAllowlist,
  verifyAdminRequest,
} from './_lib/firebaseAdmin.js';
import { checkRateLimit } from './_lib/rateLimiter.js';

/**
 * Admin status is derived only from Firebase custom claims (`admin: true`) or `ADMIN_EMAILS`;
 * there is no HTTP path to set the claim other than `sync-claims.ts`, which only ever sets it
 * to match the allowlist, and `scripts/bootstrap-admin.ts`, which is CLI-only.
 */

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

async function auditLog(adminDb: any, adminUid: string, actionName: string, details: any) {
  try {
    await adminDb.collection('auditLogs').add({
      adminUid,
      action: actionName,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to write audit log:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawAction = (req.query.action as string) || req.body?.action || (req.headers['x-admin-action'] as string) || '';
  const action = rawAction.toLowerCase().replace(/^admin-/, '').trim();

  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin authorization required.' });
    }

    const rateLimit = await checkRateLimit(adminUser.uid, 'admin-action', 30, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Too many admin actions. Please slow down.' });
    }

    if (['update-business', 'delete-business'].includes(action)) {
      const now = Math.floor(Date.now() / 1000);
      if (now - adminUser.auth_time > 15 * 60) {
        return res.status(401).json({ success: false, error: 'Session too old for sensitive action. Please re-authenticate (max age 15 mins).' });
      }
    }

    const adminAuth = await getAdminAuth();
    const adminDb = await getAdminFirestore();

    switch (action) {
      case 'create-business': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }



        const {
          name: rawName,
          ownerName: rawOwnerName,
          ownerPhone: rawOwnerPhone,
          email: rawEmail,
          phone: rawPhone,
          password: rawPassword,
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

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address.',
          });
        }

        const cleanPassword = typeof rawPassword === 'string' && rawPassword.length >= 6 ? rawPassword : null;

        let userRecord;
        try {
          userRecord = await adminAuth.createUser({
            email: cleanEmail,
            displayName: cleanOwnerName || cleanName,
            emailVerified: true,
            disabled: false,
            ...(cleanPassword ? { password: cleanPassword } : {}),
          });
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-exists') {
            userRecord = await adminAuth.getUserByEmail(cleanEmail);
            if (cleanPassword) {
              await adminAuth.updateUser(userRecord.uid, { password: cleanPassword });
            }
          } else {
            console.error('Error creating user in Firebase Auth:', createErr);
            return res.status(500).json({
              success: false,
              error: `Failed to create Firebase Auth user: ${createErr?.message || createErr}`,
            });
          }
        }

        const newUid = userRecord.uid;

        await adminAuth.setCustomUserClaims(newUid, {
          provisionedByAdmin: true,
          admin: isEmailInAdminAllowlist(cleanEmail),
        });

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

        let passwordResetLink = '';
        try {
          passwordResetLink = await adminAuth.generatePasswordResetLink(cleanEmail);
        } catch (linkErr: any) {
          console.warn('Could not generate password reset link:', linkErr?.message || linkErr);
          passwordResetLink = `${process.env.APP_URL || 'https://reviewflow.ai'}/forgot-password?email=${encodeURIComponent(cleanEmail)}`;
        }

        await auditLog(adminDb, adminUser.uid, 'create-business', { businessId, email: cleanEmail });
        return res.status(200).json({
          success: true,
          message: 'Business account successfully created and provisioned.',
          businessId,
          uid: newUid,
          passwordResetLink,
          business: { id: businessId, ...businessData },
        });
      }

      case 'update-business': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }


        const {
          businessId: rawBizId,
          name: rawName,
          ownerName: rawOwnerName,
          ownerPhone: rawOwnerPhone,
          email: rawEmail,
          phone: rawPhone,
          password: rawPassword,
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

        const adminDb = await getAdminFirestore();
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

        if (typeof rawPassword === 'string' && rawPassword.trim().length >= 6) {
          try {
            const bizData = bizSnap.data();
            if (bizData && bizData.email) {
              const userRecord = await adminAuth.getUserByEmail(bizData.email);
              await adminAuth.updateUser(userRecord.uid, { password: rawPassword.trim() });
            }
          } catch (pwdErr) {
            console.warn('Failed to update user password in update-business:', pwdErr);
          }
        }

        await auditLog(adminDb, adminUser.uid, 'update-business', { businessId, updates });
        return res.status(200).json({
          success: true,
          message: 'Business profile successfully updated by administrator.',
          businessId,
          updates,
        });
      }

      case 'reset-password': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { businessId: rawBizId, email: rawEmail } = req.body || {};
        const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

        if (!email) {
          return res.status(400).json({ success: false, error: 'Target owner email is required.' });
        }



        let passwordResetLink = '';
        try {
          passwordResetLink = await adminAuth.generatePasswordResetLink(email);
        } catch (linkErr: any) {
          console.warn('Could not generate reset link via Admin SDK:', linkErr);
          passwordResetLink = `${process.env.APP_URL || 'https://reviewflow.ai'}/forgot-password?email=${encodeURIComponent(email)}`;
        }

        const nowIso = new Date().toISOString();

        if (businessId) {
          try {
            await adminDb.collection('businesses').doc(businessId).update({
              lastCredentialResetAt: nowIso,
              updatedAt: nowIso,
            });
          } catch (dbErr) {
            console.warn('Could not update lastCredentialResetAt timestamp on business doc:', dbErr);
          }
        }

        await auditLog(adminDb, adminUser.uid, 'reset-password', { businessId, targetEmail: email });
        return res.status(200).json({
          success: true,
          message: 'New password-set link generated successfully.',
          passwordResetLink,
          lastCredentialResetAt: nowIso,
        });
      }

      case 'delete-business': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { businessId: rawBizId, confirmBusinessName: rawConfirmName } = req.body || {};
        const businessId = typeof rawBizId === 'string' ? rawBizId.trim() : '';

        if (!businessId) {
          return res.status(400).json({ success: false, error: 'Business ID is required.' });
        }



        const bizDocRef = adminDb.collection('businesses').doc(businessId);
        const bizSnap = await bizDocRef.get();

        if (!bizSnap.exists) {
          return res.status(404).json({ success: false, error: 'Business account not found.' });
        }

        const bizData = bizSnap.data() || {};
        const ownerId = bizData.ownerId;
        const businessName = bizData.name || '';

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

        await auditLog(adminDb, adminUser.uid, 'delete-business', { businessId, businessName });
        return res.status(200).json({
          success: true,
          message: `Business "${businessName}" (${businessId}) and all linked resources were permanently deprovisioned.`,
          businessId,
        });
      }

      case 'get-admins': {
        const envAdmins = getAdminEmails();
        const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').get();
        const adminUsers: any[] = [];
        usersSnap.forEach((doc) => {
          adminUsers.push({ id: doc.id, ...doc.data() });
        });
        return res.status(200).json({ success: true, allowlist: envAdmins, adminUsers });
      }

      case 'get-usage': {
        const today = new Date().toISOString().split('T')[0];

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
      }

      case 'get-enquiries': {

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
      }

      case 'update-enquiry': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
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

        await auditLog(adminDb, adminUser.uid, 'update-enquiry', { enquiryId, updates });
        return res.status(200).json({
          success: true,
          message: 'Enquiry updated successfully.',
          enquiryId,
          updates,
        });
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown admin action: "${rawAction}". Available actions: create-business, update-business, reset-password, delete-business, get-usage, get-enquiries, update-enquiry, get-admins.`,
        });
    }
  } catch (error: any) {
    console.error(`Error processing admin action "${action}":`, error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error in admin action handler.',
    });
  }
}
