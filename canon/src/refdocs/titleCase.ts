/* IRS headings are Title Case and body prose is not: the parser's heading tests read this. */
const TITLE_CASE_SMALL_WORDS = new Set([
  "of",
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "in",
  "on",
  "at",
  "to",
  "from",
  "by",
  "with",
  "as",
  "nor",
  "but",
  "vs",
]);

export function isTitleCaseLine(text: string): boolean {
  const words = text.split(/\s+/);
  for (const word of words) {
    const bare = word.replace(/[^A-Za-z]/g, "");
    if (bare.length === 0) continue;
    if (TITLE_CASE_SMALL_WORDS.has(bare.toLowerCase())) continue;
    if (!/^[A-Z]/.test(bare)) return false;
  }
  return true;
}
