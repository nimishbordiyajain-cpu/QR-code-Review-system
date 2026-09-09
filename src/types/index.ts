export type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'archived';

export interface Enquiry {
  id: string;
  name: string;
  businessName: string;
  category: BusinessCategory | string;
  email: string;
  phone: string;
  city?: string;
  message?: string;
  source?: string;
  status: EnquiryStatus;
  adminNotes?: string;
  convertedBusinessId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'owner' | 'admin';
  createdAt: string;
}

export type BusinessCategory =
  | 'Restaurant'
  | 'Café'
  | 'Salon'
  | 'Beauty'
  | 'Hotel'
  | 'Home Stay'
  | 'Boutique'
  | 'Retail'
  | 'Grocery'
  | 'Gym'
  | 'Clinic'
  | 'Service Business'
  | 'Other';

export interface CategoryOption {
  id: string;
  name: string;
  type: 'positive' | 'constructive';
  subOptions?: string[];
}

export interface BusinessProfile {
  id: string;
  ownerId: string;
  name: string;
  ownerName?: string;
  ownerPhone?: string;
  email?: string;
  phone?: string;
  category: BusinessCategory;
  address?: string;
  description?: string;
  logoUrl?: string;
  googleReviewUrl: string;
  slug: string;
  status: 'active' | 'disabled';
  dailyGenerationLimit?: number;
  planName?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  amountPaid?: number;
  currency?: string;
  nextRenewalDate?: string;
  adminNotes?: string;
  provisionedAt?: string;
  lastCredentialResetAt?: string;
  customCategories?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface QRCodeItem {
  id: string;
  businessId: string;
  businessSlug: string;
  name: string;
  location: string;
  slug: string;
  active: boolean;
  scanCount: number;
  feedbackCount: number;
  createdAt: string;
}

export interface CustomerFeedback {
  id: string;
  businessId: string;
  qrId?: string;
  qrLocationName?: string;
  rating: number; // 1 to 5
  selectedCategories: string[]; // e.g. ["Food Quality: Excellent", "Staff: Very friendly"]
  customerComment?: string;
  privateFeedback?: string;
  customerName?: string;
  isAnonymous?: boolean;
  selectedDraft?: string;
  googleReviewClicked?: boolean;
  googleReviewClickedAt?: string;
  createdAt: string;
}

export interface ReviewDraft {
  id: string;
  style: 'Short & Simple' | 'Friendly & Natural' | 'Detailed' | 'Professional' | 'Casual';
  description: string;
  content: string;
}

export interface GenerateReviewsRequest {
  businessName: string;
  businessCategory: string;
  rating: number;
  selectedCategories: string[];
  customerComment?: string;
  customerName?: string;
}

export interface GenerateReviewsResponse {
  drafts: ReviewDraft[];
  success: boolean;
  error?: string;
}

export interface BusinessAnalytics {
  totalScans: number;
  totalFeedback: number;
  aiDraftsGenerated: number;
  googleReviewClicks: number;
  averageRating: number;
  completionRate: number; // percentage of scans that submitted feedback or clicked google
  ratingDistribution: { [star: number]: number };
  topPositiveCategories: { name: string; count: number }[];
  topImprovementCategories: { name: string; count: number }[];
  recentFeedbacks: CustomerFeedback[];
}

export interface AIInsight {
  strengths: string[];
  areasForImprovement: string[];
  customerSentimentSummary: string;
  actionableRecommendations: string[];
  generatedAt: string;
  feedbackCountAnalyzed: number;
}
