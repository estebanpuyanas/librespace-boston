// Parses a freeform search string into keywords and #hashtags.
// Example: "typescript #tutorial #api" → keywords: ["typescript"], tags: ["tutorial", "api"]

export interface ParsedSearch {
  keywords: string[];
  tags: string[];
}

export const parseSearch = (search: string): ParsedSearch => {
  const tokens = search.trim().split(/\s+/).filter(Boolean);
  const tags = tokens
    .filter(t => t.startsWith('#'))
    .map(t => t.slice(1).toLowerCase());
  const keywords = tokens.filter(t => !t.startsWith('#'));
  return { keywords, tags };
};

export const buildTextRegex = (keywords: string[]): RegExp =>
  new RegExp(
    keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'i'
  );
