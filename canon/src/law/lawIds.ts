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

export const citationOf = (number: string, path: string[]): string =>
  `26 U.S.C. § ${number}${path.map((segment) => `(${segment})`).join("")}`;
