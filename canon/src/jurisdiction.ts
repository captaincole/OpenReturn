import { z } from "zod";
import type { LawSource } from "./law/citation";

/*
 * A jurisdiction is a tax authority whose documents the library holds:
 * "federal", or a state by its two-letter code. A caller names the
 * jurisdictions to search; with no list, every jurisdiction is on.
 *
 * Each document belongs to the jurisdiction of its publisher
 * (ref_documents.publisher). This table is the one place that says so: a
 * new state is one row, and a new publisher must get a row
 * (tests/unit/jurisdiction.test.ts reads every sidecar under sources/).
 *
 * Each jurisdiction also owns its law sources in law.db: lawSources are
 * what searchLaw searches for it, and statutes are what the statute round
 * of Ask and of the grounding review searches (no regulations: the judges'
 * prompts are written for a statute). Every law sidecar's source must be
 * in one row (the same test).
 */
const JURISDICTION_TABLE = {
  federal: {
    name: "federal",
    publishers: ["IRS", "OLRC", "OFR"],
    lawSources: ["statute", "regulations"],
    statutes: ["statute"],
  },
  CA: {
    name: "California",
    publishers: ["FTB", "Legislative Counsel of California"],
    lawSources: ["california"],
    statutes: ["california"],
  },
} as const satisfies Record<
  string,
  {
    name: string;
    publishers: readonly string[];
    lawSources: readonly LawSource[];
    statutes: readonly LawSource[];
  }
>;

export type Jurisdiction = keyof typeof JURISDICTION_TABLE;

const KNOWN = Object.keys(JURISDICTION_TABLE) as [Jurisdiction, ...Jurisdiction[]];

/** Every jurisdiction, federal first: the default when a caller names none. */
export const ALL_JURISDICTIONS: readonly Jurisdiction[] = KNOWN;

const PUBLISHER_JURISDICTION = new Map<string, Jurisdiction>(
  KNOWN.flatMap((jurisdiction) =>
    JURISDICTION_TABLE[jurisdiction].publishers.map((publisher) => [publisher, jurisdiction]),
  ),
);

const knownList = KNOWN.map((jurisdiction) => `"${jurisdiction}"`).join(", ");

export const jurisdictionSchema = z.enum(KNOWN, {
  error: (issue) =>
    `Unknown jurisdiction ${JSON.stringify(issue.input)}. Use one of: ${knownList}.`,
});

/* For tool and workflow input. An agent reads the description. */
export const jurisdictionsInputSchema = z
  .array(jurisdictionSchema)
  .min(1, { error: `Name at least one jurisdiction (${knownList}), or leave the list out.` })
  .optional()
  .describe(
    `Optional: the jurisdictions to search, ${knownList}. ["CA"] searches only the California (FTB) documents; ["federal"] searches only the federal (IRS) documents. Leave it out to search every jurisdiction.`,
  );

/** The jurisdictions to search: each named one once, in table order; all of them when none is named. */
export function resolveJurisdictions(named?: readonly Jurisdiction[]): Jurisdiction[] {
  if (named === undefined) return [...ALL_JURISDICTIONS];
  return KNOWN.filter((jurisdiction) => named.includes(jurisdiction));
}

/** Validates a caller's list. Throws an input error for an empty list or an unknown value. */
export function parseJurisdictions(value: unknown): Jurisdiction[] {
  const parsed = jurisdictionsInputSchema.safeParse(value);
  if (!parsed.success) throw new Error(`jurisdictions: ${parsed.error.issues[0].message}`);
  return resolveJurisdictions(parsed.data);
}

/** The jurisdiction of a document's publisher. An unknown publisher is an error, never a default. */
export function jurisdictionOfPublisher(publisher: string): Jurisdiction {
  const jurisdiction = PUBLISHER_JURISDICTION.get(publisher);
  if (!jurisdiction)
    throw new Error(
      `Publisher "${publisher}" has no jurisdiction. Add it to JURISDICTION_TABLE in canon/src/jurisdiction.ts.`,
    );
  return jurisdiction;
}

export const coversAll = (jurisdictions: readonly Jurisdiction[]): boolean =>
  KNOWN.every((jurisdiction) => jurisdictions.includes(jurisdiction));

/**
 * The publishers whose documents a search keeps, or null for no filter. Every
 * jurisdiction on is no filter, so that search is the same as a search with no list.
 */
export function publisherFilter(jurisdictions?: readonly Jurisdiction[]): string[] | null {
  if (jurisdictions === undefined || coversAll(jurisdictions)) return null;
  return jurisdictions.flatMap((jurisdiction) => [...JURISDICTION_TABLE[jurisdiction].publishers]);
}

/** "California only", for one line of a judge's prompt when not every jurisdiction is on. */
export function searchedLine(jurisdictions: readonly Jurisdiction[]): string | null {
  if (coversAll(jurisdictions)) return null;
  const names = jurisdictions.map((jurisdiction) => JURISDICTION_TABLE[jurisdiction].name);
  return `Libraries searched: ${names.join(" and ")} only.`;
}

/**
 * The law sources of the jurisdictions on, in table order: "statute",
 * "regulations", then "california". searchLaw searches each one on its own.
 */
export function lawSourcesOf(jurisdictions: readonly Jurisdiction[]): LawSource[] {
  return resolveJurisdictions(jurisdictions).flatMap((jurisdiction) => [
    ...JURISDICTION_TABLE[jurisdiction].lawSources,
  ]);
}

/** The statutes of the jurisdictions on, federal first: what the statute round searches. */
export function statutesOf(jurisdictions: readonly Jurisdiction[]): LawSource[] {
  return resolveJurisdictions(jurisdictions).flatMap((jurisdiction) => [
    ...JURISDICTION_TABLE[jurisdiction].statutes,
  ]);
}

/** The jurisdiction a law source belongs to. An unknown source is an error, never a default. */
export function jurisdictionOfLawSource(source: string): Jurisdiction {
  const jurisdiction = KNOWN.find((known) =>
    (JURISDICTION_TABLE[known].lawSources as readonly string[]).includes(source),
  );
  if (!jurisdiction)
    throw new Error(
      `Law source "${source}" has no jurisdiction. Add it to JURISDICTION_TABLE in canon/src/jurisdiction.ts.`,
    );
  return jurisdiction;
}
