import { GenerateReviewsRequest, GenerateReviewsResponse, AIInsight, CustomerFeedback, ReviewDraft } from '../types';

/**
 * Client-side deterministic draft generator.
 * Produces 5 natural, distinctive review styles based strictly on customer inputs.
 * Guarantees zero-failure review suggestions even if backend API is unreachable on static deployments.
 */
export function generateClientSideDrafts(
  businessName: string,
  rating: number,
  selectedCategories: string[] = [],
  customerComment?: string,
  customerName?: string
): ReviewDraft[] {
  const cats = selectedCategories.length > 0 ? selectedCategories.join(', ') : '';
  const comment = customerComment ? customerComment.trim() : '';

  if (rating >= 4) {
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Direct, crisp sentences',
        content: `Great experience at ${businessName}.${cats ? ` Really appreciated the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Warm and conversational tone',
        content: `Had a wonderful visit to ${businessName}! ${cats ? `The ${cats.toLowerCase()} really stood out.` : ''}${comment ? ` ${comment}` : ' Everything was smooth, friendly, and enjoyable.'}`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Comprehensive review mentioning specifics',
        content: `Visited ${businessName} recently and had a ${rating === 5 ? '5-star' : 'great'} experience.${cats ? ` In particular, the ${cats.toLowerCase()} made a very positive impression.` : ''}${comment ? ` Note: ${comment}` : ''} Would definitely recommend!`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Balanced, formal perspective',
        content: `High quality standards and great service at ${businessName}.${cats ? ` Notable highlights include ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Positive overall experience and professional team.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Relaxed everyday review',
        content: `Really enjoyed checking out ${businessName}! ${cats ? `Super pleased with the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Will definitely be coming back!`,
      },
    ];
  } else if (rating === 3) {
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Balanced and brief',
        content: `Decent experience at ${businessName}.${cats ? ` Highlights and notes: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Honest and constructive',
        content: `Visited ${businessName} recently. Some aspects like ${cats || 'the service'} were alright, though there is room for improvement.${comment ? ` Specifically: ${comment}` : ''}`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Specific constructive feedback',
        content: `Overall an average visit to ${businessName} (3/5 stars).${cats ? ` Observations: ${cats.toLowerCase()}.` : ''}${comment ? ` Note: ${comment}` : ''} Hope to see refinements next time.`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Objective feedback',
        content: `Average standard at ${businessName}.${cats ? ` Feedback notes on ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Fair experience with potential for better consistency.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Everyday honest feedback',
        content: `Checked out ${businessName}. It was okay overall.${cats ? ` ${cats}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
    ];
  } else {
    // 1 or 2 stars
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Direct feedback',
        content: `Disappointing visit to ${businessName}.${cats ? ` Issues noticed: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Constructive review',
        content: `Wanted to share honest feedback regarding my experience at ${businessName}.${cats ? ` Areas that fell short: ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Hope management takes this into consideration.`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Specific feedback on what went wrong',
        content: `My visit to ${businessName} did not meet expectations (${rating}/5).${cats ? ` Difficulties experienced with ${cats.toLowerCase()}.` : ''}${comment ? ` Specifically: ${comment}` : ''}`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Formal constructive feedback',
        content: `Submitting constructive feedback for ${businessName}.${cats ? ` Noted concerns regarding ${cats.toLowerCase()}.` : ''}${comment ? ` Details: ${comment}` : ''} Substantial improvements needed.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Direct customer perspective',
        content: `Unfortunately had a poor experience at ${businessName}.${cats ? ` The ${cats.toLowerCase()} really needs work.` : ''}${comment ? ` ${comment}` : ''}`,
      },
    ];
  }
}

export async function generateReviewDrafts(
  request: GenerateReviewsRequest & { businessId?: string }
): Promise<GenerateReviewsResponse> {
  const fallbackDrafts = generateClientSideDrafts(
    request.businessName,
    request.rating,
    request.selectedCategories,
    request.customerComment,
    request.customerName
  );

  try {
    const response = await fetch('/api/generate-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // If server returned 404, 500, or HTML (e.g. on static Vercel deploy), use high-quality client drafts
      console.warn(`AI API returned status ${response.status}. Using smart client draft generator.`);
      return {
        success: true,
        drafts: fallbackDrafts,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('API returned non-JSON response. Using smart client draft generator.');
      return {
        success: true,
        drafts: fallbackDrafts,
      };
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.drafts) && data.drafts.length > 0) {
      return {
        success: true,
        drafts: data.drafts,
      };
    }

    return {
      success: true,
      drafts: fallbackDrafts,
    };
  } catch (error: any) {
    console.warn('Network error fetching review drafts, using fallback generator:', error?.message);
    return {
      success: true,
      drafts: fallbackDrafts,
    };
  }
}

export async function fetchBusinessAIInsights(
  businessId: string,
  businessName: string,
  category: string,
  feedbacks: CustomerFeedback[]
): Promise<AIInsight | null> {
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

  const defaultInsight: AIInsight = {
    strengths: topPositives.map((p) => p.name).slice(0, 3).length > 0
      ? topPositives.map((p) => p.name).slice(0, 3)
      : ['Consistent customer service', 'Welcoming atmosphere'],
    areasForImprovement: topImprovements.map((p) => p.name).slice(0, 3).length > 0
      ? topImprovements.map((p) => p.name).slice(0, 3)
      : ['Continue gathering customer feedback'],
    customerSentimentSummary: `Customers generally rate ${businessName} at ${avg.toFixed(1)} out of 5 stars based on ${feedbacks.length} recorded feedback responses.`,
    actionableRecommendations: [
      'Celebrate staff performance in top positive categories.',
      'Review any recurring feedback points during weekly team check-ins.',
    ],
    generatedAt: new Date().toISOString(),
    feedbackCountAnalyzed: feedbacks.length,
  };

  try {
    const token = await import('../lib/firebase').then(m => m.auth.currentUser?.getIdToken()).catch(() => '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/business-insights', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        businessId,
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
      return defaultInsight;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return defaultInsight;
    }

    const data = await response.json();
    return data.insights || defaultInsight;
  } catch (error) {
    console.warn('Using client analytics summary:', error);
    return defaultInsight;
  }
}
