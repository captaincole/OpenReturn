/*
 * California's code in the web app. A California section number looks
 * like a Code section ("17041") or a regulation ("17024.5"), so its page
 * names the code: "/library/law/CA-17024.5". Canon reads the same form.
 * Keep CA_PREFIXES in sync by hand with canon/src/law/caCitation.ts.
 */

const BLOCK_ID_MARK = "::";
const SECTION_SLUG_PREFIX = "s";
/** law.db's California documents are "ca-rtc-<year>". */
export const CA_DOC_PREFIX = "ca-";
const CA_PAGE_PREFIX = "CA-";
const VERSION_MARK = "-v";
const NUMBER_DOT = ".";

// Longer ones first; each must end before a character that is not a letter.
const CA_PREFIXES = [
  "california revenue and taxation code",
  "cal. rev. & tax. code",
  "cal. rev. and tax. code",
  "revenue and taxation code",
  "rev. & tax. code",
  "rev. and tax. code",
  "r & tc",
  "r&tc",
  "rtc",
  "cal.",
  "cal",
  "ca",
];
const SEPARATORS = ["section", "sec.", "§§", "§", "-"];

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string | undefined) =>
  char !== undefined && char.toLowerCase() !== char.toUpperCase();

/** "17024.5" → "CA-17024.5": the section's page. */
export const caPageOf = (number: string): string => `${CA_PAGE_PREFIX}${number}`;

/** The version a California block or section id names: "…::sec::s17058-v2::a" → 2; 1 with no mark. */
export function caVersionOf(id: string): number {
  if (!id.startsWith(CA_DOC_PREFIX)) return 1;
  const slug = id.split(BLOCK_ID_MARK)[2] ?? "";
  const at = slug.lastIndexOf(VERSION_MARK);
  const digits = at < 0 ? "" : slug.slice(at + VERSION_MARK.length);
  return digits && [...digits].every(isDigit) ? Number(digits) : 1;
}

/** "ca-rtc-2025::sec::s17058-v2::a-1" → page "CA-17058", anchor "v2-a-1". */
export function caTargetOf(
  blockId: string,
  anchorOf: (blockId: string) => string,
): { section: string; anchor?: string } | null {
  const [, kind, slug, tail] = blockId.split(BLOCK_ID_MARK);
  if (kind !== "sec" || !slug?.startsWith(SECTION_SLUG_PREFIX)) return null;
  const version = slug.lastIndexOf(VERSION_MARK);
  const number = slug.slice(SECTION_SLUG_PREFIX.length, version < 0 ? undefined : version);
  if (!number || !isDigit(number[0])) return null;
  const versionStep = caVersionOf(blockId) > 1 ? `v${caVersionOf(blockId)}` : undefined;
  return { section: caPageOf(number), anchor: tail ? anchorOf(blockId) : versionStep };
}

function dropSeparators(text: string): string {
  let rest = text.trim();
  for (let word = matchSeparator(rest); word; word = matchSeparator(rest))
    rest = rest.slice(word.length).trim();
  return rest;
}

const matchSeparator = (text: string) =>
  SEPARATORS.find((separator) => text.toLowerCase().startsWith(separator));

/**
 * "CA 17041(a)" → number "17041" and the rest "(a)". undefined when the
 * text names no California code; null when it does, with no number.
 */
export function caSplit(raw: string): { section: string; rest: string } | null | undefined {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const prefix = CA_PREFIXES.find(
    (candidate) => lower.startsWith(candidate) && !isLetter(text[candidate.length]),
  );
  if (prefix === undefined) return undefined;
  const after = dropSeparators(text.slice(prefix.length));
  let end = 0;
  while (end < after.length && (isDigit(after[end]) || after[end] === NUMBER_DOT)) end++;
  let section = after.slice(0, end);
  while (section.endsWith(NUMBER_DOT)) section = section.slice(0, -1);
  if (!section || !isDigit(section[0])) return null;
  return { section, rest: after.slice(end) };
}
