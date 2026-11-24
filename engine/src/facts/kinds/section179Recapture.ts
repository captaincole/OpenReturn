/*
 * Form 4797 Part IV: one fact per property whose business use fell to 50% or
 * less in 2025 (irs-4797-inst-2025::sec::part-iv::b01). The taxpayer states the
 * amounts from the depreciation records; the engine does not hold an asset's
 * history.
 * - section_179: property (not listed property) with a section 179 deduction,
 *   column (a);
 * - section_280f: listed property used more than 50% for business in earlier
 *   years, column (b).
 * Line 35 goes on the schedule that took the deduction (line-35::b01). The engine
 * carries it to a Schedule C business only: the fact names the business.
 */

import { atLeast, roundDollars, sum } from "../../money.js";

type FactRow = { key: string; value: unknown; category: string };

export interface Section179RecaptureFactValue {
  description: string;
  column: "section_179" | "section_280f";
  /*
   * Line 33: column (a), the section 179 deduction claimed when placed in service;
   * column (b), the depreciation allowable in prior years plus any section 179
   * deduction (line-33::b01).
   */
  priorDeductions: number;
  /*
   * Line 34: column (a), the depreciation that would have been allowable from the
   * year placed in service through 2025; column (b), the depreciation that would
   * have been allowable through 2024 without the more-than-50% use (line-34::b01).
   */
  recomputedDepreciation: number;
  /* The business (business.ts businessId) whose Schedule C took the deduction. */
  businessId?: string;
}

export interface Section179RecaptureFact {
  key: string;
  value: Section179RecaptureFactValue;
}

const RECAPTURE_CATEGORY = "other";
const RECAPTURE_PREFIX = "section_179_recapture.";

export function makeSection179RecaptureFactKey(propertySlug: string): string {
  return `${RECAPTURE_PREFIX}${propertySlug}`;
}

export function isSection179RecaptureFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === RECAPTURE_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isRecapture(value: unknown): value is Section179RecaptureFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    typeof fields.description === "string" &&
    (fields.column === "section_179" || fields.column === "section_280f") &&
    isAmount(fields.priorDeductions) &&
    isAmount(fields.recomputedDepreciation) &&
    (fields.businessId === undefined || typeof fields.businessId === "string")
  );
}

/* Each well-formed recapture fact, in the order recorded; a malformed one is listed. */
export function readSection179RecaptureFacts(facts: ReadonlyArray<FactRow>): {
  recaptures: Section179RecaptureFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === RECAPTURE_CATEGORY && isSection179RecaptureFactKey(row.key),
  );
  return {
    recaptures: rows
      .filter((row) => isRecapture(row.value))
      .map((row) => ({ key: row.key, value: row.value as Section179RecaptureFactValue })),
    malformedKeys: rows.filter((row) => !isRecapture(row.value)).map((row) => row.key),
  };
}

/*
 * One property's recapture: line 33 − line 34, whole dollars, at least 0. Each
 * property is figured on its own (part-iv::b01: "figure the recapture amounts
 * separately for each property").
 */
export function section179RecaptureAmount(recapture: Section179RecaptureFactValue): number {
  return atLeast(
    0,
    roundDollars(recapture.priorDeductions) - roundDollars(recapture.recomputedDepreciation),
  );
}

/* The line 35 amounts that go on each business's Schedule C line 6, by businessId (line-35::b01). */
export function section179RecaptureByBusiness(facts: ReadonlyArray<FactRow>): Map<string, number> {
  const out = new Map<string, number>();
  for (const { value } of readSection179RecaptureFacts(facts).recaptures) {
    if (value.businessId === undefined) continue;
    out.set(value.businessId, sum(out.get(value.businessId), section179RecaptureAmount(value)));
  }
  return out;
}
