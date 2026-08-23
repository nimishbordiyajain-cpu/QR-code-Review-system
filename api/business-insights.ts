import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function sanitizeInputString(val: any, maxLength: number = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, maxLength);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { businessName: rawBizName, category: rawCat, feedbacksSummary } = req.body || {};
    const businessName = sanitizeInputString(rawBizName, 100);
    const category = sanitizeInputString(rawCat, 60);

    if (!feedbacksSummary || !feedbacksSummary.total || feedbacksSummary.total < 3) {
      return res.status(200).json({
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a customer experience consultant analyzing aggregated, anonymized customer feedback for ${businessName} (${category || 'Small Business'}).
Total feedback items: ${feedbacksSummary.total}
Average rating: ${feedbacksSummary.avgRating} / 5
Rating distribution: 5★: ${feedbacksSummary.ratings?.['5'] || 0}, 4★: ${feedbacksSummary.ratings?.['4'] || 0}, 3★: ${feedbacksSummary.ratings?.['3'] || 0}, 2★: ${feedbacksSummary.ratings?.['2'] || 0}, 1★: ${feedbacksSummary.ratings?.['1'] || 0}
Top selected positive tags: ${JSON.stringify(feedbacksSummary.topPositives || [])}
Top selected improvement tags: ${JSON.stringify(feedbacksSummary.topImprovements || [])}

Provide an objective, constructive business summary in JSON format with:
- "strengths": array of 2-4 key operational/service strengths customers highlighted
- "areasForImprovement": array of 2-4 constructive areas for growth
- "customerSentimentSummary": a 2-3 sentence executive summary of overall customer sentiment
- "actionableRecommendations": array of 2-3 specific, low-cost practical tips for the team`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.status(200).json({
          success: true,
          insights: {
            ...parsed,
            generatedAt: new Date().toISOString(),
            feedbackCountAnalyzed: feedbacksSummary.total,
          },
        });
      } catch (err: any) {
        console.warn('Gemini API call failed in serverless insights, using summary fallback:', err?.message || err);
      }
    }

    // Default analytical fallback
    return res.status(200).json({
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
  } catch (error: any) {
    console.error('Error generating business insights:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate business insights' });
  }
}
