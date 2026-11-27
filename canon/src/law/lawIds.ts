/*
 * The id and citation spellings the parser writes and the readers look up.
 * No XML here, so Canon's server can import it without the parser.
 */

/** "stA/ch1/schB/ptVI" → "sta-ch1-schb-ptvi"; "s1400Z–2" → "s1400z-2". */
export const slugOf = (path: string): string =>
  path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** A unit number in citation form: "1400Z–2" → "1400Z-2", "(A)" → "A". */
export const citationSegment = (raw: string): string =>
  raw.replace(/[–—]/g, "-").replace(/[^A-Za-z0-9-]/g, "");

/*
 * The start of each law.db document id: "usc-26-<year>", "cfr-26-<year>",
 * "ca-rtc-<year>". No corpus.db document id starts so (FTB documents are
 * "ca-540-inst-2025", hence "ca-rtc-", not "ca-"); a unit test reads every
 * sidecar. The keys are the law sources (citation.ts).
 */
export const LAW_DOC_PREFIXES = {
  statute: "usc-",
  regulations: "cfr-",
  california: "ca-rtc-",
} as const;

type LawDocSource = keyof typeof LAW_DOC_PREFIXES;

/** The law source of a law.db block or document id; null for a corpus id. */
export function lawSourceOfId(id: string): LawDocSource | null {
  const sources = Object.keys(LAW_DOC_PREFIXES) as LawDocSource[];
  return sources.find((source) => id.startsWith(LAW_DOC_PREFIXES[source])) ?? null;
}

/** True for a block of law.db: "usc-26-2025::sec::s469::g-1", "ca-rtc-2025::sec::s17041::a". */
export const isLawBlockId = (blockId: string): boolean => lawSourceOfId(blockId) !== null;

export const citationOf = (number: string, path: string[]): string =>
  `26 U.S.C. § ${number}${path.map((segment) => `(${segment})`).join("")}`;

/*
 * A regulation section in an id: "1.469-5T" → "s1.469-5t". The dot and the
 * parentheses stay ("1.1031(a)-1"): they tell a regulation from a Code section.
 */
export const regSlugOf = (number: string): string =>
  `s${[...number.toLowerCase()].map((char) => (isRegSlugChar(char) ? char : "-")).join("")}`;

const REG_SLUG_MARKS = new Set([".", "(", ")", "-"]);
const isRegSlugChar = (char: string) =>
  (char >= "a" && char <= "z") || (char >= "0" && char <= "9") || REG_SLUG_MARKS.has(char);

/** "26 CFR § 1.469-5T(a)(1)"; a Q&A step reads ", Q&A-1": "26 CFR § 1.408A-4, Q&A-1(b)". */
export const regCitationOf = (number: string, path: string[]): string =>
  `26 CFR § ${number}${path.map(regCitationStep).join("")}`;

export const QA_STEP = "Q&A-";
const regCitationStep = (segment: string) =>
  segment.startsWith(QA_STEP) ? `, ${segment}` : `(${segment})`;

/** California: "Cal. Rev. & Tax. Code § 17041(a)(1)". */
export const caCitationOf = (number: string, path: string[]): string =>
  `Cal. Rev. & Tax. Code § ${number}${path.map((segment) => `(${segment})`).join("")}`;

/*
 * A California section in an id: "17024.5" → "s17024.5". The dots stay, as
 * in a regulation's id; a second version of one number adds "-v2".
 */
export const caSlugOf = (number: string, version = 1): string =>
  `s${number.toLowerCase()}${version > 1 ? `${CA_VERSION_MARK}${version}` : ""}`;

export const CA_VERSION_MARK = "-v";
