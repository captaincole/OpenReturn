/*
 * The statute (Canon's law.db) as the web app reads it. Keep the types in
 * sync by hand with canon/src/mastra/server/routes/law.ts and
 * canon/src/law/lawSection.ts: the web app shares no source with Canon.
 */

export interface LawNotInstalled {
  installed: false;
  message: string;
}

export type LawStatus =
  | LawNotInstalled
  | { installed: true; docId: string; title: string; published: string | null; sections: number };

export interface LawBlock {
  blockId: string;
  /** The citation path: ["g", "1"]. A continuation or a second piece shares its unit's path. */
  path: string[];
  citation: string;
  text: string;
}

export interface LawSection {
  installed: true;
  section: {
    /** As printed: "469", "1400Z–2". */
    number: string;
    citation: string;
    heading: string;
    /** The structure levels above the section, outermost first. */
    breadcrumbs: string[];
  };
  release: { title: string; published: string | null };
  blocks: LawBlock[];
}

const BLOCK_ID_MARK = "::";
// law.db's documents are "usc-26-<year>"; no IRS or FTB document id starts so.
const LAW_DOC_PREFIX = "usc-";
const SECTION_SLUG_PREFIX = "s";
const PAGE_ROOT = "/library/law";
const OFFICIAL_SECTION_ROOT = "https://uscode.house.gov/us/usc/t26";
// Words that may come before the section number; they carry nothing.
const LEADING_WORDS = ["26 u.s.c.", "26 usc", "irc", "i.r.c.", "section", "sec.", "§"];

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string) => char.toLowerCase() !== char.toUpperCase();
const isSectionChar = (char: string) => isDigit(char) || isLetter(char) || char === "-";

/** The section number as a URL holds it: "1400Z–2" → "1400Z-2". */
export const sectionInUrl = (number: string): string =>
  number.replaceAll("–", "-").replaceAll("—", "-").trim();

/** True for a block of the statute: "usc-26-2025::sec::s469::g-1". */
export const isLawBlockId = (blockId: string): boolean => blockId.startsWith(LAW_DOC_PREFIX);

/** The element id of a block on its section's page: the end of its id, "g-1". */
export const blockAnchor = (blockId: string): string =>
  blockId.slice(blockId.lastIndexOf(BLOCK_ID_MARK) + BLOCK_ID_MARK.length);

export const lawSectionHref = (section: string, anchor?: string): string =>
  `${PAGE_ROOT}/${encodeURIComponent(sectionInUrl(section))}${anchor ? `#${anchor}` : ""}`;

/** The Office of the Law Revision Counsel's page for one section. */
export const officialTextUrl = (number: string): string =>
  `${OFFICIAL_SECTION_ROOT}/s${sectionInUrl(number)}/`;

/*
 * "usc-26-2025::sec::s469::g-1" → section "469", anchor "g-1". The slug is
 * lower case; Code section letters are capitals ("199A"), a "-dup2" is not.
 */
function fromBlockId(blockId: string): { section: string; anchor?: string } | null {
  const [, kind, slug, anchor] = blockId.split(BLOCK_ID_MARK);
  if (kind !== "sec" || !slug?.startsWith(SECTION_SLUG_PREFIX)) return null;
  const section = slug.slice(SECTION_SLUG_PREFIX.length);
  if (!section || !isDigit(section[0])) return null;
  const [number, ...dup] = section.split("-dup");
  const printed = [number.toUpperCase(), ...dup].join("-dup");
  return { section: printed, anchor: anchor || undefined };
}

function dropLeadingWords(text: string): string {
  let rest = text.trim();
  for (let word = matchLeading(rest); word; word = matchLeading(rest))
    rest = rest.slice(word.length).trim();
  return rest;
}

const matchLeading = (text: string) =>
  LEADING_WORDS.find((word) => text.toLowerCase().startsWith(word));

/** "(g)(1)(A)" → ["g", "1", "A"]; null when the text is anything else. */
function parenSegments(text: string): string[] | null {
  const segments: string[] = [];
  let rest = text.replaceAll(" ", "");
  while (rest.startsWith("(")) {
    const close = rest.indexOf(")");
    const segment = close < 0 ? "" : rest.slice(1, close);
    if (!segment || ![...segment].every((char) => isDigit(char) || isLetter(char))) return null;
    segments.push(segment);
    rest = rest.slice(close + 1);
  }
  return rest === "" ? segments : null;
}

/** "26 U.S.C. § 469(g)(1)(A)" → section "469", anchor "g-1-A". */
function fromCitation(citation: string): { section: string; anchor?: string } | null {
  const rest = dropLeadingWords(sectionInUrl(citation));
  let end = 0;
  while (end < rest.length && isSectionChar(rest[end])) end++;
  const section = rest.slice(0, end);
  const segments = parenSegments(rest.slice(end));
  if (!section || !isDigit(section[0]) || !segments) return null;
  return { section, anchor: segments.length > 0 ? segments.join("-") : undefined };
}

/*
 * The statute page for a citation or a law block id; null when the input
 * is neither. lawHref("469(g)(1)(A)") → "/library/law/469#g-1-A".
 */
export function lawHref(input: string): string | null {
  const target = input.includes(BLOCK_ID_MARK) ? fromBlockId(input.trim()) : fromCitation(input);
  return target ? lawSectionHref(target.section, target.anchor) : null;
}
