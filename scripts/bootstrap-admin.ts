/**
 * Manual Admin Bootstrap Script
 * 
 * Usage:
 *   npx tsx scripts/bootstrap-admin.ts <admin-email> <admin-password> [display-name]
 * 
 * Requirements:
 *   - ADMIN_EMAILS environment variable must be defined and include the target email.
 *   - FIREBASE_SERVICE_ACCOUNT_KEY or standard Google application credentials configured.
 * 
 * This script is intended strictly for manual, deliberate local execution by platform administrators.
 * It is never executed automatically during server startup or exposed via any HTTP endpoint.
 */

import dotenv from 'dotenv';
dotenv.config();

import { getAdminAuth, getAdminFirestore, isEmailInAdminAllowlist } from '../api/_lib/firebaseAdmin';

async function bootstrapAdmin() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim();
  const password = args[1]?.trim();
  const displayName = args[2]?.trim() || 'Administrator';

  if (!email || !password) {
    console.error('Error: Email and password arguments are required.');
    console.error('Usage: npx tsx scripts/bootstrap-admin.ts <admin-email> <admin-password> [display-name]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters.');
    process.exit(1);
  }

  if (!isEmailInAdminAllowlist(email)) {
    console.error(`Error: Email "${email}" is not in the ADMIN_EMAILS environment variable allowlist.`);
    console.error('Please configure ADMIN_EMAILS before running this script.');
    process.exit(1);
  }

  console.log(`Bootstrapping admin account for: ${email}...`);

  const auth = getAdminAuth();
  const db = getAdminFirestore();
  const cleanEmail = email.toLowerCase();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(cleanEmail);
    console.log(`Found existing Firebase Auth user (${userRecord.uid}). Updating credentials...`);
    await auth.updateUser(userRecord.uid, {
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      console.log('Creating new Firebase Auth user...');
      userRecord = await auth.createUser({
        email: cleanEmail,
        password,
        displayName,
        emailVerified: true,
        disabled: false,
      });
    } else {
      console.error('Failed to look up or create user:', err);
      process.exit(1);
    }
  }

  if (userRecord) {
    console.log('Setting custom user claims (admin: true)...');
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
      provisionedByAdmin: true,
    });

    console.log('Syncing admin user document in Firestore...');
    try {
      await db.collection('users').doc(userRecord.uid).set(
        {
          uid: userRecord.uid,
          email: cleanEmail,
          displayName,
          role: 'admin',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Warning: Could not mirror user doc to Firestore:', fsErr);
    }

    console.log('✅ Admin user account successfully bootstrapped!');
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Email: ${cleanEmail}`);
  }
}

bootstrapAdmin().catch((err) => {
  console.error('Unexpected error bootstrapping admin:', err);
  process.exit(1);
});
