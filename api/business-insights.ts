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

    const GROQ_DEFAULT_KEY = "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";
    const groqKey = process.env.GROQ_API_KEY || GROQ_DEFAULT_KEY;

    // 1. Try Groq Multi-Model Router First
    if (groqKey) {
      const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
      for (const model of GROQ_MODELS) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a customer experience consultant analyzing feedback. Return a valid JSON object with strengths, areasForImprovement, customerSentimentSummary, actionableRecommendations.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2,
              max_tokens: 1200,
            }),
          });

          if (groqRes.ok) {
            const data: any = await groqRes.json();
            const parsed = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
            if (parsed && typeof parsed === 'object') {
              return res.status(200).json({
                success: true,
                insights: {
                  ...parsed,
                  generatedAt: new Date().toISOString(),
                  feedbackCountAnalyzed: feedbacksSummary.total,
                  provider: 'groq-router',
                  model,
                },
              });
            }
          }
        } catch (groqErr: any) {
          console.warn(`Groq Router insight error on ${model}:`, groqErr?.message || groqErr);
        }
      }
    }

    // 2. Secondary Fallback: Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
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
