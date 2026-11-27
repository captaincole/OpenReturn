import { z } from "zod";

/*
 * The jurisdictions whose libraries Canon searches: "federal", or a state by
 * its two-letter code. A caller sends the list of the ones that are on; with
 * no list, Canon searches all of them.
 *
 * Cade's own copy of Canon's list (JURISDICTION_TABLE in
 * canon/src/jurisdiction.ts): Cade never imports Canon's code. The unit test
 * tests/unit/mastra/canon/jurisdictions.test.ts reads Canon's file as text and
 * fails when the two lists differ. A new state is one row in each table.
 *
 * - engine: the form engine's name for the jurisdiction of a form (EvaluatedForm.jurisdiction).
 * - docIdPrefixes: how a library block id starts (`ca-540-inst-2025::sec::…`).
 * - lawDocIdPrefixes: the ones of those that are the law (law.db), not instructions.
 * - instructions, law: what a person calls the two kinds of text.
 */
const JURISDICTION_TABLE = {
  federal: {
    name: "federal",
    engine: "federal",
    docIdPrefixes: ["irs-", "usc-", "cfr-"],
    lawDocIdPrefixes: ["usc-", "cfr-"],
    instructions: "the IRS instructions",
    law: "the statute",
  },
  CA: {
    name: "California",
    engine: "state-ca",
    docIdPrefixes: ["ca-", "ftb-"],
    lawDocIdPrefixes: ["ca-rtc-"],
    instructions: "the FTB instructions",
    law: "California's code",
  },
} as const;

export type Jurisdiction = keyof typeof JURISDICTION_TABLE;

const KNOWN = Object.keys(JURISDICTION_TABLE) as [Jurisdiction, ...Jurisdiction[]];

/** Every jurisdiction, federal first: the default when nothing names a list. */
export const ALL_JURISDICTIONS: readonly Jurisdiction[] = KNOWN;

const knownList = KNOWN.map((jurisdiction) => `"${jurisdiction}"`).join(", ");

export const jurisdictionSchema = z.enum(KNOWN);

/** Each named jurisdiction once, in table order. */
export const inTableOrder = (named: readonly Jurisdiction[]): Jurisdiction[] =>
  KNOWN.filter((jurisdiction) => named.includes(jurisdiction));

export const coversAll = (jurisdictions: readonly Jurisdiction[]): boolean =>
  KNOWN.every((jurisdiction) => jurisdictions.includes(jurisdiction));

const isJurisdiction = (value: unknown): value is Jurisdiction =>
  typeof value === "string" && (KNOWN as readonly string[]).includes(value);

export type RequestedJurisdictions =
  { ok: true; jurisdictions: Jurisdiction[] | undefined } | { ok: false; error: string };

/**
 * A caller's list from a request body. Undefined is "not named" (the caller
 * picks the default). An empty list or an unknown value is an error.
 */
export function readRequestedJurisdictions(value: unknown): RequestedJurisdictions {
  if (value === undefined) return { ok: true, jurisdictions: undefined };
  if (!Array.isArray(value))
    return { ok: false, error: `jurisdictions must be a list of ${knownList}.` };
  if (value.length === 0)
    return {
      ok: false,
      error: `Name at least one jurisdiction (${knownList}), or leave the list out.`,
    };
  const unknown = value.find((entry) => !isJurisdiction(entry));
  if (unknown !== undefined)
    return {
      ok: false,
      error: `Unknown jurisdiction ${JSON.stringify(unknown)}. Use one of: ${knownList}.`,
    };
  return { ok: true, jurisdictions: inTableOrder(value as Jurisdiction[]) };
}

/** A list stored in a JSON column. A row from before the list is every jurisdiction. */
export function storedJurisdictions(value: unknown): Jurisdiction[] {
  const known = Array.isArray(value) ? value.filter(isJurisdiction) : [];
  return known.length > 0 ? inTableOrder(known) : [...ALL_JURISDICTIONS];
}

/** The jurisdiction of an engine form ("state-ca" → "CA"); undefined for one this table lacks. */
export function jurisdictionOfEngineForm(engineJurisdiction: string): Jurisdiction | undefined {
  return KNOWN.find(
    (jurisdiction) => JURISDICTION_TABLE[jurisdiction].engine === engineJurisdiction,
  );
}

/** The jurisdiction of a library block, from its id; undefined for an id this table lacks. */
export function jurisdictionOfBlock(blockId: string): Jurisdiction | undefined {
  return KNOWN.find((jurisdiction) =>
    JURISDICTION_TABLE[jurisdiction].docIdPrefixes.some((prefix) => blockId.startsWith(prefix)),
  );
}

/** True for a block of the law (the statute, the regulations, California's code). */
export const isLawBlock = (blockId: string): boolean =>
  KNOWN.some((jurisdiction) =>
    JURISDICTION_TABLE[jurisdiction].lawDocIdPrefixes.some((prefix) => blockId.startsWith(prefix)),
  );

/** "the FTB instructions", "California's code"; a generic name for an unknown jurisdiction. */
export function textName(
  jurisdiction: Jurisdiction | undefined,
  kind: "instructions" | "law",
): string {
  if (jurisdiction) return JURISDICTION_TABLE[jurisdiction][kind];
  return kind === "instructions" ? "the instructions" : "the statute";
}
