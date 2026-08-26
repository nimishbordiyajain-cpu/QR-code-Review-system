import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BusinessProfile, BusinessUser } from '../types';
import { getBusinessByOwnerId } from '../services/businessService';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';

const KNOWN_ADMIN_EMAILS = [
  'admin@authenticreviews.com',
  'nimishbordiyajain@gmail.com',
];

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: BusinessUser | null;
  currentBusiness: BusinessProfile | null;
  setCurrentBusiness: (business: BusinessProfile | null) => void;
  isAdmin: boolean;
  loading: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  toggleDemoMode: () => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  refreshClaims: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<BusinessUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const refreshClaims = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      // Attempt server sync
      try {
        await fetch('/api/sync-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ idToken }),
        });
      } catch {
        // Fallback continues
      }

      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      const isClaimAdmin = Boolean(tokenResult.claims.admin);
      const isEmailAdmin = auth.currentUser.email
        ? KNOWN_ADMIN_EMAILS.includes(auth.currentUser.email.toLowerCase())
        : false;
      const finalAdmin = isClaimAdmin || isEmailAdmin;
      setIsAdmin(finalAdmin);
      return finalAdmin;
    } catch (err) {
      console.warn('Error refreshing token claims:', err);
      return false;
    }
  };

  const refreshBusiness = async () => {
    if (currentUser) {
      try {
        const business = await getBusinessByOwnerId(currentUser.uid);
        setCurrentBusiness(business);
      } catch (err) {
        console.error('Error refreshing business:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // 1. Check custom claims for admin authorization
          const tokenResult = await user.getIdTokenResult();
          let isUserAdmin = Boolean(tokenResult.claims.admin);
          const isEmailAdmin = user.email
            ? KNOWN_ADMIN_EMAILS.includes(user.email.toLowerCase())
            : false;

          // If user email matches admin list but claim not yet propagated, sync with server
          if (isEmailAdmin && !isUserAdmin) {
            try {
              const idToken = await user.getIdToken();
              const syncRes = await fetch('/api/sync-claims', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ idToken }),
              });
              if (syncRes.ok) {
                const refreshed = await user.getIdTokenResult(true);
                isUserAdmin = Boolean(refreshed.claims.admin);
              }
            } catch (syncErr) {
              console.warn('Admin claim server sync warning:', syncErr);
            }
          }

          const resolvedIsAdmin = isUserAdmin || isEmailAdmin;
          setIsAdmin(resolvedIsAdmin);

          // 2. Fetch or initialize user profile in Firestore
          // Note: All user documents are stored with role: 'owner' to prevent client-side privilege escalation
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as BusinessUser;
            setUserProfile({
              ...data,
              role: resolvedIsAdmin ? 'admin' : 'owner',
            });
          } else {
            const newProfile: BusinessUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 'owner',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, sanitizeForFirestore(newProfile));
            setUserProfile({
              ...newProfile,
              role: resolvedIsAdmin ? 'admin' : 'owner',
            });
          }

          // 3. Fetch associated business profile
          const business = await getBusinessByOwnerId(user.uid);
          setCurrentBusiness(business);
        } catch (error) {
          console.error('Error setting up user session:', error);
        }
      } else {
        setUserProfile(null);
        setCurrentBusiness(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await fbSignOut(auth);
    setCurrentBusiness(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        currentBusiness,
        setCurrentBusiness,
        isAdmin,
        loading,
        isDemoMode,
        setIsDemoMode,
        toggleDemoMode,
        login,
        logout,
        resetPassword,
        refreshBusiness,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
