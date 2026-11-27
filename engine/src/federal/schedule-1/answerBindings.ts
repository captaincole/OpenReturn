/*
 * MANUAL EDIT: Schedule 1 lines from the taxpayer's answers (answers.ts), spread
 * into bindings.ts. Each line follows irs-1040-inst-2025 for that line.
 */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import { formatDollars, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { files2555 } from "../2555/results.js";
import { alimonyGap } from "../4563/receivers.js";
import { form8621Amount, withForm8621 } from "../8621/totals.js";
import { figuredForm8814, withForm8814 } from "../8814/totals.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import {
  iraDeduction,
  iraWorksheetGap,
  NONDEDUCTIBLE_DISAGREES,
  nondeductibleLeftover,
  worksheetLine10,
} from "./iraDeduction.js";
import type { Schedule1 } from "./types.js";

const IRA_WITH_FORM_2555 =
  "A traditional IRA deduction with Form 2555: Pub. 590-A takes the excluded income out of compensation and adds it back to the modified AGI, and the engine does not model those worksheets.";

type Bindings = Partial<{ [K in keyof Schedule1]: BindingFn<Schedule1, Schedule1FilingInfo, K> }>;

/* Line 8z's "Form 8814" item: the total of every Form 8814 line 12, when not 0. */
function form8814Item(info: Schedule1FilingInfo) {
  const line12 = figuredForm8814(info.form8814Totals)?.line12 ?? 0;
  return line12 === 0 ? [] : [{ description: "Form 8814", amount: line12 }];
}

/*
 * Line 8z's "Form 8621" item: Form 8621 lines 6c, 10c or 12, 13c or 14b, and
 * 16b of every fund (federal/8621/results.ts), when not 0.
 */
function form8621Item(info: Schedule1FilingInfo) {
  const amount = form8621Amount(info.form8621Totals, (amounts) => amounts.otherIncome);
  return amount === undefined ? [] : [{ description: "Form 8621", amount }];
}

/* Line 8z with Form 8621's other income; a line that is already unsupported stays so. */
function withForm8621Income(info: Schedule1FilingInfo, own: number | Unsupported | undefined) {
  if (typeof own === "object") return own;
  return withForm8621(info.form8621Totals, own, (amounts) => amounts.otherIncome);
}

/* Lines 2b and 19c: the month and year of the agreement (irs-1040-inst-2025::sec::line-19c::b01). */
const monthYear = (date: string | undefined) => {
  if (!date) return undefined;
  const [year, month] = date.split("-");
  return `${month}/${year}`;
};

/*
 * Line 20 (irs-1040-inst-2025::sec::line-20::b01 and the IRA Deduction
 * Worksheet): the taxpayer's traditional IRA contributions, limited by the
 * worksheet. Line 3 is Form 1040 line 9; line 4 is lines 11–19a, 23 and 25 of
 * this schedule; line 9 is Schedule SE line 6 less lines 15 and 16.
 */
function line20(form: FormAccessor<Schedule1>, info: Schedule1FilingInfo) {
  if (!info.iraContributions) return undefined;
  const covered = info.iraCoveredByPlan === true;
  const gap = iraWorksheetGap({
    status: info.filingStatus,
    coveredByPlan: covered,
    adoptionBenefits: info.iraAdoptionBenefits === true,
    livedApartAllYear: info.livedApartAllYear,
    pub590aWorksheets: info.pub590aWorksheets === true,
  });
  if (gap) return unsupported(gap);
  // MANUAL EDIT: "If you claim either of the exclusions, special rules apply in figuring the amount of your IRA deduction" (irs-2555-inst-2025::sec::choosing-the-exclusion-s::b03).
  if (files2555(info)) return unsupported(IRA_WITH_FORM_2555);
  // Worksheet line 1a: not covered skips lines 2–6, so Form 1040 line 9 (Form 8815 reads line 20) is not read.
  const totalIncome = covered ? form["form-1040.line.9"] : 0;
  if (typeof totalIncome !== "number" || info.iraAge50OrOlder === undefined) return undefined;
  const otherAdjustments = sum(
    form["1.line.11"],
    form["1.line.12"],
    form["1.line.13"],
    form["1.line.14"],
    form["1.line.15"],
    form["1.line.16"],
    form["1.line.17"],
    form["1.line.18"],
    form["1.line.19a"],
    form["1.line.23"],
    form["1.line.25"],
  );
  const earnings = sum(form["schedule-se.0.line.6"]) - sum(form["1.line.15"], form["1.line.16"]);
  const wagesAndAlimony = sum(info.iraWages, form["0.line.2a"]);
  const deduction = roundDollars(
    iraDeduction({
      status: info.filingStatus,
      contributions: info.iraContributions,
      coveredByPlan: covered,
      age50OrOlder: info.iraAge50OrOlder,
      livedApartAllYear: info.livedApartAllYear,
      totalIncome,
      otherAdjustments,
      wagesAndAlimony,
      selfEmploymentEarnings: earnings,
    }),
  );
  // A stated Form 8606 line 1 must be what the worksheet leaves (traditionalIra.ts).
  const stated = info.iraNondeductibleContributions;
  if (deduction === undefined || stated === undefined) return deduction;
  const line10 = worksheetLine10(wagesAndAlimony, earnings);
  const leftover = roundDollars(nondeductibleLeftover(line10, info.iraContributions, deduction));
  return leftover === roundDollars(stated) ? deduction : unsupported(NONDEDUCTIBLE_DISAGREES);
}

export function answerBindings(): Bindings {
  return {
    // irs-1040-inst-2025::sec::lines-2a-and-2b::b01: only under an agreement made before 2019.
    "0.line.2a": (_, info) =>
      info.alimonyReceived === undefined || info.alimonyReceivedTaxable === undefined
        ? undefined
        : info.alimonyReceivedTaxable
          ? roundDollars(info.alimonyReceived)
          : undefined,
    "0.line.2b": (_, info) =>
      info.alimonyReceivedTaxable ? monthYear(info.alimonyReceivedAgreementDate) : undefined,
    "0.line.8h": (_, info) => roundDollars(info.juryDutyPay),
    "0.line.8i": (_, info) => roundDollars(info.prizesAndAwards),
    "0.line.8k": (_, info) => roundDollars(info.stockOptions),
    /*
     * irs-1040-inst-2025::sec::line-8z::b01: "List the type and amount of income."
     * RTAA payments (1099-G box 5) belong here too
     * (irs-pub-525-2025::sec::reemployment-trade-adjustment-assis::b01).
     */
    "0.line.8z": (_, info) =>
      (info.rtaaPayments ?? 0) > 0
        ? unsupported(
            "Form 1099-G box 5 (RTAA payments) belongs on line 8z, and the engine does not add it yet.",
          )
        : // MANUAL EDIT: plus every Form 8814 line 12 (irs-8814-inst-2025::sec::line-12::b01) and Form 8621's other income.
          withForm8621Income(
            info,
            withForm8814(
              info.form8814Totals,
              roundDollars(
                sumOrBlank(
                  info.miscOtherIncome,
                  ...(info.otherIncomeItems ?? []).map((item) => item.amount),
                ),
              ),
              (figured) => figured.line12,
            ),
          ),
    /*
     * "List the type and amount of income" (irs-1040-inst-2025::sec::line-8z::b01):
     * with two or more items each type prints with its amount; one item's amount
     * is line 8z itself.
     */
    "0.line.8z_type": (_, info) => {
      const items = [
        ...(info.miscOtherIncome
          ? [{ description: "Form 1099-MISC", amount: info.miscOtherIncome }]
          : []),
        ...(info.otherIncomeItems ?? []),
        ...form8814Item(info),
        ...form8621Item(info),
      ];
      if (items.length === 0) return undefined;
      if (items.length === 1) return items[0].description;
      return items.map((item) => `${item.description} ${formatDollars(item.amount)}`).join(", ");
    },
    "1.line.16": (_, info) => roundDollars(info.selfEmployedPlanDeduction),
    /*
     * irs-1040-inst-2025::sec::lines-19a-19b-and-19c::b01: only under an agreement made before 2019.
     * MANUAL EDIT: with Form 4563 alimony paid is shared by gross income, a gap (federal/4563/receivers.ts).
     */
    "1.line.19a": (_, info) =>
      info.alimonyPaid === undefined || !info.alimonyPaidDeductible
        ? undefined
        : (alimonyGap(info) ?? roundDollars(info.alimonyPaid)),
    "1.line.19b": (form, info) =>
      typeof form["1.line.19a"] === "number" ? info.alimonyRecipientSsn : undefined,
    "1.line.19c": (form, info) =>
      typeof form["1.line.19a"] === "number" ? monthYear(info.alimonyPaidAgreementDate) : undefined,
    // irs-1040-inst-2025::sec::were-you-covered-by-a-retirement::b02: check the box when married filing separately and apart all year.
    "1.line.20_mfs_lived_apart": (_, info) =>
      info.filingStatus === "married_filing_separately" && info.iraContributions
        ? info.livedApartAllYear
        : undefined,
    "1.line.20": line20,
    "1.line.24a": (_, info) => roundDollars(info.juryDutyPayToEmployer),
    "1.line.24d": (_, info) => roundDollars(info.reforestation),
    "1.line.24e": (_, info) => roundDollars(info.tradeActBenefitRepayment),
    "1.line.24f": (_, info) => roundDollars(info.section501c18dContributions),
    "1.line.24h": (_, info) => roundDollars(info.discriminationClaimFees),
    "1.line.24i": (_, info) => roundDollars(info.whistleblowerAwardFees),
  };
}
