import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BusinessProfile, BusinessUser } from '../types';
import { getBusinessByOwnerId } from '../services/businessService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: BusinessUser | null;
  currentBusiness: BusinessProfile | null;
  setCurrentBusiness: (business: BusinessProfile | null) => void;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<BusinessUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Fetch or initialize user profile in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as BusinessUser);
          } else {
            const newProfile: BusinessUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: user.email === 'admin@authenticreviews.com' ? 'admin' : 'owner',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }

          // Fetch associated business profile
          const business = await getBusinessByOwnerId(user.uid);
          setCurrentBusiness(business);
        } catch (error) {
          console.error('Error setting up user session:', error);
        }
      } else {
        setUserProfile(null);
        setCurrentBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const newProfile: BusinessUser = {
        uid: cred.user.uid,
        email,
        displayName: name,
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUserProfile(newProfile);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setCurrentBusiness(null);
    setUserProfile(null);
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
        loading,
        login,
        register,
        logout,
        resetPassword,
        refreshBusiness,
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
