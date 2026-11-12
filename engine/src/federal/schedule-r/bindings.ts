/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { disabledPeople, partIBox, type PartIBox } from "./boxes.js";
import type { ScheduleRFilingInfo } from "./filingInfo.js";
import type { ScheduleR } from "./types.js";

/* Line 10 by Part I box (irs-1040sr-inst-2025::sec::line-10::b01). */
const INITIAL_AMOUNT: Record<PartIBox, number> = {
  1: 5000,
  2: 5000,
  3: 7500,
  4: 5000,
  5: 7500,
  6: 7500,
  7: 5000,
  8: 3750,
  9: 3750,
};

/* Line 11, box 6: $5,000 plus the under-65 spouse's disability income (line-11::b02). */
const BOX_6_SPOUSE_65_AMOUNT = 5000;

/* Line 15 by Part I box (the form's line 15). */
const AGI_THRESHOLD: Record<PartIBox, number> = {
  1: 7500,
  2: 7500,
  3: 10000,
  4: 10000,
  5: 10000,
  6: 10000,
  7: 10000,
  8: 5000,
  9: 5000,
};

/* Line 17: one-half of line 16. */
const EXCESS_AGI_SHARE = 0.5;

/* Line 20: 15% of line 19. */
const CREDIT_RATE = 0.15;

/* Boxes for a person retired on disability: line 11 and Part II apply (specific-instructions::b01). */
const DISABILITY_BOXES: readonly PartIBox[] = [2, 4, 5, 6, 9];

const checked = (info: ScheduleRFilingInfo, box: PartIBox) =>
  partIBox(info) === box ? true : undefined;

/* Part III is blank until a Part I box applies. */
const boxed = (info: ScheduleRFilingInfo): PartIBox | undefined => partIBox(info) ?? undefined;

const hasDisabilityBox = (info: ScheduleRFilingInfo): boolean => {
  const box = boxed(info);
  return box !== undefined && DISABILITY_BOXES.includes(box);
};

/* Line 11's disability income, by the person each box names (line-11::b02). */
function disabilityIncome(info: ScheduleRFilingInfo): number | undefined {
  const amounts = disabledPeople(info).map((person) =>
    person === "taxpayer"
      ? info.scheduleRTaxpayerDisabilityIncome
      : info.scheduleRSpouseDisabilityIncome,
  );
  return amounts.includes(undefined) ? undefined : sum(...amounts);
}

export function register(): void {
  defineForm<ScheduleR, ScheduleRFilingInfo>("schedule-r", {
    bindings: {
      // MANUAL EDIT: "Name(s) shown on return": both names on a joint return.
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.part1.box_1_single_65_or_older": (_, info) => checked(info, 1),
      "0.part1.box_2_single_under_65_disabled": (_, info) => checked(info, 2),
      "0.part1.box_3_mfj_both_65_or_older": (_, info) => checked(info, 3),
      "0.part1.box_4_mfj_both_under_65_one_disabled": (_, info) => checked(info, 4),
      "0.part1.box_5_mfj_both_under_65_both_disabled": (_, info) => checked(info, 5),
      "0.part1.box_6_mfj_one_65_other_disabled": (_, info) => checked(info, 6),
      "0.part1.box_7_mfj_one_65_other_not_disabled": (_, info) => checked(info, 7),
      "0.part1.box_8_mfs_65_or_older_lived_apart": (_, info) => checked(info, 8),
      "0.part1.box_9_mfs_under_65_disabled_lived_apart": (_, info) => checked(info, 9),
      // MANUAL EDIT: part-ii-statement-of-permanent-and::b02: an earlier statement, certified by this box.
      "0.part2.physician_statement_on_file": (_, info) =>
        hasDisabilityBox(info) && info.scheduleRPhysicianStatementOnFile === true
          ? true
          : undefined,
      "1.line.10_initial_amount": (_, info) => {
        const box = boxed(info);
        return box === undefined ? undefined : INITIAL_AMOUNT[box];
      },
      // MANUAL EDIT: line-11::b01-b02: only for box 2, 4, 5, 6 or 9.
      "1.line.11_taxable_disability_income": (_, info) => {
        if (!hasDisabilityBox(info)) return undefined;
        const income = disabilityIncome(info);
        if (income === undefined) return undefined;
        return roundDollars(boxed(info) === 6 ? BOX_6_SPOUSE_65_AMOUNT + income : income);
      },
      "1.line.12_smaller_line_10_or_11": (form, info) => {
        const line10 = form["1.line.10_initial_amount"];
        if (line10 === undefined) return undefined;
        if (!hasDisabilityBox(info)) return line10;
        const line11 = form["1.line.11_taxable_disability_income"];
        return line11 === undefined ? undefined : Math.min(line10, line11);
      },
      /*
       * MANUAL EDIT: line-13a::b01: generally Form 1040 line 6a minus line 6b.
       * Tier 1 railroad benefits and a workers' compensation offset have no fact.
       */
      "1.line.13a_nontaxable_social_security": (form, info) => {
        const line6a = numberOrBlank(form["form-1040.line.6a"]);
        if (boxed(info) === undefined || line6a === undefined) return undefined;
        const nontaxable = atLeast(0, line6a - sum(form["form-1040.line.6b"]));
        return nontaxable > 0 ? nontaxable : undefined;
      },
      // MANUAL EDIT: line-13b::b01, the taxpayer's answer.
      "1.line.13b_nontaxable_pensions": (_, info) => {
        const pensions = info.scheduleRNontaxablePensions;
        return boxed(info) !== undefined && pensions !== undefined && pensions > 0
          ? roundDollars(pensions)
          : undefined;
      },
      // MANUAL EDIT: waits for the line 13b answer; "enter -0-" when neither applies.
      "1.line.13c_total_nontaxable_income": (form, info) =>
        boxed(info) === undefined || info.scheduleRNontaxablePensions === undefined
          ? undefined
          : sum(
              form["1.line.13a_nontaxable_social_security"],
              form["1.line.13b_nontaxable_pensions"],
            ),
      // MANUAL EDIT: Form 1040 line 11b equals line 11a, the AGI Table 1 names.
      "1.line.14_agi": (form, info) =>
        boxed(info) === undefined ? undefined : numberOrBlank(form["form-1040.line.11b"]),
      "1.line.15_agi_threshold": (_, info) => {
        const box = boxed(info);
        return box === undefined ? undefined : AGI_THRESHOLD[box];
      },
      "1.line.16_excess_agi": (form) => {
        const line14 = form["1.line.14_agi"];
        const line15 = form["1.line.15_agi_threshold"];
        return line14 === undefined || line15 === undefined
          ? undefined
          : atLeast(0, line14 - line15);
      },
      "1.line.17_half_excess_agi": (form) => {
        const line16 = form["1.line.16_excess_agi"];
        return line16 === undefined ? undefined : roundDollars(line16 * EXCESS_AGI_SHARE);
      },
      "1.line.18_total_reductions": (form) => {
        const line13c = form["1.line.13c_total_nontaxable_income"];
        const line17 = form["1.line.17_half_excess_agi"];
        return line13c === undefined || line17 === undefined ? undefined : line13c + line17;
      },
      "1.line.19_amount_after_reductions": (form) => {
        const line12 = form["1.line.12_smaller_line_10_or_11"];
        const line18 = form["1.line.18_total_reductions"];
        return line12 === undefined || line18 === undefined ? undefined : line12 - line18;
      },
      // MANUAL EDIT: line 19 zero or less: "stop; you can't take the credit".
      "1.line.20_tentative_credit": (form) => {
        const line19 = form["1.line.19_amount_after_reductions"];
        return line19 !== undefined && line19 > 0 ? roundDollars(line19 * CREDIT_RATE) : undefined;
      },
      /*
       * MANUAL EDIT: line-21::b01, the Credit Limit Worksheet: Form 1040 line 18
       * minus Schedule 3 lines 1, 2 and 6l. Zero or less: "stop; you can't take this credit".
       */
      "1.line.21_tax_liability_limit": (form) => {
        const tax = numberOrBlank(form["form-1040.line.18"]);
        if (form["1.line.20_tentative_credit"] === undefined || tax === undefined) return undefined;
        const limit =
          tax -
          sum(
            form["schedule-3.0.line.1"],
            form["schedule-3.0.line.2"],
            form["schedule-3.0.line.6l"],
          );
        return limit > 0 ? limit : undefined;
      },
      "1.line.22_credit": (form) => {
        const line20 = form["1.line.20_tentative_credit"];
        const line21 = form["1.line.21_tax_liability_limit"];
        return line20 === undefined || line21 === undefined ? undefined : Math.min(line20, line21);
      },
    },

    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
