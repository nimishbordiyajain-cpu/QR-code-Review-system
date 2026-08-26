/**
 * ReviewFlow AI - Firebase Authentication Security Triggers
 * 
 * Deployment Instructions:
 * =======================
 * 1. Ensure you have the Firebase CLI installed:
 *    npm install -g firebase-tools
 * 
 * 2. Log in to your Firebase account:
 *    firebase login
 * 
 * 3. Deploy functions to your active Firebase project:
 *    firebase deploy --only functions
 * 
 * Purpose:
 * ========
 * Since the Firebase client SDK and config are embedded in the client bundle,
 * an attacker could theoretically attempt to call createUserWithEmailAndPassword
 * directly using the Firebase client API.
 * 
 * This server-side trigger executes immediately upon any Firebase Auth user creation.
 * If the user does not possess the custom claim `provisionedByAdmin === true` or is
 * not in the admin allowlist, their account is instantly deleted from Firebase Auth
 * and any corresponding unverified documents are purged, guaranteeing that ONLY
 * accounts provisioned directly by the administrator through /api/admin-create-business
 * can ever exist in the system.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Trigger: onCreate for Firebase Auth Users
 */
exports.enforceAdminProvisioning = functions.auth.user().onCreate(async (user) => {
  const email = (user.email || '').toLowerCase().trim();
  const uid = user.uid;

  // Retrieve admin allowlist from environment or default config
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@authenticreviews.com,nimishbordiyajain@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Check if user is a designated super-admin
  if (adminEmails.includes(email)) {
    console.log(`[AuthTrigger] Super-admin account registered/bootstrapped: ${email} (${uid})`);
    // Ensure admin claim is set
    await admin.auth().setCustomUserClaims(uid, {
      admin: true,
      provisionedByAdmin: true,
    });
    return null;
  }

  // Check custom claims
  const customClaims = user.customClaims || {};

  // If the account was created through the admin provisioning endpoint (/api/admin-create-business),
  // custom claim provisionedByAdmin will be true.
  if (customClaims.provisionedByAdmin === true) {
    console.log(`[AuthTrigger] Authorized business owner account verified: ${email} (${uid})`);
    return null;
  }

  // If not provisioned by admin, this is an unauthorized public self-registration attempt.
  console.warn(`[AuthTrigger] UNAUTHORIZED self-registration attempt detected: ${email} (${uid}). Deleting account immediately.`);

  try {
    // 1. Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // 2. Clean up any rogue documents if any were attempted
    const db = admin.firestore();
    await db.collection('users').doc(uid).delete().catch(() => {});
    
    console.log(`[AuthTrigger] Successfully deleted unauthorized user ${uid}`);
  } catch (error) {
    console.error(`[AuthTrigger] Error deleting unauthorized user ${uid}:`, error);
  }

  return null;
});
