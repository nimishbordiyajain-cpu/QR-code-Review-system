import { GenerateReviewsRequest, GenerateReviewsResponse, AIInsight, CustomerFeedback } from '../types';

export async function generateReviewDrafts(
  request: GenerateReviewsRequest & { businessId?: string }
): Promise<GenerateReviewsResponse> {
  try {
    const response = await fetch('/api/generate-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      drafts: data.drafts || [],
    };
  } catch (error: any) {
    console.error('Error generating AI review drafts:', error);
    return {
      success: false,
      drafts: [],
      error: error?.message || 'Failed to generate review drafts.',
    };
  }
}

export async function fetchBusinessAIInsights(
  businessName: string,
  category: string,
  feedbacks: CustomerFeedback[]
): Promise<AIInsight | null> {
  try {
    if (feedbacks.length === 0) return null;

    // Aggregate summary for AI analysis
    const ratingsCount: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const positiveTagsCount: Record<string, number> = {};
    const improveTagsCount: Record<string, number> = {};
    const sampleComments: string[] = [];

    feedbacks.forEach((f) => {
      ratingsCount[f.rating] = (ratingsCount[f.rating] || 0) + 1;

      (f.selectedCategories || []).forEach((cat) => {
        if (f.rating >= 4) {
          positiveTagsCount[cat] = (positiveTagsCount[cat] || 0) + 1;
        } else {
          improveTagsCount[cat] = (improveTagsCount[cat] || 0) + 1;
        }
      });

      if (f.customerComment && f.customerComment.trim()) {
        sampleComments.push(f.customerComment.trim().substring(0, 200));
      }
    });

    const avg = feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length;

    const topPositives = Object.entries(positiveTagsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topImprovements = Object.entries(improveTagsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const response = await fetch('/api/business-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName,
        category,
        feedbacksSummary: {
          total: feedbacks.length,
          avgRating: Number(avg.toFixed(1)),
          ratings: ratingsCount,
          topPositives,
          topImprovements,
          sampleComments: sampleComments.slice(0, 10),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Insights API returned ${response.status}`);
    }

    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return null;
  }
}
