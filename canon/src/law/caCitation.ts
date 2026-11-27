import { CA_VERSION_MARK } from "./lawIds";

/*
 * California citations as people write them. A California section number
 * looks like a Code section ("17041") or a regulation ("17024.5"), so a
 * California citation must name its code: "CA 17041(a)", "CA-17024.5",
 * "R&TC 17041", "Cal. Rev. & Tax. Code § 17041(a)(1)". A bare number stays
 * the Internal Revenue Code's, a number with a dot a regulation. Pure.
 */

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
// Words between the code's name and the number.
const SEPARATORS = ["section", "sec.", "§§", "§", "-"];
const NUMBER_DOT = ".";

const isDigit = (char: string) => char >= "0" && char <= "9";
const isLetter = (char: string | undefined) =>
  char !== undefined && char.toLowerCase() !== char.toUpperCase();

/** The text after a California prefix; null when the text names no California code. */
function afterPrefix(text: string): string | null {
  const lower = text.toLowerCase();
  const prefix = CA_PREFIXES.find(
    (candidate) => lower.startsWith(candidate) && !isLetter(text[candidate.length]),
  );
  return prefix === undefined ? null : text.slice(prefix.length);
}

function dropSeparators(text: string): string {
  let rest = text.trim();
  for (let found = true; found;) {
    const word = SEPARATORS.find((separator) => rest.toLowerCase().startsWith(separator));
    found = word !== undefined;
    if (word) rest = rest.slice(word.length).trim();
  }
  return rest;
}

/**
 * "CA 17041(a)(1)" → section "17041" and the rest "(a)(1)". undefined when
 * the text names no California code; null when it does, with no number.
 */
export function splitCaCitation(raw: string): { section: string; rest: string } | null | undefined {
  const after = afterPrefix(raw.trim());
  if (after === null) return undefined;
  const text = dropSeparators(after);
  let end = 0;
  while (end < text.length && (isDigit(text[end]) || text[end] === NUMBER_DOT)) end++;
  let section = text.slice(0, end);
  while (section.endsWith(NUMBER_DOT)) section = section.slice(0, -1);
  if (!section || !isDigit(section[0])) return null;
  return { section, rest: text.slice(end) };
}

/** The version a California section id names: "…::sec::s17058-v2" → 2; 1 with no mark. */
export function versionOfSectionId(sectionId: string): number {
  const at = sectionId.lastIndexOf(CA_VERSION_MARK);
  const digits = at < 0 ? "" : sectionId.slice(at + CA_VERSION_MARK.length);
  return digits && [...digits].every(isDigit) ? Number(digits) : 1;
}
