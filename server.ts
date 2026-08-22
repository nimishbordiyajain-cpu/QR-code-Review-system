import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory rate limiting and usage tracking for MVP
// Maps businessId_YYYY-MM-DD -> count
const dailyUsageTracker: Record<string, number> = {};
const DAILY_LIMIT = 50;

function getDailyKey(businessId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${businessId}_${today}`;
}

function checkAndIncrementUsage(businessId: string): { allowed: boolean; current: number; limit: number } {
  const key = getDailyKey(businessId || 'anonymous');
  const current = dailyUsageTracker[key] || 0;
  if (current >= DAILY_LIMIT) {
    return { allowed: false, current, limit: DAILY_LIMIT };
  }
  dailyUsageTracker[key] = current + 1;
  return { allowed: true, current: current + 1, limit: DAILY_LIMIT };
}

// Lazy Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables. Mock generation fallback will be active if not supplied.');
    }
    geminiClient = new GoogleGenAI(apiKey ? { apiKey } : {});
  }
  return geminiClient;
}

// 1. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. AI Review Drafts Generation Endpoint
app.post('/api/generate-reviews', async (req: Request, res: Response) => {
  try {
    const {
      businessId,
      businessName,
      businessCategory,
      rating,
      selectedCategories,
      customerComment,
      customerName,
    } = req.body;

    if (!businessName || typeof rating !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters (businessName and rating).',
      });
    }

    // Check usage limit per business
    const usage = checkAndIncrementUsage(businessId || 'default');
    if (!usage.allowed) {
      return res.status(429).json({
        success: false,
        error: `Daily AI review draft limit (${usage.limit}/day) reached for this business. Please try again tomorrow.`,
      });
    }

    const categoriesText = Array.isArray(selectedCategories) && selectedCategories.length > 0
      ? selectedCategories.join(', ')
      : 'None explicitly selected';

    const commentText = customerComment ? customerComment.trim() : 'No additional written text provided';
    const nameText = customerName ? customerName.trim() : 'Anonymous customer';

    const systemInstruction = `You are an AI writing assistant helping a customer express their genuine experience with a business.
Generate five natural review drafts based ONLY on the information provided by the customer.

Strict Guardrails:
- Never invent facts.
- Never exaggerate.
- Never change the customer's sentiment.
- Never increase the customer's rating or tone.
- Never introduce experiences, products, dishes, staff names, discounts, or events that the customer did not mention.
- Do not claim the customer visited a place, used a service, purchased a product, or interacted with staff unless the customer provided that information.
- If the customer gave a 1, 2, or 3-star rating or negative feedback, keep the drafts strictly constructive, honest, and reflective of their negative/mixed sentiment. Do NOT make it sound enthusiastic or positive.
- If the customer gave a 4 or 5-star rating, keep the drafts genuine and appreciative based only on what they liked.
- The drafts must be natural and suitable for a customer to review, edit, and optionally post.
- The customer remains responsible for the final review.

You must return exactly 5 distinct styles in valid JSON format:
1. "Short & Simple" (1-2 crisp, direct sentences)
2. "Friendly & Natural" (warm, conversational, genuine tone)
3. "Detailed" (thoroughly mentions each category/aspect the customer selected or noted)
4. "Professional" (constructive, balanced, formal tone)
5. "Casual" (relaxed, authentic, everyday language)`;

    const prompt = `Business Name: ${businessName}
Business Category: ${businessCategory || 'Business'}
Customer Star Rating: ${rating} out of 5 stars
Selected Experience Highlights / Feedback: ${categoriesText}
Customer's Own Comment: "${commentText}"
Customer Name (optional): ${nameText}

Please generate the 5 review drafts formatted as a JSON array of objects with keys:
"id" (string 1-5),
"style" ("Short & Simple" | "Friendly & Natural" | "Detailed" | "Professional" | "Casual"),
"description" (short phrase explaining the draft tone),
"content" (the full review text draft)`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text?.trim() || '[]';
      let parsedDrafts: any[] = [];
      try {
        parsedDrafts = JSON.parse(responseText);
        // Ensure it's an array
        if (!Array.isArray(parsedDrafts) && parsedDrafts && typeof parsedDrafts === 'object') {
          // In case Gemini returns { drafts: [...] } or { reviews: [...] }
          parsedDrafts = (parsedDrafts as any).drafts || (parsedDrafts as any).reviews || Object.values(parsedDrafts);
        }
      } catch (e) {
        console.error('Failed to parse Gemini JSON response:', responseText);
      }

      if (Array.isArray(parsedDrafts) && parsedDrafts.length >= 3) {
        return res.json({
          success: true,
          drafts: parsedDrafts.slice(0, 5),
          dailyUsage: { current: usage.current, limit: usage.limit },
        });
      }
    } catch (aiError: any) {
      console.warn('Gemini API call failed, falling back to deterministic template builder:', aiError?.message || aiError);
    }

    // Fallback deterministic draft generator (ensures zero-downtime if API key is temporarily absent)
    const fallbackDrafts = generateFallbackDrafts(businessName, rating, selectedCategories, customerComment);
    return res.json({
      success: true,
      drafts: fallbackDrafts,
      isFallback: true,
      dailyUsage: { current: usage.current, limit: usage.limit },
    });

  } catch (error: any) {
    console.error('Error generating review drafts:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while generating review suggestions. Please try again.',
    });
  }
});

// 3. AI Business Insights Endpoint
app.post('/api/business-insights', async (req: Request, res: Response) => {
  try {
    const { businessName, category, feedbacksSummary } = req.body;

    if (!feedbacksSummary || !feedbacksSummary.total || feedbacksSummary.total < 3) {
      return res.json({
        success: true,
        insights: {
          strengths: [],
          areasForImprovement: [],
          customerSentimentSummary: 'Not enough feedback yet to generate reliable insights. As more customers share their feedback, AI trends will automatically appear here.',
          actionableRecommendations: [
            'Place your QR codes in high-visibility spots (e.g. table standees, billing counter).',
            'Encourage staff to invite customers to share their feedback after service.',
          ],
          generatedAt: new Date().toISOString(),
          feedbackCountAnalyzed: feedbacksSummary?.total || 0,
        },
      });
    }

    const prompt = `You are a customer experience consultant analyzing aggregated, anonymized customer feedback for ${businessName} (${category || 'Small Business'}).
Total feedback items: ${feedbacksSummary.total}
Average rating: ${feedbacksSummary.avgRating} / 5
Rating distribution: 5★: ${feedbacksSummary.ratings['5'] || 0}, 4★: ${feedbacksSummary.ratings['4'] || 0}, 3★: ${feedbacksSummary.ratings['3'] || 0}, 2★: ${feedbacksSummary.ratings['2'] || 0}, 1★: ${feedbacksSummary.ratings['1'] || 0}
Top selected positive tags: ${JSON.stringify(feedbacksSummary.topPositives || [])}
Top selected improvement tags: ${JSON.stringify(feedbacksSummary.topImprovements || [])}
Representative customer comments (anonymized): ${JSON.stringify(feedbacksSummary.sampleComments || [])}

Provide an objective, constructive business summary in JSON format with:
- "strengths": array of 2-4 key operational/service strengths customers highlighted
- "areasForImprovement": array of 2-4 constructive areas for growth
- "customerSentimentSummary": a 2-3 sentence executive summary of overall customer sentiment
- "actionableRecommendations": array of 2-3 specific, low-cost practical tips for the team

Do not invent facts or mention things customers did not mention.`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        success: true,
        insights: {
          ...parsed,
          generatedAt: new Date().toISOString(),
          feedbackCountAnalyzed: feedbacksSummary.total,
        },
      });
    } catch (err) {
      // Fallback summary
      return res.json({
        success: true,
        insights: {
          strengths: feedbacksSummary.topPositives?.map((p: any) => p.name).slice(0, 3) || ['Good overall experience'],
          areasForImprovement: feedbacksSummary.topImprovements?.map((p: any) => p.name).slice(0, 3) || ['Continue monitoring consistency'],
          customerSentimentSummary: `Customers generally rate ${businessName} at ${feedbacksSummary.avgRating} out of 5 stars based on ${feedbacksSummary.total} customer responses.`,
          actionableRecommendations: [
            'Recognize staff on top-mentioned positive feedback categories.',
            'Address frequent improvement points during weekly team briefings.',
          ],
          generatedAt: new Date().toISOString(),
          feedbackCountAnalyzed: feedbacksSummary.total,
        },
      });
    }
  } catch (error) {
    console.error('Error generating business insights:', error);
    res.status(500).json({ success: false, error: 'Failed to generate business insights' });
  }
});

// Helper for deterministic fallback draft generation
function generateFallbackDrafts(
  businessName: string,
  rating: number,
  selectedCategories: string[] = [],
  customerComment?: string
) {
  const cats = selectedCategories.length > 0 ? selectedCategories.join(', ') : '';
  const comment = customerComment ? customerComment.trim() : '';

  if (rating >= 4) {
    return [
      {
        id: '1',
        style: 'Short & Simple',
        description: 'Direct and quick',
        content: `Great experience at ${businessName}.${cats ? ` Really appreciated the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Warm and conversational',
        content: `Had a wonderful visit to ${businessName}! ${cats ? `The ${cats.toLowerCase()} stood out.` : ''}${comment ? ` ${comment}` : ' Everything was smooth and enjoyable.'}`,
      },
      {
        id: '3',
        style: 'Detailed',
        description: 'Comprehensive review',
        content: `Visited ${businessName} recently and had a ${rating === 5 ? '5-star' : 'great'} experience.${cats ? ` In particular, the ${cats.toLowerCase()} made a very positive impression.` : ''}${comment ? ` Details: ${comment}` : ''} Would definitely recommend to others.`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Balanced and formal',
        content: `Quality service at ${businessName}.${cats ? ` Notable highlights include ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Professional standards and positive overall impression.`,
      },
      {
        id: '5',
        style: 'Casual',
        description: 'Everyday tone',
        content: `Really enjoyed checking out ${businessName}! ${cats ? `Super pleased with the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Will be coming back!`,
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
        description: 'Specific points',
        content: `Overall an average visit to ${businessName} (3/5 stars).${cats ? ` Observations: ${cats.toLowerCase()}.` : ''}${comment ? ` Note: ${comment}` : ''} Hope to see small refinements next time.`,
      },
      {
        id: '4',
        style: 'Professional',
        description: 'Objective feedback',
        content: `Average standard at ${businessName}.${cats ? ` Feedback notes on ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''} Fair experience with potential for consistency.`,
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

// Start Server with Vite Middleware for dev or Static Files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
