/*
 * The libraries an Ask question searches: one switch per jurisdiction. Mirrors
 * cade/src/mastra/canon/jurisdictions.ts by hand; a new state is one row.
 * Relative imports only, so the unit tests can load this file.
 */

const JURISDICTION_TABLE = {
  federal: { label: "Federal", publisher: "IRS" },
  CA: { label: "California", publisher: "FTB" },
} as const;

export type Jurisdiction = keyof typeof JURISDICTION_TABLE;

const KNOWN = Object.keys(JURISDICTION_TABLE) as Jurisdiction[];

/** Every jurisdiction, federal first: all switches on. */
export const ALL_JURISDICTIONS: readonly Jurisdiction[] = KNOWN;

export const jurisdictionLabel = (jurisdiction: Jurisdiction): string =>
  JURISDICTION_TABLE[jurisdiction].label;

const inTableOrder = (on: readonly Jurisdiction[]): Jurisdiction[] =>
  KNOWN.filter((jurisdiction) => on.includes(jurisdiction));

const coversAll = (on: readonly Jurisdiction[]): boolean =>
  KNOWN.every((jurisdiction) => on.includes(jurisdiction));

/** A switch can turn off only while another one stays on. */
export const canTurnOff = (on: readonly Jurisdiction[], jurisdiction: Jurisdiction): boolean =>
  !on.includes(jurisdiction) || on.length > 1;

/** Flips one switch. The last switch that is on stays on. */
export function toggleJurisdiction(
  on: readonly Jurisdiction[],
  jurisdiction: Jurisdiction,
): Jurisdiction[] {
  if (!on.includes(jurisdiction)) return inTableOrder([...on, jurisdiction]);
  if (!canTurnOff(on, jurisdiction)) return [...on];
  return on.filter((entry) => entry !== jurisdiction);
}

/** "Searched: California only" when not every library was searched; null when all were. */
export function searchedNote(searched: readonly Jurisdiction[] | undefined): string | null {
  if (!searched || searched.length === 0 || coversAll(searched)) return null;
  const labels = inTableOrder(searched).map(jurisdictionLabel);
  return `Searched: ${labels.join(" and ")} only`;
}

/** "IRS and FTB", "FTB": the publishers of the libraries searched. */
export function publishersOf(searched: readonly Jurisdiction[] | undefined): string {
  const on = searched && searched.length > 0 ? inTableOrder(searched) : [...KNOWN];
  return on.map((jurisdiction) => JURISDICTION_TABLE[jurisdiction].publisher).join(" and ");
}
