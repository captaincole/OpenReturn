import {
  GAMBLING_KEYS,
  OTHER_INCOME_KEYS,
  businessesOnReturn,
  getGamblingWinningsFacts,
  isMiscIncomeFactKey,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { resolve8889Info } from "../8889/resolveInfo.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import { earlyWithdrawalPenalty, educatorExpenseDeduction } from "./adjustments.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import { resolveStudentLoanInterest } from "./studentLoanInterest.js";

export function resolveSchedule1Info(inputs: ResolverInputs): Schedule1FilingInfo {
  const misc = factsInCategory(inputs, "other").filter((row) => isMiscIncomeFactKey(row.key));
  const miscOtherIncome =
    misc.length > 0
      ? sum(...misc.map((row) => (row.value as Record<string, unknown>).box3))
      : undefined;
  // Form 8889 lines 13 and 16 reach the 1040 only through Schedule 1.
  const form8889 = resolve8889Info(inputs).mustFile?.["form-8889"]?.value === true;
  const jointReturn = filingStatusOf(inputs) === "married_filing_jointly";
  const onReturn = businessesOnReturn(inputs.facts, jointReturn);
  const hasBusiness =
    onReturn.businesses.length + onReturn.spouseKeys.length + onReturn.malformedKeys.length > 0;
  const businessIncome = scheduleCTotal(onReturn);
  const w2gs = getGamblingWinningsFacts(inputs.facts);
  const winningsNotOnW2G = num(inputs, GAMBLING_KEYS.winningsNotOnW2G);
  const gamblingWinnings =
    w2gs.length > 0 || winningsNotOnW2G !== undefined
      ? sum(...w2gs.map((w2g) => w2g.box1), winningsNotOnW2G)
      : undefined;
  const alaskaPermanentFundDividends = num(inputs, OTHER_INCOME_KEYS.alaskaPermanentFundDividends);
  // Schedule SE line 13 reaches the 1040 only through Schedule 1 line 15.
  const scheduleSE = resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value === true;
  // Schedule E line 41 reaches the 1040 only through Schedule 1 line 5.
  const scheduleE = resolveScheduleEInfo(inputs).mustFile?.["schedule-e"]?.value === true;
  const educatorExpenses = educatorExpenseDeduction(inputs, jointReturn);
  const savingsPenalty = earlyWithdrawalPenalty(inputs);
  const studentLoan = resolveStudentLoanInterest(inputs);
  const studentLoanInterest = studentLoan.info.studentLoanInterestPaid;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_1",
    fallbacks: [
      {
        rule: `fallback: 1099-MISC other income $${miscOtherIncome ?? 0} > 0, W-2G winnings $${gamblingWinnings ?? 0} > 0, Alaska Permanent Fund dividends $${alaskaPermanentFundDividends ?? 0} > 0, a Schedule C business (${hasBusiness}), Schedule SE filed (${scheduleSE}), Schedule E filed (${scheduleE}), Form 8889 filed (${form8889}), educator expenses $${educatorExpenses ?? 0} > 0, an early withdrawal penalty $${savingsPenalty ?? 0} > 0, or student loan interest $${studentLoanInterest ?? 0} > 0`,
        value:
          (miscOtherIncome ?? 0) > 0 ||
          (gamblingWinnings ?? 0) > 0 ||
          (alaskaPermanentFundDividends ?? 0) > 0 ||
          hasBusiness ||
          scheduleSE ||
          scheduleE ||
          form8889 ||
          (educatorExpenses ?? 0) > 0 ||
          (savingsPenalty ?? 0) > 0 ||
          (studentLoanInterest ?? 0) > 0,
      },
    ],
  });
  return {
    mustFile: { "schedule-1": resolution },
    missingInputs: { "schedule-1": studentLoan.missing },
    businessIncome,
    hasBusiness,
    gamblingWinnings,
    miscOtherIncome,
    alaskaPermanentFundDividends,
    educatorExpenses,
    earlyWithdrawalPenalty: savingsPenalty,
    ...studentLoan.info,
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
