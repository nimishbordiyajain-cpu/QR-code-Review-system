import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessProfile } from '../types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function createBusinessProfile(
  data: Omit<BusinessProfile, 'id' | 'createdAt' | 'status' | 'slug'>
): Promise<BusinessProfile> {
  const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const baseSlug = generateSlug(data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const newBusiness: BusinessProfile = {
    ...data,
    id: businessId,
    slug,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'businesses', businessId), newBusiness);
  return newBusiness;
}

export async function getBusinessByOwnerId(ownerId: string): Promise<BusinessProfile | null> {
  try {
    const q = query(
      collection(db, 'businesses'),
      where('ownerId', '==', ownerId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as BusinessProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business by owner ID:', error);
    return null;
  }
}

export async function getBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
  try {
    const q = query(
      collection(db, 'businesses'),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as BusinessProfile;
    }
    // Fallback: check if slug matches businessId
    const docSnap = await getDoc(doc(db, 'businesses', slug));
    if (docSnap.exists()) {
      return docSnap.data() as BusinessProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business by slug:', error);
    return null;
  }
}

export async function getBusinessById(businessId: string): Promise<BusinessProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'businesses', businessId));
    if (docSnap.exists()) {
      return docSnap.data() as BusinessProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business by ID:', error);
    return null;
  }
}

export async function updateBusinessProfile(
  businessId: string,
  data: Partial<BusinessProfile>
): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllBusinesses(): Promise<BusinessProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses'));
    return snap.docs.map((d) => d.data() as BusinessProfile);
  } catch (error) {
    console.error('Error fetching all businesses:', error);
    return [];
  }
}
