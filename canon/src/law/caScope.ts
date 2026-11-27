/*
 * What the California extract takes from the code: one code, one division,
 * and a list of parts. A part is taken whole, or only the chapters it
 * names. The scope is data: to add a chapter, add it to the part's list and
 * cut the extract again (`law extract-ca`). The extract stores its scope
 * as a file, so the parser can say which parts are partial. Pure.
 */

export interface CaPartScope {
  /** As the tables print it: "10.", "11.". */
  part: string;
  /** The chapters to keep, as the tables print them ("17."); none means the whole part. */
  chapters?: string[];
}

export interface CaScope {
  code: string;
  division: string;
  parts: CaPartScope[];
}

/*
 * Revenue and Taxation Code, Division 2: every part of the franchise and
 * income tax laws, whole. The personal income tax (Part 10), its
 * administration (Part 10.2), the earned income credit notices (10.3), the
 * elective tax of a pass-through entity (10.4, 10.4.1), the Taxpayers' Bill
 * of Rights (10.7), Part 10.8, the Corporation Tax Law (Part 11) and the
 * health coverage penalty (Part 32). The other parts of the division (sales,
 * fuel, property tax programs) are not income tax law and stay out.
 */
export const CA_LIBRARY_SCOPE: CaScope = {
  code: "RTC",
  division: "2.",
  parts: [
    { part: "10." },
    { part: "10.2." },
    { part: "10.3." },
    { part: "10.4." },
    { part: "10.4.1." },
    { part: "10.7." },
    { part: "10.8." },
    { part: "11." },
    { part: "32." },
  ],
};

/** The file in the extract that holds its scope. */
export const SCOPE_FILE = "EXTRACT_SCOPE.json";

/** The scope as the extract stores it: one line of JSON, keys in a fixed order. */
export function scopeFileText(scope: CaScope): string {
  const parts = scope.parts.map(({ part, chapters }) =>
    chapters && chapters.length > 0 ? { part, chapters: [...chapters] } : { part },
  );
  return `${JSON.stringify({ code: scope.code, division: scope.division, parts })}\n`;
}

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

function coercePart(value: unknown): CaPartScope | null {
  if (!value || typeof value !== "object") return null;
  const { part, chapters } = value as Record<string, unknown>;
  if (!isText(part)) return null;
  if (chapters === undefined) return { part };
  return Array.isArray(chapters) && chapters.every(isText) ? { part, chapters } : null;
}

/** The scope an extract stores; null for an extract with no scope file (every part whole). */
export function readScopeFile(text: string | undefined): CaScope | null {
  if (text === undefined) return null;
  const value = JSON.parse(text) as Record<string, unknown>;
  const parts = Array.isArray(value.parts) ? value.parts.map(coercePart) : [];
  if (!isText(value.code) || !isText(value.division) || parts.some((part) => part === null))
    throw new Error(`California extract: ${SCOPE_FILE} does not name a code, division and parts`);
  return { code: value.code, division: value.division, parts: parts as CaPartScope[] };
}

/** The chapters taken from a part; null when the part is taken whole or is not in the scope. */
export function chaptersTaken(scope: CaScope | null, part: string): string[] | null {
  const found = scope?.parts.find((entry) => entry.part === part);
  return found?.chapters && found.chapters.length > 0 ? found.chapters : null;
}

const withoutPeriod = (value: string) => (value.endsWith(".") ? value.slice(0, -1) : value);

/** ["17."] → "only Chapter 17 is in the library"; ["4.5.", "17."] → "only Chapters 4.5 and 17 are …". */
export function partialNote(chapters: string[]): string {
  const numbers = chapters.map(withoutPeriod);
  if (numbers.length === 1) return `only Chapter ${numbers[0]} is in the library`;
  const list = `${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}`;
  return `only Chapters ${list} are in the library`;
}
