import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountStr) {
    try {
      const serviceAccount = JSON.parse(serviceAccountStr);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID || 'qr-app-8a24f',
      });
      return adminApp;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }

  adminApp = initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'qr-app-8a24f',
  });
  return adminApp;
}

export function getAdminAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

export function getAdminFirestore(): Firestore {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}

const DEFAULT_ADMIN_EMAILS = [
  'admin@reviewai.com',
  'admin@authenticreviews.com',
  'nimishbordiyajain@gmail.com',
];

export function getAdminEmails(): string[] {
  const envAdmins = process.env.ADMIN_EMAILS;
  if (!envAdmins) return DEFAULT_ADMIN_EMAILS;
  const list = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  DEFAULT_ADMIN_EMAILS.forEach((email) => {
    if (!list.includes(email)) list.push(email);
  });
  return list;
}

export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
}

export async function ensureAdminUserAccount(
  email: string = 'admin@reviewai.com',
  password: string = 'admin123@nimish',
  displayName: string = 'Super Admin'
) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    const cleanEmail = email.trim().toLowerCase();

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
      await auth.updateUser(userRecord.uid, {
        password,
        displayName,
        emailVerified: true,
        disabled: false,
      });
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: cleanEmail,
          password,
          displayName,
          emailVerified: true,
          disabled: false,
        });
      } else {
        throw err;
      }
    }

    if (userRecord) {
      await auth.setCustomUserClaims(userRecord.uid, {
        admin: true,
        provisionedByAdmin: true,
      });

      // Mirror to Firestore user doc
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
      } catch (firestoreErr) {
        console.warn('Could not mirror admin user to Firestore:', firestoreErr);
      }
    }
    console.log(`[Admin Provisioning] Successfully ensured admin account: ${cleanEmail}`);
    return userRecord;
  } catch (error) {
    console.warn('[Admin Provisioning] Note: Admin account initialization result:', error);
    return null;
  }
}
