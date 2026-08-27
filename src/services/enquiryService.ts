import { auth } from '../lib/firebase';
import { Enquiry, EnquiryStatus, BusinessCategory } from '../types';

export interface SubmitEnquiryPayload {
  name: string;
  businessName: string;
  category: BusinessCategory | string;
  email: string;
  phone: string;
  city?: string;
  message?: string;
  source?: string;
  website_hp?: string;
}

export interface SubmitEnquiryResponse {
  success: boolean;
  enquiryId?: string;
  message?: string;
  error?: string;
}

export interface AdminUpdateEnquiryPayload {
  enquiryId: string;
  status?: EnquiryStatus;
  adminNotes?: string;
  convertedBusinessId?: string;
}

async function getAdminAuthHeaders(): Promise<HeadersInit> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Public client-facing endpoint to submit an enquiry
 */
export async function submitPublicEnquiry(
  payload: SubmitEnquiryPayload
): Promise<SubmitEnquiryResponse> {
  const res = await fetch('/api/submit-enquiry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit your enquiry. Please try again.');
  }

  return data;
}

/**
 * Super Admin endpoint to retrieve all incoming enquiries
 */
export async function adminGetEnquiries(): Promise<Enquiry[]> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/admin-get-enquiries', {
    method: 'GET',
    headers,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch prospective client enquiries.');
  }

  return data.enquiries || [];
}

/**
 * Super Admin endpoint to update enquiry status and internal notes
 */
export async function adminUpdateEnquiry(
  payload: AdminUpdateEnquiryPayload
): Promise<void> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/admin-update-enquiry', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update enquiry.');
  }
}
