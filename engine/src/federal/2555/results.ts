/*
 * What Form 2555 sends to other forms, for every copy of it: line 45 to
 * Schedule 1 line 8d, line 50 to Schedule 1 line 24j, and both to the Foreign
 * Earned Income Tax Worksheet and the MAGI lines that add them back. The
 * engine evaluates only the first copy, so each total is figured here from
 * every person's lines (person.ts), as Form 4137's later copies are.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import { line44Amount } from "./lines.js";
import type { Form2555Filer } from "./person.js";

/* Any form's accessor: full field ids ("schedule-1.1.line.15") resolve from every form. */
export type ReturnAccessor = { readonly [fieldId: string]: unknown };

type Result = number | Unsupported | undefined;

const SELF_EMPLOYMENT_ELSEWHERE =
  "Schedule SE holds self-employment income that is not on this Form 2555: line 44 takes the deductible part of self-employment tax that is definitely related to the excluded income (irs-2555-inst-2025::sec::line-44::b01), and Schedule SE figures one amount for all of it.";
const TWO_SELF_EMPLOYED =
  "Both spouses' Forms 2555 say that all of Schedule SE is theirs: line 44 cannot give the whole deductible part of self-employment tax to each.";

/* Schedule 1 line 15: the deductible part of self-employment tax. */
const SELF_EMPLOYMENT_DEDUCTION = "schedule-1.1.line.15";

export const files2555 = (info: BaseFilingInfo): boolean =>
  info.mustFile?.["form-2555"]?.value === true;

/* Every person's form, or undefined while an answer the form needs is missing. */
function settledFilers(info: Form2555FilingInfo): Form2555Filer[] | undefined {
  if ((info.missingInputs?.["form-2555"] ?? []).length > 0) return undefined;
  return info.form2555Filers;
}

const gapOf = (filer: Form2555Filer) => filer.partIVGap ?? filer.exclusionGap;

/*
 * Line 44: the deductions definitely related to the foreign earned income,
 * times the excluded share (lines.ts line44Amount). With income on line 20a or
 * 20b they include "the deductible part of self-employment tax"
 * (irs-2555-inst-2025::sec::line-44::b01), Schedule 1 line 15, when all of
 * Schedule SE is this form's income.
 *
 * DECISION (2026-11-25, by the author): line 44 takes the excluded share of the
 * deductible part of self-employment tax. Text A, the form's instructions:
 * line 44 holds deductions "such as the deductible part of self-employment
 * tax, and the expenses claimed on Schedule C" (irs-2555-inst-2025::sec::line-44::b01).
 * Text B, Pub. 54 example 2: a self-employed person's line 44 is "$66,666
 * (98.48% (0.9848) × $67,695), business expenses" only
 * (irs-pub-54-2025::sec::how-to-report-deductions::b04). The engine follows
 * Text A: a form's own instructions decide how that form is filled.
 */
export function line44Of(
  filer: Form2555Filer,
  form: ReturnAccessor,
  info: Form2555FilingInfo,
): Result {
  const gap = gapOf(filer);
  if (gap !== undefined) return unsupported(gap);
  const lines = filer.exclusion;
  if (lines?.line43 === undefined) return undefined;
  if (lines.selfEmployment === "waiting") return undefined;
  if (lines.selfEmployment === "other") return unsupported(SELF_EMPLOYMENT_ELSEWHERE);
  if (lines.selfEmployment === "none") {
    return line44Amount(lines.line43, lines.line27, lines.relatedDeductions);
  }
  const included = (info.form2555Filers ?? []).filter(
    (each) => each.exclusion?.selfEmployment === "included",
  );
  if (included.length > 1) return unsupported(TWO_SELF_EMPLOYED);
  const seDeduction = numberOrBlank(form[SELF_EMPLOYMENT_DEDUCTION]);
  if (seDeduction === undefined) return undefined;
  return line44Amount(lines.line43, lines.line27, lines.relatedDeductions + seDeduction);
}

/* Line 45: line 43 less line 44. Pub. 54 example 4 shows it can be below 0. */
export function line45Of(
  filer: Form2555Filer,
  form: ReturnAccessor,
  info: Form2555FilingInfo,
): Result {
  const line44 = line44Of(filer, form, info);
  const line43 = filer.exclusion?.line43;
  if (typeof line44 !== "number" || line43 === undefined) return line44;
  return line43 - line44;
}

/* A total over every copy: the first gap, else blank while any copy waits, else blank with no amount. */
function totalOf(filers: Form2555Filer[], pick: (filer: Form2555Filer) => Result): Result {
  const values = filers.map(pick);
  const gap = values.find((value): value is Unsupported => typeof value === "object");
  if (gap !== undefined) return gap;
  const amounts = values.filter((value): value is number => typeof value === "number");
  return amounts.length === 0 || amounts.length < values.length ? undefined : sum(...amounts);
}

/* Schedule 1 line 8d: line 45 of every Form 2555; blank without the form. */
export function exclusionTotal(form: ReturnAccessor, info: Form2555FilingInfo): Result {
  if (!files2555(info)) return undefined;
  const filers = settledFilers(info);
  if (filers === undefined) return undefined;
  return totalOf(filers, (filer) =>
    filer.exclusion?.line43 === undefined && gapOf(filer) === undefined
      ? 0
      : line45Of(filer, form, info),
  );
}

/* Schedule 1 line 24j: line 50 of every Form 2555; blank when no copy completes Part IX. */
export function housingDeductionTotal(info: Form2555FilingInfo): Result {
  if (!files2555(info)) return undefined;
  const filers = settledFilers(info);
  if (filers === undefined) return undefined;
  const gap = filers.map(gapOf).find((each) => each !== undefined);
  if (gap !== undefined) return unsupported(gap);
  const amounts = filers
    .map((filer) => filer.exclusion?.partIX?.line50)
    .filter((line50): line50 is number => line50 !== undefined);
  return amounts.length === 0 ? undefined : sum(...amounts);
}

/* Each person's line 43. */
export interface Line43ByOwner {
  taxpayer: number;
  spouse: number;
}

/*
 * Line 43 of each person's form, for Form 2441's earned income: 0 without the
 * form or without an exclusion; the first gap, or undefined while an answer waits.
 */
export function line43ByOwner(info: Form2555FilingInfo): Line43ByOwner | Unsupported | undefined {
  if (!files2555(info)) return { taxpayer: 0, spouse: 0 };
  const filers = settledFilers(info);
  if (filers === undefined) return undefined;
  const totals: Line43ByOwner = { taxpayer: 0, spouse: 0 };
  for (const filer of filers) {
    const gap = gapOf(filer);
    if (gap !== undefined) return unsupported(gap);
    totals[filer.owner] += filer.exclusion?.line43 ?? 0;
  }
  return totals;
}

/*
 * Form 8960 line 13's MAGI Worksheet line 2(c): "your foreign earned income
 * exclusion (from line 42 of Form 2555)" less "the deductions reported on line
 * 44 of Form 2555 allocable to your foreign earned income exclusion"
 * (irs-8960-inst-2025::sec::line-13-magi-worksheet::b01). The housing
 * exclusion is not added back. Line 44 covers both exclusions; the part
 * allocable to line 42 is its share of line 43 (QUESTIONS.md).
 */
export function earnedIncomeExclusionAddBack(
  form: ReturnAccessor,
  info: Form2555FilingInfo,
): Result {
  if (!files2555(info)) return undefined;
  const filers = settledFilers(info);
  if (filers === undefined) return undefined;
  return totalOf(filers, (filer) => {
    const line44 = line44Of(filer, form, info);
    const line42 = filer.exclusion?.partVII?.line42;
    const line43 = filer.exclusion?.line43;
    if (typeof line44 === "object") return line44;
    if (line42 === undefined || line43 === undefined || line43 === 0) return 0;
    if (line44 === undefined) return undefined;
    return line42 - roundDollars((line44 * line42) / line43);
  });
}

/*
 * Why a line that adds Form 2555's results must wait or is a gap: "waiting"
 * while an answer or line 44 is not in, the first gap of any copy, else
 * undefined (nothing holds it, also without the form).
 */
export function form2555Hold(
  form: ReturnAccessor,
  info: Form2555FilingInfo,
): "waiting" | Unsupported | undefined {
  if (!files2555(info)) return undefined;
  const line45 = exclusionTotal(form, info);
  const line50 = housingDeductionTotal(info);
  if (typeof line45 === "object") return line45;
  if (typeof line50 === "object") return line50;
  const filers = settledFilers(info);
  if (filers === undefined || filers.length === 0 || line45 === undefined) return "waiting";
  return undefined;
}

/*
 * Lines 45 and 50 of every Form 2555, the amount the Foreign Earned Income Tax
 * Worksheet line 2a and the MAGI lines add back. Undefined without the form.
 */
export function excludedAmounts(form: ReturnAccessor, info: Form2555FilingInfo): Result {
  if (!files2555(info)) return undefined;
  const line45 = exclusionTotal(form, info);
  const line50 = housingDeductionTotal(info);
  if (typeof line45 === "object") return line45;
  if (typeof line50 === "object") return line50;
  const filers = settledFilers(info);
  if (filers === undefined || filers.length === 0 || line45 === undefined) return undefined;
  return sum(line45, line50);
}
