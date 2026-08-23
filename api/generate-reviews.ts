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
        description: 'Direct, crisp sentences',
        content: `Great experience at ${businessName}.${cats ? ` Really appreciated the ${cats.toLowerCase()}.` : ''}${comment ? ` ${comment}` : ''}`,
      },
      {
        id: '2',
        style: 'Friendly & Natural',
        description: 'Warm and conversational tone',
        content: `Had a wonderful visit to ${businessName}! ${cats ? `The ${cats.toLowerCase()} really stood out.` : ''}${comment ? ` ${comment}` : ' Everything was smooth and enjoyable.'}`,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      businessName: rawBizName,
      businessCategory: rawBizCategory,
      rating: rawRating,
      selectedCategories: rawSelectedCategories,
      customerComment: rawComment,
      customerName: rawCustomerName,
    } = req.body || {};

    const rating = typeof rawRating === 'number' ? Math.max(1, Math.min(5, Math.round(rawRating))) : null;
    const businessName = sanitizeInputString(rawBizName, 100);
    const businessCategory = sanitizeInputString(rawBizCategory, 60);
    const customerComment = sanitizeInputString(rawComment, 800);
    const customerName = sanitizeInputString(rawCustomerName, 80);

    if (!businessName || rating === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required parameters (businessName and numeric rating between 1 and 5).',
      });
    }

    const selectedCategories: string[] = Array.isArray(rawSelectedCategories)
      ? rawSelectedCategories
          .map((c) => sanitizeInputString(c, 50))
          .filter((c) => c.length > 0)
          .slice(0, 15)
      : [];

    const categoriesText = selectedCategories.length > 0
      ? selectedCategories.join(', ')
      : 'None explicitly selected';

    const commentText = customerComment.length > 0 ? customerComment : 'No additional written text provided';
    const nameText = customerName.length > 0 ? customerName : 'Anonymous customer';

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a helpful writing assistant assisting a customer in phrasing their authentic review for a business.
Generate five natural review drafts based STRICTLY and ONLY on the customer's provided rating, feedback highlights, and comments.

Strict Safety & Authenticity Guardrails:
- Never invent experiences, products, dishes, staff, or events.
- Never exaggerate or alter the customer's sentiment.
- Never increase the rating or make negative experiences sound positive.
- If customer rating is 1, 2, or 3 stars, keep the tone honest, constructive, and balanced.
- If customer rating is 4 or 5 stars, reflect their genuine appreciation.

Return valid JSON with 5 review variations:
1. "Short & Simple" (1-2 sentences)
2. "Friendly & Natural" (warm and conversational)
3. "Detailed" (thorough mention of selected highlights)
4. "Professional" (balanced and formal)
5. "Casual" (relaxed and authentic)`;

        const prompt = `Business: ${businessName}
Category: ${businessCategory || 'Business'}
Star Rating: ${rating}/5
Experience Highlights: ${categoriesText}
Customer Remarks: "${commentText}"
Customer Name: ${nameText}

Output valid JSON array of 5 objects with keys: id (string "1"-"5"), style, description, content.`;

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
          if (!Array.isArray(parsedDrafts) && parsedDrafts && typeof parsedDrafts === 'object') {
            parsedDrafts = (parsedDrafts as any).drafts || (parsedDrafts as any).reviews || Object.values(parsedDrafts);
          }
        } catch {
          // JSON parsing fallback
        }

        if (Array.isArray(parsedDrafts) && parsedDrafts.length >= 3) {
          return res.status(200).json({
            success: true,
            drafts: parsedDrafts.slice(0, 5),
          });
        }
      } catch (aiError: any) {
        console.warn('Gemini API call failed in serverless handler, using fallback:', aiError?.message || aiError);
      }
    }

    const fallbackDrafts = generateFallbackDrafts(businessName, rating, selectedCategories, customerComment);
    return res.status(200).json({
      success: true,
      drafts: fallbackDrafts,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('Error generating reviews:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while generating review suggestions.',
    });
  }
}
