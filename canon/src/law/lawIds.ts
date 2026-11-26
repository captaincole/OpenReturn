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

// law.db's documents are "usc-26-<year>"; corpus.db has none that start so.
const LAW_DOC_PREFIX = "usc-";

/** True for a block of the statute: "usc-26-2025::sec::s469::g-1". */
export const isLawBlockId = (blockId: string): boolean => blockId.startsWith(LAW_DOC_PREFIX);

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
