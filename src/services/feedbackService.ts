import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CustomerFeedback } from '../types';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';

export async function submitCustomerFeedback(
  feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt'>
): Promise<CustomerFeedback> {
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newFeedback: CustomerFeedback = {
    ...feedbackData,
    id: feedbackId,
    createdAt: new Date().toISOString(),
  };

  const payload = sanitizeForFirestore(newFeedback);
  await setDoc(doc(db, 'feedback', feedbackId), payload);

  // If associated with a QR code, increment its feedbackCount
  if (feedbackData.qrId) {
    try {
      const qrRef = doc(db, 'qrCodes', feedbackData.qrId);
      await updateDoc(qrRef, {
        feedbackCount: increment(1),
      });
    } catch (err) {
      console.warn('Could not increment QR feedbackCount:', err);
    }
  }

  return newFeedback;
}

export async function getFeedbackByBusiness(businessId: string): Promise<CustomerFeedback[]> {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as CustomerFeedback);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

export async function recordGoogleReviewClick(
  businessId: string,
  feedbackId?: string,
  qrId?: string
): Promise<void> {
  try {
    const clickId = `click_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clickPayload = sanitizeForFirestore({
      id: clickId,
      businessId,
      feedbackId: feedbackId || null,
      qrId: qrId || null,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'reviewClicks', clickId), clickPayload);

    if (feedbackId) {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        googleReviewClicked: true,
        googleReviewClickedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not record Google review click:', err);
  }
}

export async function getAllFeedback(): Promise<CustomerFeedback[]> {
  try {
    const snap = await getDocs(collection(db, 'feedback'));
    return snap.docs.map((d) => d.data() as CustomerFeedback);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
}
