/*
 * The law (Canon's law.db: the Code and the Treasury regulations) as the
 * web app reads it. Keep the types in sync by hand with
 * canon/src/mastra/server/routes/law.ts and canon/src/law/lawSection.ts:
 * the web app shares no source with Canon. A section number with a dot
 * ("1.469-5T") is a regulation; a Code section number never has one.
 */

export interface LawNotInstalled {
  installed: false;
  message: string;
}

export type LawSource = "statute" | "regulations";

export interface LawStatusDocument {
  docId: string;
  source: LawSource;
  title: string;
  published: string | null;
  sections: number;
}

export type LawStatus = LawNotInstalled | { installed: true; documents: LawStatusDocument[] };

export interface LawBlock {
  blockId: string;
  /** The citation path: ["g", "1"]. A continuation or a second piece shares its unit's path. */
  path: string[];
  citation: string;
  text: string;
}

export interface LawSection {
  installed: true;
  source: LawSource;
  section: {
    /** As printed: "469", "1400Z–2", "1.469-5T". */
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
const SECTION_SLUG_PREFIX = "s";
const PAGE_ROOT = "/library/law";
const OFFICIAL_SECTION_ROOT = "https://uscode.house.gov/us/usc/t26";
/** eCFR's page of one section: the current text, which can be newer than the dated copy we hold. */
const OFFICIAL_REG_ROOT = "https://www.ecfr.gov/current/title-26/section-";
const REG_DOT = ".";
const QA_STEP = "Q&A-";
const QA_ID = "qa";
// Words that may come before the section number; they carry nothing. Longer ones first.
const LEADING_WORDS = [
  "26 u.s.c.",
  "26 usc",
  "irc",
  "i.r.c.",
  "26 c.f.r.",
  "26 cfr",
  "c.f.r.",
  "cfr",
  "treasury regulation",
  "treas. reg.",
  "treas. regs.",
  "reg.",
  "section",
  "sec.",
  "§§",
  "§",
];

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string) => char.toLowerCase() !== char.toUpperCase();
const isSectionChar = (char: string) => isDigit(char) || isLetter(char) || char === "-";

/** The section number as a URL holds it: "1400Z–2" → "1400Z-2". */
export const sectionInUrl = (number: string): string =>
  number.replaceAll("–", "-").replaceAll("—", "-").trim();

/** The element id of a block on its section's page: the end of its id, "g-1". */
export const blockAnchor = (blockId: string): string =>
  blockId.slice(blockId.lastIndexOf(BLOCK_ID_MARK) + BLOCK_ID_MARK.length);

export const lawSectionHref = (section: string, anchor?: string): string =>
  `${PAGE_ROOT}/${encodeURIComponent(sectionInUrl(section))}${anchor ? `#${anchor}` : ""}`;

export const isRegulation = (number: string): boolean => number.includes(REG_DOT);

/** The official page for one section: the Law Revision Counsel's for the Code, eCFR's for a regulation. */
export const officialTextUrl = (number: string): string =>
  isRegulation(number)
    ? `${OFFICIAL_REG_ROOT}${sectionInUrl(number)}`
    : `${OFFICIAL_SECTION_ROOT}/s${sectionInUrl(number)}/`;

/*
 * "usc-26-2025::sec::s469::g-1" → section "469", anchor "g-1". The slug is
 * lower case; Code section letters are capitals ("199A"), a "-dup2" is not.
 * A regulation's letters are capitals outside parentheses ("1.469-5T",
 * "1.1031(a)-1"); Canon finds a section in either case.
 */
function fromBlockId(blockId: string): { section: string; anchor?: string } | null {
  const [, kind, slug, anchor] = blockId.split(BLOCK_ID_MARK);
  if (kind !== "sec" || !slug?.startsWith(SECTION_SLUG_PREFIX)) return null;
  const section = slug.slice(SECTION_SLUG_PREFIX.length);
  if (!section || !isDigit(section[0])) return null;
  if (isRegulation(section))
    return { section: regulationCase(section), anchor: anchor || undefined };
  const [number, ...dup] = section.split("-dup");
  const printed = [number.toUpperCase(), ...dup].join("-dup");
  return { section: printed, anchor: anchor || undefined };
}

function regulationCase(slug: string): string {
  let depth = 0;
  return [...slug]
    .map((char) => {
      if (char === "(") depth++;
      if (char === ")") depth--;
      return depth > 0 ? char : char.toUpperCase();
    })
    .join("");
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

const takeSectionChars = (text: string, from: number) => {
  let end = from;
  while (end < text.length && isSectionChar(text[end])) end++;
  return end;
};

/** The length of the "(…)(…)" run at `from`; 0 when there is none. */
function groupsEnd(text: string, from: number): number {
  let end = from;
  while (text[end] === "(") {
    const close = text.indexOf(")", end);
    if (close < 0) return from;
    end = close + 1;
  }
  return end;
}

/** "1.1031(a)-1(b)": the number runs through each "(…)" that a hyphen follows. */
function regulationEnd(text: string, dot: number): number {
  let end = takeSectionChars(text, dot + 1);
  for (let groups = groupsEnd(text, end); groups > end && text[groups] === "-";) {
    end = takeSectionChars(text, groups);
    groups = groupsEnd(text, end);
  }
  return end;
}

/** ", Q&A-1(b)" → the anchor's first step "qa1", and the rest. */
function qaAnchor(text: string): { step: string | null; rest: string } {
  const trimmed = text.replace(/^[\s,]+/, "");
  if (!trimmed.toUpperCase().startsWith(QA_STEP)) return { step: null, rest: text };
  let end = QA_STEP.length;
  while (isDigit(trimmed[end] ?? "")) end++;
  const digits = trimmed.slice(QA_STEP.length, end);
  return digits
    ? { step: `${QA_ID}${digits}`, rest: trimmed.slice(end) }
    : { step: null, rest: text };
}

/** "26 U.S.C. § 469(g)(1)(A)" → section "469", anchor "g-1-A"; "26 CFR § 1.469-5T(a)" → "1.469-5T", "a". */
function fromCitation(citation: string): { section: string; anchor?: string } | null {
  const rest = dropLeadingWords(sectionInUrl(citation));
  const head = takeSectionChars(rest, 0);
  const end = rest[head] === REG_DOT ? regulationEnd(rest, head) : head;
  const section = rest.slice(0, end);
  if (!section || !isDigit(section[0]) || section.endsWith(REG_DOT)) return null;
  const qa = isRegulation(section)
    ? qaAnchor(rest.slice(end))
    : { step: null, rest: rest.slice(end) };
  const segments = parenSegments(qa.rest);
  if (!segments) return null;
  const steps = qa.step ? [qa.step, ...segments] : segments;
  return { section, anchor: steps.length > 0 ? steps.join("-") : undefined };
}

/*
 * The law page for a citation or a law block id; null when the input is
 * neither. lawHref("469(g)(1)(A)") → "/library/law/469#g-1-A";
 * lawHref("1.469-5T(a)(1)") → "/library/law/1.469-5T#a-1".
 */
export function lawHref(input: string): string | null {
  const target = input.includes(BLOCK_ID_MARK) ? fromBlockId(input.trim()) : fromCitation(input);
  return target ? lawSectionHref(target.section, target.anchor) : null;
}
