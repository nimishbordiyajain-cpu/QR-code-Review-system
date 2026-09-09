import { auth } from '../lib/firebase';
import { BusinessProfile } from '../types';

async function getAdminAuthHeader(): Promise<HeadersInit> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface CreateBusinessAdminPayload {
  name: string;
  ownerName: string;
  ownerPhone?: string;
  email: string;
  password?: string;
  phone?: string;
  category: string;
  address?: string;
  googleReviewUrl?: string;
  logoUrl?: string;
  dailyGenerationLimit?: number;
  planName?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  amountPaid?: number;
  currency?: string;
  nextRenewalDate?: string;
  adminNotes?: string;
}

export interface CreateBusinessAdminResponse {
  success: boolean;
  message?: string;
  businessId?: string;
  uid?: string;
  passwordResetLink?: string;
  business?: BusinessProfile;
  error?: string;
}

export async function adminCreateBusiness(
  payload: CreateBusinessAdminPayload
): Promise<CreateBusinessAdminResponse> {
  const headers = await getAdminAuthHeader();
  const res = await fetch('/api/admin?action=create-business', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create business profile.');
  }
  return data;
}

export interface UpdateBusinessAdminPayload {
  businessId: string;
  name?: string;
  ownerName?: string;
  ownerPhone?: string;
  email?: string;
  phone?: string;
  category?: string;
  address?: string;
  googleReviewUrl?: string;
  logoUrl?: string;
  dailyGenerationLimit?: number;
  planName?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  amountPaid?: number;
  currency?: string;
  nextRenewalDate?: string;
  adminNotes?: string;
  status?: 'active' | 'disabled';
}

export async function adminUpdateBusiness(payload: UpdateBusinessAdminPayload): Promise<void> {
  const headers = await getAdminAuthHeader();
  const res = await fetch('/api/admin?action=update-business', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update business configuration.');
  }
}

export interface ResetPasswordResponse {
  success: boolean;
  passwordResetLink: string;
  lastCredentialResetAt: string;
}

export async function adminResetPassword(
  businessId: string,
  email: string
): Promise<ResetPasswordResponse> {
  const headers = await getAdminAuthHeader();
  const res = await fetch('/api/admin?action=reset-password', {
    method: 'POST',
    headers,
    body: JSON.stringify({ businessId, email }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate credential reset link.');
  }
  return data;
}

export async function adminDeleteBusiness(
  businessId: string,
  confirmBusinessName: string
): Promise<void> {
  const headers = await getAdminAuthHeader();
  const res = await fetch('/api/admin?action=delete-business', {
    method: 'POST',
    headers,
    body: JSON.stringify({ businessId, confirmBusinessName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete business.');
  }
}

export async function adminGetTodayUsage(): Promise<Record<string, number>> {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    const res = await fetch(`/api/admin?action=get-usage&idToken=${encodeURIComponent(token)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.usage || {};
  } catch (err) {
    console.warn('Could not fetch daily usage metrics:', err);
    return {};
  }
}
