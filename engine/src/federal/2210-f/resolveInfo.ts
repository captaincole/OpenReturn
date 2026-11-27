import {
  ESTIMATED_TAX_KEYS,
  FARMER_ESTIMATED_TAX_KEYS,
  getEstimatedTaxPaymentFacts,
  isWaiverRequest,
  PRIOR_YEAR_KEYS,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { dayNumber } from "../2210/dates.js";
import type { DatedPayment } from "../2210/penaltyWorksheet.js";
import { farmerTest, MUST_FILE_2210F_KEY } from "./farmerTest.js";
import type { Form2210FAnswers, Form2210FFilingInfo } from "./filingInfo.js";
import { DUE_DATE } from "./lines.js";

const BAD_DATE =
  "An estimated tax payment date or the date the underpayment was paid is not a calendar date (YYYY-MM-DD), so lines 12 and 14 cannot be filled.";

/*
 * Who files: a farmer or fisher who checks box A (a waiver request) or box B
 * (a joint return for 2024 or 2025 but not both). "File Form 2210-F only if one
 * or both of the boxes in Part I apply to you" (irs-2210f-face-2025::sec::face-header::b01;
 * irs-2210f-inst-2025::sec::who-must-file-form-2210-f::b01). Box B also needs
 * line 10 below line 7, and the stops of lines 3, 6 and 9 clear both boxes: the
 * form names its boxes in filesOnlyWithAmountOn, so it leaves the return when
 * neither ends up checked. The explicit decision wins.
 */
function resolveMustFile2210F(inputs: ResolverInputs) {
  const { passingKeys } = farmerTest(inputs);
  const farmer = passingKeys.length > 0;
  const waiver = inputs.factByKey.get(ESTIMATED_TAX_KEYS.waiverRequest);
  const joint2024 = inputs.factByKey.get(PRIOR_YEAR_KEYS.filedJointReturn);
  const joint2025 = filingStatusOf(inputs) === "married_filing_jointly";
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_2210F_KEY,
    fallbacks: [
      {
        rule: "fallback: a farmer or fisher (two-thirds of 2024 or 2025 gross income) requests a waiver (box A)",
        value: farmer && isWaiverRequest(waiver),
        triggeredByFactKeys: [...passingKeys, ESTIMATED_TAX_KEYS.waiverRequest],
      },
      {
        rule: "fallback: a farmer or fisher filed a joint return for 2024 or 2025 but not both (box B)",
        value: farmer && typeof joint2024 === "boolean" && joint2024 !== joint2025,
        triggeredByFactKeys: [...passingKeys, PRIOR_YEAR_KEYS.filedJointReturn],
      },
      /*
       * On a 2025 joint return, box B turns on the 2024 return, so the form
       * files and waits for that answer; a joint 2024 return then takes it off.
       */
      {
        rule: "fallback: a farmer or fisher on a 2025 joint return; box B waits for the 2024 filing status",
        value: farmer && joint2025 && typeof joint2024 !== "boolean",
        triggeredByFactKeys: passingKeys,
      },
    ],
  });
}

/* The estimated tax payments by January 15, 2026 and after it; undefined when a date cannot be read. */
function payments(inputs: ResolverInputs) {
  const byDueDate: number[] = [];
  const late: DatedPayment[] = [];
  for (const fact of getEstimatedTaxPaymentFacts(inputs.facts)) {
    const day = dayNumber(fact.value.date);
    if (day === undefined) return undefined;
    if (day <= DUE_DATE) byDueDate.push(fact.value.amount);
    else late.push({ day, amount: roundDollars(fact.value.amount) });
  }
  /* The 2024 overpayment applied to 2025 was paid before the due date. */
  const overpayment = num(inputs, ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied);
  return { byDueDate: roundDollars(sum(overpayment, ...byDueDate)), late };
}

function answersOf(inputs: ResolverInputs): Form2210FAnswers | undefined {
  const paid = payments(inputs);
  const paidOnText = inputs.factByKey.get(FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn);
  const paidOn = typeof paidOnText === "string" ? dayNumber(paidOnText) : undefined;
  if (paid === undefined || (paidOnText !== undefined && paidOn === undefined)) return undefined;
  const noTwelveMonthReturn = inputs.factByKey.get(PRIOR_YEAR_KEYS.noTwelveMonthReturn) === true;
  const priorYearTax = num(inputs, PRIOR_YEAR_KEYS.federalTax);
  const joint = inputs.factByKey.get(PRIOR_YEAR_KEYS.filedJointReturn);
  const filed = inputs.factByKey.get(FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2);
  const request = inputs.factByKey.get(ESTIMATED_TAX_KEYS.waiverRequest);
  return {
    noTwelveMonthReturn,
    priorYearTax: noTwelveMonthReturn || priorYearTax === undefined ? undefined : priorYearTax,
    jointReturn2024: typeof joint === "boolean" ? joint : undefined,
    waiver: isWaiverRequest(request)
      ? { request, amount: num(inputs, ESTIMATED_TAX_KEYS.waiverAmount) }
      : undefined,
    paymentsByDueDate: paid.byDueDate,
    latePayments: paid.late,
    filedAndPaidByMarch2: typeof filed === "boolean" ? filed : undefined,
    underpaymentPaidOn: paidOn,
    section1062NetTaxLiability: num(inputs, FARMER_ESTIMATED_TAX_KEYS.section1062NetTaxLiability),
  };
}

/* The answers the form waits on once it files. */
function required(answers: Form2210FAnswers | undefined): string[] {
  if (!answers) return [];
  const asked: Record<string, unknown> = {
    [PRIOR_YEAR_KEYS.filedJointReturn]: answers.jointReturn2024,
    [FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2]: answers.filedAndPaidByMarch2,
  };
  if (!answers.noTwelveMonthReturn) asked[PRIOR_YEAR_KEYS.federalTax] = answers.priorYearTax;
  if (answers.waiver?.request === "part") {
    asked[ESTIMATED_TAX_KEYS.waiverAmount] = answers.waiver.amount;
  }
  return missingInputs(asked);
}

/*
 * Form 2210-F (irs-2210f-inst-2025): who files and the answers of lines 10 to
 * 16. Form 1040's lines come in through the bindings (outcome.ts).
 */
export function resolve2210FInfo(inputs: ResolverInputs): Form2210FFilingInfo {
  const mustFile = resolveMustFile2210F(inputs);
  const answers = mustFile.value === true ? answersOf(inputs) : undefined;
  return {
    mustFile: { "form-2210-f": mustFile },
    missingInputs: { "form-2210-f": required(answers) },
    form2210F: answers,
    form2210FGap: mustFile.value === true && answers === undefined ? BAD_DATE : undefined,
  };
}
