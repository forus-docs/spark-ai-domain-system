/**
 * Utilities for extracting and validating URLs from text
 */

// Comprehensive URL regex that matches various URL formats
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;

// More permissive regex that also catches URLs without protocol
const LOOSE_URL_REGEX = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;

export interface ExtractedUrl {
  url: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract URLs from text content
 * @param text - The text to extract URLs from
 * @param includeLoose - Whether to include URLs without protocol (defaults to false)
 * @returns Array of extracted URLs with metadata
 */
export function extractUrls(text: string, includeLoose = false): ExtractedUrl[] {
  if (!text) return [];
  
  const regex = includeLoose ? LOOSE_URL_REGEX : URL_REGEX;
  const matches = Array.from(text.matchAll(regex));
  
  return matches
    .map(match => {
      let url = match[0];
      
      // Add protocol if missing (for loose matches)
      if (includeLoose && !url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      return {
        url,
        originalText: match[0],
        startIndex: match.index!,
        endIndex: match.index! + match[0].length
      };
    })
    .filter(urlData => isValidUrl(urlData.url)); // Filter out invalid URLs
}

/**
 * Check if a URL is valid and accessible
 * @param url - The URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    // Check if it has a valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 4) {
      return false;
    }
    // Check if it has at least one dot in hostname (basic domain check)
    if (!urlObj.hostname.includes('.')) {
      return false;
    }
    // Filter out obvious non-URLs
    if (urlObj.hostname.match(/^\d+\.\d+\.\d+$/) || // Looks like a version number
        urlObj.hostname.match(/^\d{4}-\d{2}-\d{2}/) || // Looks like a date
        urlObj.pathname.match(/\.(pdf|doc|docx|xls|xlsx)$/i) || // File extension without proper domain
        urlObj.hostname === 'e.g.' || // Common example text
        urlObj.hostname.match(/^[a-z]\.[a-z]\.$/) || // Single letter domains like e.g.
        urlObj.hostname.match(/^localhost/) || // Localhost URLs
        urlObj.pathname.endsWith('.pdf') && !urlObj.hostname.includes('.') || // PDF without domain
        urlObj.hostname.length < 4 || // Too short to be a real domain
        !urlObj.hostname.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)) { // Invalid domain format
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param url - The URL to extract domain from
 * @returns The domain or null if invalid
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Split text into parts with URLs separated
 * Useful for rendering text with embedded link previews
 * @param text - The text to split
 * @param includeLoose - Whether to include URLs without protocol (defaults to true for link previews)
 * @returns Array of text parts and URL parts
 */
export function splitTextWithUrls(text: string, includeLoose = true): Array<{ type: 'text' | 'url'; content: string }> {
  const urls = extractUrls(text, includeLoose);
  
  if (urls.length === 0) {
    return [{ type: 'text', content: text }];
  }
  
  const parts: Array<{ type: 'text' | 'url'; content: string }> = [];
  let lastIndex = 0;
  
  urls.forEach(urlData => {
    // Add text before URL
    if (urlData.startIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, urlData.startIndex)
      });
    }
    
    // Add URL
    parts.push({
      type: 'url',
      content: urlData.url
    });
    
    lastIndex = urlData.endIndex;
  });
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return parts;
}

/**
 * Check if text contains any URLs
 * @param text - The text to check
 * @returns Whether the text contains URLs
 */
export function containsUrl(text: string): boolean {
  // Create a new regex instance without global flag for test()
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/i;
  return regex.test(text);
}