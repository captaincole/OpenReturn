/*
 * Parts II and III from the filing info and the other forms' lines. The form's
 * bindings and the lines that receive its results (Form 1040 lines 1f and 30,
 * Schedule 3 line 6c) read the same results, so an engine gap shows on both.
 */

import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8839FilingInfo } from "./filingInfo.js";
import { creditLimit, nonrefundableCredit, partII, type PartIIResult } from "./lines.js";
import { line25ModifiedAgi, partIII, type PartIIIResult } from "./partIII.js";

/* Any form's accessor: a full field id ("form-1040.line.11b") reads that line. */
export type LineReader = { readonly [fieldId: string]: unknown };

/* The full filing info carries the 1040's social security slot too. */
export type Info8839 = Form8839FilingInfo & { socialSecurityBenefits?: number };

const files = (info: Info8839, formId: string) => info.mustFile?.[formId]?.value === true;

export const form8839Files = (info: Info8839) => files(info, "form-8839");

/*
 * Lines 7 and 25 add Form 2555 lines 45 and 50 and Form 4563 line 15
 * (irs-8839-inst-2025::sec::line-7::b01), which have no rules. Social security
 * benefits with an exclusion take the Pub. 915 worksheet for Form 1040 line 6b
 * (irs-1040-inst-2025::sec::use-the-social-security-benefits::b01), which is not modeled.
 */
export const SOCIAL_SECURITY_GAP =
  "Social security benefits with excluded employer adoption benefits: Form 1040 line 6b needs the Pub. 915 worksheet (irs-1040-inst-2025::sec::use-the-social-security-benefits::b01), which is not modeled.";

export function socialSecurityWithExclusion(info: Info8839): boolean {
  return (
    form8839Files(info) &&
    info.adoptionPartIII === "applies" &&
    info.socialSecurityBenefits !== undefined
  );
}

function magiGap(info: Info8839): string | undefined {
  if (files(info, "form-2555")) {
    return "Modified AGI adds Form 2555 lines 45 and 50 (irs-8839-inst-2025::sec::line-7::b01), and Form 2555 has no rules.";
  }
  if (files(info, "form-4563")) {
    return "Modified AGI adds Form 4563 line 15 (irs-8839-inst-2025::sec::line-7::b01), and Form 4563 has no rules.";
  }
  return socialSecurityWithExclusion(info) ? SOCIAL_SECURITY_GAP : undefined;
}

/* Part II, lines 2–16; blank when it is skipped or waits, or while Form 1040 line 11b is blank. */
export function partIIOf(form: LineReader, info: Info8839): PartIIResult | Unsupported | undefined {
  if (!form8839Files(info)) return undefined;
  if (info.adoptionGap) return unsupported(info.adoptionGap);
  if (info.adoptionPartII !== "applies") return undefined;
  const gap = magiGap(info);
  if (gap) return unsupported(gap);
  const agi = numberOrBlank(form["form-1040.line.11b"]);
  if (agi === undefined) return undefined;
  const inputs = (info.adoptionChildren ?? []).map(({ line2, line3, line5 }) => ({
    line2,
    line3,
    line5,
  }));
  return partII(inputs, agi, sum(info.adoptionCarryforward));
}

const WORKSHEET_B_GAP =
  "Schedule 8812 sends this filer to its Credit Limit Worksheet B (irs-1040s8-inst-2025::sec::line-13::b01), whose line 14 replaces Form 1040 line 19 here (irs-8839-inst-2025::sec::credit-limit-worksheet-line-17::b01); Worksheet B is not modeled.";

const CREDITS_BEFORE = [
  "form-1040.line.19",
  "schedule-3.0.line.1",
  "schedule-3.0.line.2",
  "schedule-3.0.line.3",
  "schedule-3.0.line.4",
  "schedule-3.0.line.5b",
  "schedule-3.0.line.6d",
  "schedule-3.0.line.6f",
  "schedule-3.0.line.6g",
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
] as const;

/* Lines 17 and 18 (the Credit Limit Worksheet); blank while the carryforward or 1040 line 18 is blank. */
export function creditLimitOf(
  form: LineReader,
  info: Info8839,
): { line17: number; line18: number } | Unsupported | undefined {
  const part = partIIOf(form, info);
  if (part === undefined || "unsupported" in part) return part;
  if (info.adoptionCarryforward === undefined) return undefined;
  const worksheetB =
    part.line16 > 0 &&
    !files(info, "form-2555") &&
    sum(form["schedule-8812.0.line.4_qualifying_children_under_17"]) > 0;
  if (worksheetB) return unsupported(WORKSHEET_B_GAP);
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  const line17 = creditLimit(part.line16, line18, sum(...CREDITS_BEFORE.map((id) => form[id])));
  return { line17, line18: nonrefundableCredit(part.line16, line17) };
}

const WAGES_WITHOUT_1F = ["1a", "1b", "1c", "1d", "1e", "1g", "1h_amount"];
const OTHER_INCOME = ["2b", "3b", "4b", "5b", "6b", "7a"];
const ADJUSTMENTS = ["11", "12", "13", "14", "15", "16", "17", "18", "19a", "20", "23", "25"];

/* Part III, lines 19–31; blank when it is skipped or waits. */
export function partIIIOf(
  form: LineReader,
  info: Info8839,
): PartIIIResult | Unsupported | undefined {
  if (!form8839Files(info)) return undefined;
  const gap = info.adoptionGap ?? info.adoptionPartIIIGap;
  if (gap) return unsupported(gap);
  if (info.adoptionPartIII !== "applies") return undefined;
  const magi = magiGap(info);
  if (magi) return unsupported(magi);
  const rows = info.adoptionChildren ?? [];
  const inputs = rows.map((row) => ({
    line19: row.line19,
    line20: row.line20,
    line22: row.line22,
    takesLine21: row.takesLine21 === true,
  }));
  const line23 = sum(...rows.map((row) => row.line22));
  const modifiedAgi = line25ModifiedAgi({
    wagesWithoutLine1f: sum(...WAGES_WITHOUT_1F.map((line) => form[`form-1040.line.${line}`])),
    line23,
    otherIncome:
      sum(...OTHER_INCOME.map((line) => form[`form-1040.line.${line}`])) +
      sum(form["schedule-1.0.line.10"]),
    adjustments: sum(...ADJUSTMENTS.map((line) => form[`schedule-1.1.line.${line}`])),
  });
  return partIII(inputs, modifiedAgi);
}
