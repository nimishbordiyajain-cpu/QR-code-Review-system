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

export function getAdminEmails(): string[] {
  const envAdmins = process.env.ADMIN_EMAILS;
  if (!envAdmins || !envAdmins.trim()) {
    console.warn('[Admin Security] Warning: ADMIN_EMAILS environment variable is not configured. Admin allowlist is empty.');
    return [];
  }
  return envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
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

