/*
 * Form 8936 from the return: Part I from Form 1040 line 11a and the 2024
 * answers, each Schedule A, and the tax limits of Parts III and IV. Every
 * function reads cross-form fields by their full id, so Schedule 2, Schedule 3
 * and Form 8396 call them with their own accessors.
 */

import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { foreignTaxCreditGap } from "../1116/credit.js";
import type { Form4563FilingInfo } from "../4563/filingInfo.js";
import { files4563, form4563Line15Total } from "../4563/results.js";
import { creditGap as retirementCreditGap } from "../8880/credit.js";
import { line6lGap } from "../8978/receivers.js";
import type { Form8936FilingInfo } from "./filingInfo.js";
import { modifiedAgi, taxLimit, totalOf, wholeDollars, type TaxLimitLines } from "./lines.js";
import {
  scheduleA,
  type MagiAnswers,
  type ScheduleAResult,
  type VehicleOutcome,
} from "./scheduleA.js";

export type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

const FORM_2555_GAP =
  "Form 2555 files, and lines 1c and 1d take its lines 45 and 50, which these lines do not read yet.";
const files = (info: Form8936FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* Lines 1c and 1d: blank unless Form 2555 files; then a gap. */
export function excludedIncomeGap(info: Form8936FilingInfo) {
  return files(info, "form-2555") ? unsupported(FORM_2555_GAP) : undefined;
}

/* Line 2's gap, when Form 2555 files. */
function partIGap(info: Form8936FilingInfo): string | undefined {
  return files(info, "form-2555") ? FORM_2555_GAP : undefined;
}

/*
 * Lines 1a, 1b, 1e and 2: Form 1040 line 11a, the Puerto Rico answer and Form
 * 4563 line 15 (every copy; blank without the form). Undefined while line 11a
 * or Form 4563 waits.
 */
export function line2Of(form: Accessor, info: Form8936FilingInfo & Form4563FilingInfo) {
  const agi = numberOrBlank(form["form-1040.line.11a"]);
  if (agi === undefined) return undefined;
  const form4563Line15 = form4563Line15Total(info);
  if (files4563(info) && form4563Line15 === undefined) return undefined;
  const puertoRicoExcluded = wholeDollars(info.cleanVehicleAnswers?.puertoRicoExcluded2025);
  return {
    line1a: agi,
    line1b: puertoRicoExcluded,
    line1e: form4563Line15,
    line2: modifiedAgi({ agi, puertoRicoExcluded, form4563Line15 }),
  };
}

/* Lines 3a–3e and 4: the 2024 return's amounts; undefined while the 2024 AGI waits. */
export function line4Of(info: Form8936FilingInfo) {
  const answers = info.cleanVehicleAnswers;
  if (answers?.agi2024 === undefined) return undefined;
  const added = answers.additions2024 ?? {};
  const parts = {
    agi: wholeDollars(answers.agi2024) ?? 0,
    puertoRicoExcluded: wholeDollars(added.puertoRicoExcluded),
    form2555Line45: wholeDollars(added.form2555Line45),
    form2555Line50: wholeDollars(added.form2555Line50),
    form4563Line15: wholeDollars(added.form4563Line15),
  };
  return { ...parts, line4: modifiedAgi(parts) };
}

/* Every Schedule A, in the order of the facts. Line 2 is not known while Form 2555 files. */
export function scheduleAsOf(form: Accessor, info: Form8936FilingInfo): ScheduleAResult[] {
  const magi: MagiAnswers = {
    status2025: info.filingStatus,
    line2: partIGap(info) === undefined ? line2Of(form, info)?.line2 : undefined,
    line4: line4Of(info)?.line4,
    status2024: info.cleanVehicleAnswers?.status2024,
  };
  const dependent = info.cleanVehicleAnswers?.claimableAsDependent;
  return (info.cleanVehicles ?? []).map((vehicle) => scheduleA(vehicle.value, magi, dependent));
}

/* How far Part I goes: 1 prints lines 1a–2, 2 prints lines 3a–5. */
export function partIReach(form: Accessor, info: Form8936FilingInfo): number {
  return Math.max(0, ...scheduleAsOf(form, info).map((result) => result.reach));
}

/*
 * The Schedules A, or why the totals cannot be figured: a vehicle's gap, or a
 * Part I gap that a vehicle needs. Undefined while a vehicle waits.
 */
export function outcomesOf(
  form: Accessor,
  info: Form8936FilingInfo,
): VehicleOutcome[] | Unsupported | undefined {
  if (!files(info, "form-8936")) return undefined;
  const outcomes = scheduleAsOf(form, info).map((result) => result.outcome);
  const gap = outcomes.find((outcome) => outcome.kind === "gap");
  if (gap?.kind === "gap") return unsupported(gap.reason);
  const waitsOnLine2 = outcomes.some(
    (outcome) => outcome.kind === "waits" && outcome.on === "line2",
  );
  const partI = partIGap(info);
  if (waitsOnLine2 && partI !== undefined) return unsupported(partI);
  return outcomes.some((outcome) => outcome.kind === "waits") ? undefined : outcomes;
}

/* A total over the Schedules A (lines 6, 9, 14, 19; Schedule 2 lines 1b, 1c). */
export function totalOver(
  form: Accessor,
  info: Form8936FilingInfo,
  pick: (outcome: VehicleOutcome) => number | undefined,
): Value {
  const outcomes = outcomesOf(form, info);
  if (outcomes === undefined || "unsupported" in outcomes) return outcomes;
  return totalOf(outcomes.map(pick));
}

const OTHER_CREDIT_GAPS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-8863", "Schedule 3 line 3 (Form 8863)"],
];

/*
 * Lines 11 and 16 add Schedule 3 lines the engine does not compute while their
 * form files: then the total would leave a credit out. Line 1 (Form 1116 or
 * the election) is computed; a gap there is a gap here.
 */
function otherCreditsGap(form: Accessor, info: Form8936FilingInfo): string | undefined {
  const foreignTax = foreignTaxCreditGap(form, info);
  if (foreignTax !== undefined) return `Lines 11 and 16 add ${foreignTax}`;
  const missing = OTHER_CREDIT_GAPS.find(([formId]) => files(info, formId));
  if (missing) {
    return `Lines 11 and 16 add ${missing[1]}, which the engine does not compute.`;
  }
  // Schedule 3 line 6l (Form 8978) is figured; a gap there is a gap here.
  const partnerGap = line6lGap(info);
  if (partnerGap !== undefined) return `Lines 11 and 16 add ${partnerGap}`;
  return retirementCreditGap(form, info)?.reason;
}

/* Line 11: Schedule 3 lines 1–4, 5b, 6d, 6l and 6m (irs-8936-inst-2025::sec::line-11::b01). */
const PART_III_CREDITS = [
  "schedule-3.0.line.1",
  "schedule-3.0.line.2",
  "schedule-3.0.line.3",
  "schedule-3.0.line.4",
  "schedule-3.0.line.5b",
  "schedule-3.0.line.6d",
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
];
/* Line 16: the same, without 6m (irs-8936-inst-2025::sec::part-iv-credit-for-previously-owned::b01). */
const PART_IV_CREDITS = PART_III_CREDITS.filter((id) => id !== "schedule-3.0.line.6m");

/*
 * Lines 10–13 (Part III) or 15–18 (Part IV), once line 9 or 14 is a number.
 * The instructions write "6I"; the engine reads it as Schedule 3 line 6l, the
 * Form 8978 amount (QUESTIONS.md).
 */
export function taxLimitOf(
  form: Accessor,
  info: Form8936FilingInfo,
  part: "III" | "IV",
): TaxLimitLines | Unsupported | undefined {
  const credit =
    part === "III"
      ? totalOver(form, info, (outcome) => (outcome.kind === "new" ? outcome.line12 : undefined))
      : totalOver(form, info, (outcome) =>
          outcome.kind === "previously_owned" ? outcome.line17 : undefined,
        );
  if (typeof credit !== "number") return credit;
  const gap = otherCreditsGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  const tax = numberOrBlank(form["form-1040.line.18"]);
  if (tax === undefined) return undefined;
  const ids = part === "III" ? PART_III_CREDITS : PART_IV_CREDITS;
  return taxLimit(credit, tax, sum(...ids.map((id) => form[id])));
}

/* Schedule 3 line 6f (Part III line 13) or 6m (Part IV line 18). */
export function personalCredit(form: Accessor, info: Form8936FilingInfo, part: "III" | "IV") {
  const lines = taxLimitOf(form, info, part);
  if (lines === undefined || "unsupported" in lines) return lines;
  return lines.credit;
}

/*
 * Why Schedule 3 line 6f or 6m is an engine gap, for a credit limit worksheet
 * that adds them (Form 8396); undefined when they are figured or blank.
 */
export function cleanVehicleCreditGap(form: Accessor, info: Form8936FilingInfo) {
  for (const part of ["III", "IV"] as const) {
    const credit = personalCredit(form, info, part);
    if (typeof credit === "object") return credit.reason;
  }
  return undefined;
}
