import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Web app's Firebase configuration
// NOTE: The hardcoded values below are a convenience default for immediate local dev
// without configuring a .env. They connect to a shared Firebase project.
// In any production deployment, you MUST override these via VITE_FIREBASE_* env vars
// (and ensure the deployed Firestore rules exactly match the ones in this repo).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCrfmEHemwrqbjXeGWHpFumcRJbeo4ua0U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "qr-app-8a24f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "qr-app-8a24f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "qr-app-8a24f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "261628379398",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:261628379398:web:492063773fa42ec8691e87",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEN11YH52W"
};

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore Database
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Analytics safely in browser environment
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional in non-browser/restricted iframe contexts
  });
}

export default app;
