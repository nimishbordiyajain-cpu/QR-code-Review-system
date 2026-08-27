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
  feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt'> & { honeypot?: string }
): Promise<CustomerFeedback> {
  const { honeypot, ...data } = feedbackData;

  // 1. Attempt protected serverless route with rate limiting & honeypot verification
  try {
    const res = await fetch('/api/submit-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        website_hp: honeypot || '',
      }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.feedback) {
        return result.feedback as CustomerFeedback;
      }
    } else if (res.status === 429) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Too many submissions. Please wait a moment.');
    }
  } catch (err: any) {
    if (err?.message && err.message.includes('Too many submissions')) {
      throw err;
    }
    console.warn('API feedback submission fallback to Firestore client SDK:', err);
  }

  // 2. Fallback direct client write (if API is unreachable)
  if (honeypot && honeypot.trim().length > 0) {
    // Honeypot trapped bot
    return {
      ...data,
      id: `fb_bot_${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as CustomerFeedback;
  }

  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newFeedback: CustomerFeedback = {
    ...data,
    id: feedbackId,
    createdAt: new Date().toISOString(),
  };

  const payload = sanitizeForFirestore(newFeedback);
  await setDoc(doc(db, 'feedback', feedbackId), payload);

  // If associated with a QR code, increment its feedbackCount
  if (data.qrId) {
    try {
      const qrRef = doc(db, 'qrCodes', data.qrId);
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
