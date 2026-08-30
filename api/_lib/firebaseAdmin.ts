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
  'nimishbordiyajain@gmail.com',
  'admin@authenticreviews.com',
];

export function getAdminEmails(): string[] {
  const envAdmins = process.env.ADMIN_EMAILS;
  if (!envAdmins || !envAdmins.trim()) {
    return DEFAULT_ADMIN_EMAILS;
  }
  const fromEnv = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...DEFAULT_ADMIN_EMAILS]));
}

export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
}

/**
 * Ensures the super admin accounts (such as admin@reviewai.com) are provisioned
 * in Firebase Auth with the desired password, verified status, and admin custom claims.
 */
export async function ensureAdminAccounts(): Promise<void> {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    const targetAdmins = [
      {
        email: 'admin@reviewai.com',
        password: 'admin123@nimish',
        displayName: 'ReviewFlow Super Administrator',
      },
    ];

    for (const target of targetAdmins) {
      let uid: string;
      try {
        const existing = await adminAuth.getUserByEmail(target.email);
        uid = existing.uid;
        // Update password & display name if needed
        await adminAuth.updateUser(uid, {
          password: target.password,
          displayName: target.displayName,
          emailVerified: true,
          disabled: false,
        });
        console.log(`[Admin Provisioning] Updated admin user ${target.email} (${uid})`);
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
          const created = await adminAuth.createUser({
            email: target.email,
            password: target.password,
            displayName: target.displayName,
            emailVerified: true,
            disabled: false,
          });
          uid = created.uid;
          console.log(`[Admin Provisioning] Created new admin user ${target.email} (${uid})`);
        } else {
          console.warn(`[Admin Provisioning] Warning checking user ${target.email}:`, err?.message || err);
          continue;
        }
      }

      // Assign custom admin claims
      await adminAuth.setCustomUserClaims(uid, {
        admin: true,
        provisionedByAdmin: true,
      });

      // Synchronize in Firestore /users and /admins collection
      const nowIso = new Date().toISOString();
      try {
        await adminDb.collection('users').doc(uid).set(
          {
            uid,
            email: target.email,
            displayName: target.displayName,
            role: 'admin',
            updatedAt: nowIso,
          },
          { merge: true }
        );

        // Also ensure /admins record exists for security rules
        await adminDb.collection('admins').doc(uid).set(
          {
            uid,
            email: target.email,
            role: 'superadmin',
            grantedAt: nowIso,
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn(`[Admin Provisioning] Firestore record update warning for ${target.email}:`, dbErr);
      }
    }
  } catch (globalErr) {
    console.warn('[Admin Provisioning] Error in ensureAdminAccounts:', globalErr);
  }
}

export async function verifyAdminRequest(req: any): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = req.headers?.authorization;
    let idToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7).trim();
    } else if (req.body && req.body.idToken) {
      idToken = req.body.idToken;
    }

    if (!idToken) return null;

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const isCallerAdmin = decoded.admin === true || isEmailInAdminAllowlist(decoded.email);
    if (!isCallerAdmin) return null;

    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error('Error verifying admin request:', err);
    return null;
  }
}

