import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QRCodeItem } from '../types';
import { generateSlug } from './businessService';

export async function createQRCode(
  businessId: string,
  businessSlug: string,
  name: string,
  location: string
): Promise<QRCodeItem> {
  const qrId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const qrSlug = generateSlug(name || location || 'point');

  const newQR: QRCodeItem = {
    id: qrId,
    businessId,
    businessSlug,
    name,
    location,
    slug: qrSlug,
    active: true,
    scanCount: 0,
    feedbackCount: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'qrCodes', qrId), newQR);
  return newQR;
}

export async function getQRCodesByBusiness(businessId: string): Promise<QRCodeItem[]> {
  try {
    const q = query(
      collection(db, 'qrCodes'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as QRCodeItem);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return [];
  }
}

export async function getQRCodeById(qrId: string): Promise<QRCodeItem | null> {
  try {
    const docSnap = await getDoc(doc(db, 'qrCodes', qrId));
    if (docSnap.exists()) {
      return docSnap.data() as QRCodeItem;
    }
    return null;
  } catch (error) {
    console.error('Error fetching QR by id:', error);
    return null;
  }
}

export async function toggleQRStatus(qrId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'qrCodes', qrId), {
    active,
  });
}

export async function incrementQRScan(qrId: string): Promise<void> {
  try {
    const qrRef = doc(db, 'qrCodes', qrId);
    await updateDoc(qrRef, {
      scanCount: increment(1),
    });
  } catch (err) {
    // Non-blocking telemetry
    console.warn('Could not increment QR scan count:', err);
  }
}
