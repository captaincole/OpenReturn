/* FTB 3506: when Part III and Part IV apply, and the readings they share. */

import type { FormAccessor } from "../../../defineForm.js";
import { hasBenefits } from "../../../federal/2441/lines.js";
import { numberOrBlank, roundDollars, sum } from "../../../money.js";
import type { Form3506FilingInfo } from "./filingInfo.js";
import type { Form3506 } from "./types.js";

export type Form = FormAccessor<Form3506>;

export const NO_PROVIDER =
  "No care provider gave care in California (line 1), and the credit needs one: only care provided in California qualifies (ca-3506-inst-2025::sec::line-1::b01).";
export const NONRESIDENT_EARNED_INCOME =
  "A nonresident or part-year resident (Form 540NR) enters only earned income from California sources (the form, lines 4 and 5); no fact splits earned income by source.";

/* Part IV is completed only with dependent care benefits (the form: "Did you receive dependent care benefits?"). */
export const receivedBenefits = (info: Form3506FilingInfo) => hasBenefits(info);

/*
 * Part III applies with expenses for care in California (line 2 column (e)).
 * A married filer filing separately takes it only when Section E applies
 * (ca-3506-inst-2025::sec::e-married-persons-or-rdps-filing-separate-tax-returns::b01).
 * Undefined while an answer waits.
 */
export function creditClaimed(info: Form3506FilingInfo): boolean | undefined {
  const persons = info.caCarePersons ?? [];
  if (!persons.some((person) => (person.californiaExpenses ?? 0) > 0)) {
    return persons.some((person) => person.californiaExpenses === undefined) ? undefined : false;
  }
  if (info.filingStatus === undefined) return undefined;
  if (info.filingStatus !== "married_filing_separately") return true;
  return info.dependentCareMfsTreatedAsUnmarried;
}

export const hasProvider = (info: Form3506FilingInfo) => (info.caCareProviders ?? []).length > 0;

/* The return is Form 540NR: lines 4, 5, 19 and 20 need California-source earned income. */
export const filesNonresidentReturn = (info: Form3506FilingInfo) =>
  info.mustFile?.["form-540nr"]?.value === true;

/* Lines 7 and 9 read federal AGI from Form 540 line 13 (ca-3506-inst-2025::sec::line-7::b01). */
export const federalAgi = (form: Form) => numberOrBlank(form["form-540.line.13_federal_agi"]);

/* Line 2 column (e), every row in whole dollars; undefined while a row waits. */
export function columnE(info: Form3506FilingInfo): number[] | undefined {
  const amounts = (info.caCarePersons ?? []).map((person) =>
    roundDollars(person.californiaExpenses),
  );
  return amounts.includes(undefined) ? undefined : (amounts as number[]);
}

export const columnETotal = (info: Form3506FilingInfo) => {
  const amounts = columnE(info);
  return amounts === undefined ? undefined : sum(...amounts);
};

/* The lines' values, or undefined while any line is blank. */
export function filledLines(...values: unknown[]): number[] | undefined {
  return values.every((value) => typeof value === "number") ? (values as number[]) : undefined;
}
