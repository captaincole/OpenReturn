import {
  ARMED_FORCES_STORAGE_FEES_KEY,
  businessesOnReturn,
  farmsOnReturn,
  GAMBLING_KEYS,
  getGamblingWinningsFacts,
  getGovernmentPaymentsFacts,
  getNolCarryoverRows,
  getSelfEmployedHealthPlanFacts,
  miscIncomeNotForBusiness,
  NOL_KEYS,
  OTHER_INCOME_KEYS,
  unlinkedMiscIncomeKeys,
} from "../../facts/index.js";
import { sum, sumOrBlank } from "../../money.js";
import { filingStatusOf, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve2106Info } from "../2106/resolveInfo.js";
import { resolve2555Info } from "../2555/resolveInfo.js";
import { resolve3903Info } from "../3903/resolveInfo.js";
import { resolve4797Info } from "../4797/resolveInfo.js";
import { form8621Totals } from "../8621/totals.js";
import { figuredForm8814, form8814Totals } from "../8814/totals.js";
import { resolve8853Info } from "../8853/resolveInfo.js";
import { form8853Reaches, SCHEDULE_1_LINES } from "../8853/results.js";
import { resolve8889Info } from "../8889/resolveInfo.js";
import { canceledDebtIncomeOf, canceledDebts } from "../982/resolveInfo.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { farmsTotal } from "../schedule-f/totals.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import { earlyWithdrawalPenalty, educatorExpenseDeduction } from "./adjustments.js";
import { schedule1Answers } from "./answers.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import { resolveStudentLoanInterest } from "./studentLoanInterest.js";

export function resolveSchedule1Info(inputs: ResolverInputs): Schedule1FilingInfo {
  // A 1099-MISC that pays a business is in that business's gross receipts, not line 8z.
  const misc = miscIncomeNotForBusiness(inputs.facts);
  // One that names a business with no fact waits for Cade's answer (Schedule C asks it).
  const unlinked = unlinkedMiscIncomeKeys(inputs.facts).length > 0;
  const miscOtherIncome =
    misc.length > 0 && !unlinked
      ? sum(...misc.map((row) => (row.value as Record<string, unknown>).box3))
      : undefined;
  // Form 8889 lines 13 and 16 reach the 1040 only through Schedule 1.
  const form8889 = resolve8889Info(inputs).mustFile?.["form-8889"]?.value === true;
  // Form 8853 lines 8, 12 and 26 (line 8e) and line 5 (line 23).
  const form8853 = form8853Reaches(resolve8853Info(inputs), SCHEDULE_1_LINES);
  const jointReturn = filingStatusOf(inputs) === "married_filing_jointly";
  const onReturn = businessesOnReturn(inputs.facts, jointReturn);
  const hasBusiness =
    onReturn.businesses.length + onReturn.spouseKeys.length + onReturn.malformedKeys.length > 0;
  const businessIncome = scheduleCTotal(onReturn);
  const farms = farmsOnReturn(inputs.facts, jointReturn);
  const hasFarm = farms.farms.length + farms.malformedKeys.length > 0;
  const farmTotal = farmsTotal(farms.farms);
  const w2gs = getGamblingWinningsFacts(inputs.facts);
  const winningsNotOnW2G = num(inputs, GAMBLING_KEYS.winningsNotOnW2G);
  const gamblingWinnings =
    w2gs.length > 0 || winningsNotOnW2G !== undefined
      ? sum(...w2gs.map((w2g) => w2g.box1), winningsNotOnW2G)
      : undefined;
  const unemploymentCompensation = unemploymentOn1099G(inputs);
  const rtaaPayments = sumOrBlank(
    ...getGovernmentPaymentsFacts(inputs.facts).map((form) => form.box5),
  );
  const alaskaPermanentFundDividends = num(inputs, OTHER_INCOME_KEYS.alaskaPermanentFundDividends);
  // Schedule SE line 13 reaches the 1040 only through Schedule 1 line 15.
  const scheduleSE = resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value === true;
  // Schedule E line 41 reaches the 1040 only through Schedule 1 line 5.
  const scheduleE = resolveScheduleEInfo(inputs).mustFile?.["schedule-e"]?.value === true;
  const answers = schedule1Answers(inputs);
  const stated = [
    answers.alimonyReceived,
    answers.juryDutyPay,
    answers.prizesAndAwards,
    answers.stockOptions,
    ...(answers.otherIncomeItems ?? []).map((item) => item.amount),
    answers.selfEmployedPlanDeduction,
    answers.alimonyPaid,
    answers.juryDutyPayToEmployer,
    answers.reforestation,
    answers.tradeActBenefitRepayment,
    answers.section501c18dContributions,
    answers.discriminationClaimFees,
    answers.whistleblowerAwardFees,
    answers.iraContributions,
  ].some((amount) => (amount ?? 0) > 0);
  /*
   * A line 8z item below 0 files the schedule too: it is an entry on line 8z,
   * whatever it is. A treaty exemption is one such item, "in parentheses, on
   * Schedule 1 (Form 1040), line 8z" (irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02),
   * but the sign does not make an item one: the treatyExempt mark does
   * (facts/kinds/otherIncome.ts).
   */
  const negativeLine8zItem = (answers.otherIncomeItems ?? []).some((item) => item.amount < 0);
  const educatorExpenses = educatorExpenseDeduction(inputs, jointReturn);
  const savingsPenalty = earlyWithdrawalPenalty(inputs);
  const studentLoan = resolveStudentLoanInterest(inputs);
  const studentLoanInterest = studentLoan.info.studentLoanInterestPaid;
  const moving = movingExpenses(inputs);
  // irs-8814-inst-2025::sec::line-12::b01: every Form 8814 line 12 goes on line 8z.
  const form8814Line12 = figuredForm8814(form8814Totals(inputs))?.line12 ?? 0;
  const canceledDebt = canceledDebtLine8c(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_1",
    fallbacks: [
      {
        rule: `fallback: a stated Schedule 1 amount (${stated}), unemployment compensation $${unemploymentCompensation ?? 0} > 0, RTAA payments $${rtaaPayments ?? 0} > 0, 1099-MISC other income $${miscOtherIncome ?? 0} > 0, W-2G winnings $${gamblingWinnings ?? 0} > 0, Alaska Permanent Fund dividends $${alaskaPermanentFundDividends ?? 0} > 0, a Schedule C business (${hasBusiness}), Schedule SE filed (${scheduleSE}), Schedule E filed (${scheduleE}), Form 8889 filed (${form8889}), a Form 8853 amount (${form8853}), educator expenses $${educatorExpenses ?? 0} > 0, an early withdrawal penalty $${savingsPenalty ?? 0} > 0, or student loan interest $${studentLoanInterest ?? 0} > 0`,
        value:
          stated ||
          (unemploymentCompensation ?? 0) > 0 ||
          (rtaaPayments ?? 0) > 0 ||
          (miscOtherIncome ?? 0) > 0 ||
          (gamblingWinnings ?? 0) > 0 ||
          (alaskaPermanentFundDividends ?? 0) > 0 ||
          hasBusiness ||
          scheduleSE ||
          scheduleE ||
          form8889 ||
          form8853 ||
          (educatorExpenses ?? 0) > 0 ||
          (savingsPenalty ?? 0) > 0 ||
          (studentLoanInterest ?? 0) > 0,
      },
      { rule: "fallback: a line 8z item below 0", value: negativeLine8zItem },
      moving.fallback,
      employeeBusinessExpensesFallback(inputs),
      {
        rule: `fallback: Form 8814 line 12 $${form8814Line12} on line 8z`,
        value: form8814Line12 !== 0,
      },
      form8621Fallback(inputs),
      form4797Fallback(inputs),
      canceledDebt.fallback,
      // Schedule F line 34 goes on line 6 (irs-1040sf-inst-2025::sec::line-34::b02).
      {
        rule: "fallback: a farm fact (Schedule F line 34 on line 6)",
        value: hasFarm,
        triggeredByFactKeys: farms.farms.map((farm) => farm.key),
      },
      // A self-employed health plan's deduction goes on line 17 (irs-7206-inst-2025::sec::general-instructions::b03).
      {
        rule: "fallback: a self-employed health insurance plan (line 17)",
        value: getSelfEmployedHealthPlanFacts(inputs.facts).length > 0,
        triggeredByFactKeys: getSelfEmployedHealthPlanFacts(inputs.facts).map((plan) => plan.key),
      },
      // Form 2555 line 45 goes on line 8d and line 50 on line 24j (line-8d::b01, line-24j::b01).
      {
        rule: "fallback: Form 2555 files (lines 8d and 24j)",
        value: resolve2555Info(inputs).mustFile?.["form-2555"]?.value === true,
      },
      // A stated NOL carryover goes on line 8a (irs-172-inst-2025::sec::deducting-a-carryforward::b01).
      nolCarryoverFallback(inputs),
    ],
  });
  return {
    ...answers,
    mustFile: { "schedule-1": resolution },
    missingInputs: {
      "schedule-1": [
        ...(answers.missingInputs?.["schedule-1"] ?? []),
        ...studentLoan.missing,
        ...canceledDebt.missing,
      ],
    },
    businessIncome,
    hasBusiness,
    farmIncome: farmTotal?.kind === "amount" ? farmTotal.amount : undefined,
    farmIncomeGap: farmTotal?.kind === "gap" ? farmTotal.reason : undefined,
    hasFarm,
    unemploymentCompensation,
    rtaaPayments,
    gamblingWinnings,
    miscOtherIncome,
    alaskaPermanentFundDividends,
    educatorExpenses,
    earlyWithdrawalPenalty: savingsPenalty,
    ...studentLoan.info,
    armedForcesStorageFees: moving.storageFees,
  };
}

/*
 * Line 4: Form 4797 line 18b (the form's line 18b text). Schedule 1 files for
 * an amount there even with no business or rental on the return (a Form 8824
 * recapture on Form 4797 line 16, or a Form 6252 ordinary gain on Form 4797
 * lines 10 and 15), or while the line is a gap.
 */
function form4797Fallback(inputs: ResolverInputs) {
  const info = resolve4797Info(inputs);
  const line18b = info.form4797?.line18b ?? 0;
  const gap = info.form4797Gap ?? info.form4797SummaryGap;
  const files = info.mustFile?.["form-4797"]?.value === true;
  return {
    rule: `fallback: Form 4797 line 18b $${line18b} on line 4 (or a Form 4797 the engine cannot figure)`,
    value: files && (line18b !== 0 || gap !== undefined),
    triggeredByFactKeys: files
      ? (info.mustFile?.["form-4797"]?.derivation?.triggeredByFactKeys ?? [])
      : [],
  };
}

/*
 * Line 8a: a stated NOL carryover with an amount files Schedule 1, and so
 * does an answer that cannot be read, so its gap shows. No answer: nothing.
 */
function nolCarryoverFallback(inputs: ResolverInputs) {
  const rows = getNolCarryoverRows(inputs.facts);
  return {
    rule: "fallback: an NOL carryover to 2025 (line 8a)",
    value: rows === null || (rows ?? []).some((row) => row.carryoverTo2025 > 0),
    triggeredByFactKeys: rows === undefined ? [] : [NOL_KEYS.carryovers],
  };
}

/*
 * Line 8c: the taxable part of the nonbusiness canceled debts (federal/982).
 * Schedule 1 files for an amount, while a Form 1099-C or a debt waits for an
 * answer, or with a gap; it lists the answers line 8c waits for.
 */
function canceledDebtLine8c(inputs: ResolverInputs) {
  const debts = canceledDebts(inputs);
  const line8c = canceledDebtIncomeOf(debts);
  const amount = line8c.canceledDebtIncome ?? 0;
  return {
    fallback: {
      rule: `fallback: canceled debt $${amount} on line 8c (or one that waits or is a gap)`,
      value:
        amount > 0 || line8c.canceledDebtWaits === true || line8c.canceledDebtGap !== undefined,
      triggeredByFactKeys: debts.read.debts.map((debt) => debt.key),
    },
    missing: [...debts.read.unanswered1099C, ...debts.read.missing],
  };
}

/*
 * Line 8z: Form 8621's other income (federal/8621/results.ts). Schedule 1
 * files for it, or while a fund's amounts have a gap.
 */
function form8621Fallback(inputs: ResolverInputs) {
  const totals = form8621Totals(inputs);
  const amount = totals?.amounts.otherIncome ?? 0;
  return {
    rule: `fallback: Form 8621 other income $${amount} on line 8z (or a fund the engine cannot figure)`,
    value: amount !== 0 || totals?.gap !== undefined,
    triggeredByFactKeys: totals?.funds.map((fund) => fund.key) ?? [],
  };
}

/*
 * Line 12: Form 2106 line 10's parts for reservists, performing artists and
 * fee-basis officials (irs-2106-inst-2025::sec::line-10::b01–b03). Schedule 1
 * files for them, or while the Form 2106 totals have a gap.
 */
function employeeBusinessExpensesFallback(inputs: ResolverInputs) {
  const form2106 = resolve2106Info(inputs);
  const totals = form2106.form2106Totals;
  const amount = (totals?.scheduleOne ?? 0) + (totals?.performingArts ?? 0);
  return {
    rule: `fallback: Form 2106 line 10 on Schedule 1 line 12 (${amount} > 0, or a Form 2106 total the engine cannot figure)`,
    value: amount > 0 || form2106.form2106TotalsGap !== undefined,
  };
}

/*
 * Line 14: Form 3903 line 5 (irs-3903-inst-2025::sec::line-5::b01), or storage
 * fees alone with the box checked and no Form 3903 (irs-3903-inst-2025::sec::line-1::b01).
 * Schedule 1 files for either, or while the Form 3903 totals have a gap.
 */
function movingExpenses(inputs: ResolverInputs) {
  const stated = num(inputs, ARMED_FORCES_STORAGE_FEES_KEY);
  const storageFees = stated !== undefined && stated > 0 ? stated : undefined;
  const form3903 = resolve3903Info(inputs);
  const deduction = form3903.movingExpenseDeduction ?? 0;
  return {
    storageFees,
    fallback: {
      rule: `fallback: Armed Forces moving expenses (Form 3903 line 5 $${deduction} > 0, storage fees only $${storageFees ?? 0} > 0, or a Form 3903 total the engine cannot figure)`,
      value: deduction > 0 || storageFees !== undefined || form3903.movingTotalsGap !== undefined,
      triggeredByFactKeys: storageFees === undefined ? [] : [ARMED_FORCES_STORAGE_FEES_KEY],
    },
  };
}

/*
 * Schedule 1 line 3: line 31 of every Schedule C on this return, both spouses'
 * on a joint return. One blank line 31, or a business fact that cannot be read,
 * leaves the total blank. On any other status a spouse's business belongs on the
 * spouse's return, but under community property part of it may belong here
 * (Form 8958, not modeled), so a spouse's business also leaves line 3 blank.
 */
function scheduleCTotal({
  businesses,
  spouseKeys,
  malformedKeys,
}: ReturnType<typeof businessesOnReturn>): number | undefined {
  if (businesses.length === 0 || spouseKeys.length > 0 || malformedKeys.length > 0) {
    return undefined;
  }
  const onReturn = businesses.map((business) => business.value);
  const profits = onReturn.map((business) => netProfit(business, onReturn));
  return profits.every((profit) => profit !== undefined) ? sum(...profits) : undefined;
}

/*
 * Line 7: box 1 of each Form 1099-G, cents kept (irs-1040-inst-2025::sec::line-7::b01).
 * A repayment reduces the line; it has no fact, and Cade says it is not supported.
 */
function unemploymentOn1099G(inputs: ResolverInputs): number | undefined {
  return sumOrBlank(...getGovernmentPaymentsFacts(inputs.facts).map((form) => form.box1));
}
