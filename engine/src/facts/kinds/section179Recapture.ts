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
  /*
   * California Schedule D-1 line 36: column (a), the section 179 expense claimed
   * on the California return under R&TC 17201; column (b), the California
   * recovery deductions of prior years (ca-540-sched-d1-inst-2025::sec::part-iv::b01,
   * b02). Absent: the federal amount.
   */
  californiaPriorDeductions?: number;
  /*
   * California Schedule D-1 line 37, with California amounts (part-iv::b02), over
   * the same years as recomputedDepreciation (see californiaRecapture). Absent: the
   * federal amount.
   */
  californiaRecomputedDepreciation?: number;
}

/*
 * The recapture with its California amounts in the federal fields (Schedule D-1 lines 36 and 37).
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): which property
 * fills Schedule D-1 Part IV column (a). Text A: complete column (a) if "The
 * property was not used predominantly in your trade or business at any time"
 * and "That property ceased to be qualified property before the close of the
 * second taxable year after it was placed in service"
 * (ca-540-sched-d1-inst-2025::sec::part-iv::b01). Text B: the form's Part IV
 * heading, "Recapture Amounts Under IRC Sections 179 and 280F(b)(2) When Business
 * Use Drops to 50% or Less", and purpose item 6, recapture "when the business use
 * of IRC Section 179 or 280F(b)(2) property drops to 50% or less"
 * (a-purpose::b03), as federal Form 4797 (irs-4797-inst-2025::sec::part-iv::b01).
 * The engine follows Text B, the same test as federal: a section 179 deduction
 * needs more than 50% business use when the property is placed in service, so
 * Text A read literally fits no property that took one.
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): the years of
 * line 37 column (b). Text A: "Figure the deductions from the year it was placed
 * in service to the current year" (ca-540-sched-d1-inst-2025::sec::part-iv::b02).
 * Text B: "Figure the depreciation from the year it was placed in service up to
 * (but not including) the current year" (irs-4797-inst-2025::sec::line-34::b01).
 * The engine follows Text B (through 2024): line 36 column (b) counts the
 * deductions "in prior tax years" (part-iv::b02), and line 38 subtracts line 37
 * from line 36, so both lines must cover the same years.
 */
export function californiaRecapture(
  recapture: Section179RecaptureFactValue,
): Section179RecaptureFactValue {
  return {
    ...recapture,
    priorDeductions: recapture.californiaPriorDeductions ?? recapture.priorDeductions,
    recomputedDepreciation:
      recapture.californiaRecomputedDepreciation ?? recapture.recomputedDepreciation,
  };
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
    (fields.californiaPriorDeductions === undefined ||
      isAmount(fields.californiaPriorDeductions)) &&
    (fields.californiaRecomputedDepreciation === undefined ||
      isAmount(fields.californiaRecomputedDepreciation)) &&
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
