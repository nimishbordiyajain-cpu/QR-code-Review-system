/**
 * Utility functions for sanitizing, converting, and formatting Google Review URLs.
 */

export function normalizeGoogleReviewUrl(rawInput: string): string {
  if (!rawInput) return '';
  let input = rawInput.trim();

  // If it's a Google Place ID (typically starts with ChIJ and contains 20+ chars)
  if (/^ChIJ[a-zA-Z0-9_-]{15,}$/.test(input)) {
    return `https://search.google.com/local/writereview?placeid=${input}`;
  }

  // If user pasted "placeid=ChIJ..."
  const placeIdMatch = input.match(/placeid=([a-zA-Z0-9_-]+)/i);
  if (placeIdMatch && placeIdMatch[1] && !input.startsWith('http')) {
    return `https://search.google.com/local/writereview?placeid=${placeIdMatch[1]}`;
  }

  // If it doesn't have a protocol
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    if (input.startsWith('//')) {
      input = `https:${input}`;
    } else {
      input = `https://${input}`;
    }
  }

  return input;
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const normalized = normalizeGoogleReviewUrl(url);
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildGoogleMapsSearchUrl(businessName: string, address?: string): string {
  const query = [businessName, address].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'my business')}`;
}

export function buildGoogleBusinessSearchUrl(businessName: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent((businessName || 'my business') + ' google review link')}`;
}

export const SAMPLE_GOOGLE_REVIEW_URLS = [
  {
    label: 'Standard Google Write Review Link',
    url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  },
  {
    label: 'Google Short Link (g.page)',
    url: 'https://g.page/r/CbG95Qe-DEMO/review',
  },
];
