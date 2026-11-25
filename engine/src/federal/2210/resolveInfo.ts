import {
  ANNUALIZED_PERIODS,
  ESTIMATED_TAX_KEYS,
  getDatedWithholdingFacts,
  getEstimatedTaxPaymentFacts,
  isWaiverRequest,
  makeAnnualizedPeriodFactKey,
  PRIOR_YEAR_KEYS,
  type AnnualizedPeriodFactValue,
  type DatedAmountFact,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  type MustFileFallback,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { countedDay, dayNumber, OVERPAYMENT_APPLIED_DAY } from "./dates.js";
import type { Form2210Answers, Form2210FilingInfo } from "./filingInfo.js";
import type { DatedPayment } from "./penaltyWorksheet.js";

const BAD_DATE =
  "A payment or withholding date is not a calendar date (YYYY-MM-DD), so the payments cannot be placed in the Part III columns.";

/* Each dated fact on the day it counts, whole dollars; undefined when a date cannot be read. */
function datedPayments(facts: readonly DatedAmountFact[]): DatedPayment[] | undefined {
  const out: DatedPayment[] = [];
  for (const fact of facts) {
    const day = dayNumber(fact.value.date);
    if (day === undefined) return undefined;
    out.push({ day: countedDay(day), amount: roundDollars(fact.value.amount) });
  }
  return out;
}

function annualizedPeriods(inputs: ResolverInputs) {
  const keys = ANNUALIZED_PERIODS.map(makeAnnualizedPeriodFactKey);
  const values = keys.map((key) => inputs.factByKey.get(key) as AnnualizedPeriodFactValue);
  const stated = keys.filter((_, index) => values[index] !== undefined);
  return { keys, values, stated, complete: stated.length === keys.length };
}

/*
 * Who files (the flowchart on page 1; irs-2210-inst-2025::sec::who-must-file-form-2210::b01):
 * only with a box in Part II checked. A fact that can check a box turns the form
 * on: a waiver request (A, B), Schedule AI periods (C), withholding by date (D),
 * a joint return in 2024 or 2025 but not both (E). The form names its boxes in
 * filesOnlyWithAmountOn, so it leaves the return when no box ends up checked.
 */
function mustFileFallbacks(inputs: ResolverInputs): MustFileFallback[] {
  const waiver = inputs.factByKey.get(ESTIMATED_TAX_KEYS.waiverRequest);
  const periods = annualizedPeriods(inputs);
  const withholding = getDatedWithholdingFacts(inputs.facts);
  const joint2024 = inputs.factByKey.get(PRIOR_YEAR_KEYS.filedJointReturn);
  const joint2025 = filingStatusOf(inputs) === "married_filing_jointly";
  return [
    {
      rule: "fallback: a request to waive the penalty (box A or B)",
      value: isWaiverRequest(waiver),
      triggeredByFactKeys: [ESTIMATED_TAX_KEYS.waiverRequest],
    },
    {
      rule: "fallback: Schedule AI periods are stated (box C)",
      value: periods.stated.length > 0,
      triggeredByFactKeys: periods.stated,
    },
    {
      rule: "fallback: withholding by date is stated (box D)",
      value: withholding.length > 0,
      triggeredByFactKeys: withholding.map((fact) => fact.key),
    },
    {
      rule: "fallback: a joint return for 2024 or 2025 but not both (box E)",
      value: typeof joint2024 === "boolean" && joint2024 !== joint2025,
      triggeredByFactKeys: [PRIOR_YEAR_KEYS.filedJointReturn],
    },
  ];
}

function answers(inputs: ResolverInputs, payments: DatedPayment[]): Form2210Answers | undefined {
  const withholdingFacts = getDatedWithholdingFacts(inputs.facts);
  const datedWithholding = datedPayments(withholdingFacts);
  if (withholdingFacts.length > 0 && datedWithholding === undefined) return undefined;
  const noTwelveMonthReturn = inputs.factByKey.get(PRIOR_YEAR_KEYS.noTwelveMonthReturn) === true;
  const request = inputs.factByKey.get(ESTIMATED_TAX_KEYS.waiverRequest);
  const joint = inputs.factByKey.get(PRIOR_YEAR_KEYS.filedJointReturn);
  const periods = annualizedPeriods(inputs);
  return {
    estimatedPayments: payments,
    priorYearTax: noTwelveMonthReturn ? undefined : num(inputs, PRIOR_YEAR_KEYS.federalTax),
    priorYearAgi: noTwelveMonthReturn ? undefined : num(inputs, PRIOR_YEAR_KEYS.federalAgi),
    noTwelveMonthReturn,
    jointReturn2024: typeof joint === "boolean" ? joint : undefined,
    waiver: isWaiverRequest(request)
      ? { request, amount: num(inputs, ESTIMATED_TAX_KEYS.waiverAmount) }
      : undefined,
    datedWithholding: withholdingFacts.length > 0 ? datedWithholding : undefined,
    annualizedPeriods: periods.complete ? periods.values : undefined,
    annualizedPeriodsIncomplete: periods.stated.length > 0 && !periods.complete,
  };
}

/* The answers the form waits on once it files. */
function required(inputs: ResolverInputs, form: Form2210Answers | undefined): string[] {
  if (!form) return [];
  const periods = annualizedPeriods(inputs);
  const asked: Record<string, unknown> = {
    [PRIOR_YEAR_KEYS.filedJointReturn]: form.jointReturn2024,
  };
  if (!form.noTwelveMonthReturn) {
    asked[PRIOR_YEAR_KEYS.federalTax] = form.priorYearTax;
    asked[PRIOR_YEAR_KEYS.federalAgi] = form.priorYearAgi;
  }
  if (form.waiver?.request === "part") asked[ESTIMATED_TAX_KEYS.waiverAmount] = form.waiver.amount;
  if (periods.stated.length > 0) {
    periods.keys.forEach((key, index) => (asked[key] = periods.values[index]));
  }
  return missingInputs(asked);
}

export function resolve2210Info(inputs: ResolverInputs): Form2210FilingInfo {
  const paymentFacts = getEstimatedTaxPaymentFacts(inputs.facts);
  const overpayment = num(inputs, ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied);
  const paid = sum(overpayment, ...paymentFacts.map((fact) => fact.value.amount));
  const estimatedTaxPaid =
    paymentFacts.length > 0 || overpayment !== undefined ? roundDollars(paid) : undefined;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_2210",
    fallbacks: mustFileFallbacks(inputs),
  });
  const dated = datedPayments(paymentFacts);
  const payments = dated && [
    ...(overpayment === undefined
      ? []
      : [{ day: OVERPAYMENT_APPLIED_DAY, amount: roundDollars(overpayment) }]),
    ...dated,
  ];
  const form = mustFile.value === true && payments ? answers(inputs, payments) : undefined;
  return {
    mustFile: { "form-2210": mustFile },
    missingInputs: { "form-2210": required(inputs, form) },
    estimatedTaxPaid,
    form2210: form,
    form2210Gap: mustFile.value === true && form === undefined ? BAD_DATE : undefined,
  };
}
