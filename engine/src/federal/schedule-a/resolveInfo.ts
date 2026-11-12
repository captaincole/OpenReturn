import { GAMBLING_KEYS, MORTGAGE_KEYS } from "../../facts/index.js";
import {
  factsInCategory,
  missingInputs,
  num,
  resolveMustFile,
  sumCaSdi,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { additionalSheetsGap, netQualifiedDisasterLoss } from "../4684/lines.js";
import { resolve4684Info } from "../4684/resolveInfo.js";
import type { ScheduleAFilingInfo } from "./filingInfo.js";

/*
 * irs-1040sa-inst-2025::sec::line-8::b03: interest is deductible on up to
 * $750,000 of qualifying debt taken out after December 15, 2017 ($375,000
 * married filing separately), $1,000,000 ($500,000) for earlier loans.
 */
const POST_2017_DEBT_LIMIT = 750000;
const PRE_2018_DEBT_LIMIT = 1000000;
const LIMIT_DATE = { year: 2017, month: 12, day: 15 };

/* MM/DD/YYYY as the Form 1098 prints box 3, or YYYY-MM-DD; false when missing or unreadable. */
function originatedOnOrBefore(date: string | undefined, cutoff: typeof LIMIT_DATE): boolean {
  if (date === undefined) return false;
  const iso = date.includes("-");
  const parts = date
    .trim()
    .split(iso ? "-" : "/")
    .map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return false;
  const [month, day, year] = (iso ? [parts[1], parts[2], parts[0]] : parts) as [
    number,
    number,
    number,
  ];
  if (year !== cutoff.year) return year < cutoff.year;
  if (month !== cutoff.month) return month < cutoff.month;
  return day <= cutoff.day;
}

/*
 * irs-1040sa-inst-2025::sec::line-8a::b01: line 8a takes the Form 1098 interest
 * and points unless a limit applies; then Pub. 936 figures the deductible part,
 * which the engine does not model. The outstanding principal (box 2) says
 * whether the limit applies: within it the interest; over it the line waits
 * (`limited`); between the two limits the origination date decides, so it is
 * asked when missing.
 */
interface MortgageLimit {
  interest: number | undefined;
  limited: boolean;
  /* Box 3 is needed: the principal is over the post-2017 limit and within the earlier one. */
  originationDateNeeded: boolean;
}

export function mortgageInterestWithinLimit(
  inputs: ResolverInputs,
  interestAndPoints: number | undefined,
  principal: number | undefined,
): MortgageLimit {
  const none = { interest: undefined, limited: false, originationDateNeeded: false };
  if (interestAndPoints === undefined) return none;
  /* No interest (a renter's 0) has no debt to limit: the line is 0 with no principal. */
  if (interestAndPoints <= 0)
    return { interest: interestAndPoints, limited: false, originationDateNeeded: false };
  if (principal === undefined) return none;
  const separate =
    inputs.decisionByKey.get("decisions.scope.filing_status") === "married_filing_separately";
  const share = separate ? 2 : 1;
  const originated = text(inputs, MORTGAGE_KEYS.originationDateForm1098);
  const earlierLoan = originatedOnOrBefore(originated, LIMIT_DATE);
  const limit = (earlierLoan ? PRE_2018_DEBT_LIMIT : POST_2017_DEBT_LIMIT) / share;
  const inBand =
    principal > POST_2017_DEBT_LIMIT / share && principal <= PRE_2018_DEBT_LIMIT / share;
  if (principal <= limit)
    return { interest: interestAndPoints, limited: false, originationDateNeeded: false };
  return {
    interest: undefined,
    limited: !(inBand && originated === undefined),
    originationDateNeeded: inBand && originated === undefined,
  };
}

/*
 * Form 4684 line 15 when it is a net qualified disaster loss
 * (irs-1040sa-inst-2025::sec::net-qualified-disaster-loss-reporting::b01), and
 * whether one is possible while the totals wait: an event marked qualified.
 */
function disasterLoss(inputs: ResolverInputs) {
  const form4684 = resolve4684Info(inputs);
  const filed = form4684.mustFile?.["form-4684"]?.value === true;
  const facts = filed ? (form4684.casualtyEvents ?? []) : [];
  const events = facts.map((fact) => fact.event);
  const amount = netQualifiedDisasterLoss(events);
  const possible =
    amount === undefined ? events.some((event) => event.qualifiedDisasterLoss) : amount > 0;
  const gap = additionalSheetsGap(events);
  return { amount, possible, gap, factKeys: facts.map((fact) => fact.factKey) };
}

/* The standard deduction with a net qualified disaster loss; undefined while the loss waits. */
function increasedStandardMode(
  files: boolean | undefined,
  itemizeDecision: unknown,
  loss: ReturnType<typeof disasterLoss>,
): boolean | undefined {
  if (files !== true || itemizeDecision !== "standard" || !loss.possible) return false;
  return loss.amount === undefined ? undefined : true;
}

/*
 * Schedule A files when the return itemizes (decisions.itemize_vs_standard), or
 * when set explicitly, or with a net qualified disaster loss: a filer who does
 * not itemize claims the increased standard deduction on it
 * (irs-1040sa-inst-2025::sec::other-itemized-deductions::b01).
 */
function scheduleAMustFile(
  decisionByKey: ResolverInputs["decisionByKey"],
  loss: ReturnType<typeof disasterLoss>,
) {
  return resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_a",
    fallbacks: [
      {
        rule: "fallback: decisions.itemize_vs_standard = itemized",
        value: decisionByKey.get("decisions.itemize_vs_standard") === "itemized",
        triggeredByDecisionKeys: ["decisions.itemize_vs_standard"],
      },
      {
        rule: `fallback: net qualified disaster loss $${loss.amount ?? "?"} (Form 4684 line 15)`,
        value: loss.possible,
        triggeredByFactKeys: loss.factKeys,
      },
    ],
  });
}

/* An itemizer answers these once; 0 is an answer. Blank lines would hide a deduction. */
function itemizerAnswers(inputs: ResolverInputs, mortgage: MortgageLimit): string[] {
  const interestForm1098 = num(inputs, MORTGAGE_KEYS.interestForm1098);
  return missingInputs({
    "medical.expenses_total": num(inputs, "medical.expenses_total"),
    "state_local_tax.real_estate": num(inputs, "state_local_tax.real_estate"),
    "state_local_tax.personal_property": num(inputs, "state_local_tax.personal_property"),
    [MORTGAGE_KEYS.interestForm1098]: interestForm1098,
    /* The 1098's box 2: needed with its interest, for the acquisition-debt limit. */
    ...((interestForm1098 ?? 0) > 0
      ? {
          [MORTGAGE_KEYS.outstandingPrincipalForm1098]: num(
            inputs,
            MORTGAGE_KEYS.outstandingPrincipalForm1098,
          ),
        }
      : {}),
    /* Box 3 decides the limit for a loan between $750,000 and $1,000,000. */
    ...(mortgage.originationDateNeeded
      ? { [MORTGAGE_KEYS.originationDateForm1098]: undefined }
      : {}),
    "charitable.cash": num(inputs, "charitable.cash"),
    "charitable.noncash": num(inputs, "charitable.noncash"),
    "charitable.carryover": num(inputs, "charitable.carryover"),
  });
}

export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const loss = disasterLoss(inputs);
  const resolution = scheduleAMustFile(decisionByKey, loss);
  const increasedStandardDeduction = increasedStandardMode(
    resolution.value,
    decisionByKey.get("decisions.itemize_vs_standard"),
    loss,
  );
  const w2Box17 = sumW2Box(inputs, "box17");
  const caSdi = sumCaSdi(factsInCategory(inputs, "wages"));
  const estStateTax = num(inputs, "state_local_tax.estimated_payments");
  const interestForm1098 = num(inputs, MORTGAGE_KEYS.interestForm1098);
  const principalForm1098 = num(inputs, MORTGAGE_KEYS.outstandingPrincipalForm1098);
  const mortgage = mortgageInterestWithinLimit(inputs, interestForm1098, principalForm1098);
  return {
    mustFile: { "schedule-a": resolution },
    /* The increased standard deduction prints no itemized line, so it asks none of their answers. */
    missingInputs: {
      "schedule-a": increasedStandardDeduction === false ? itemizerAnswers(inputs, mortgage) : [],
    },
    medicalDentalExpenses: num(inputs, "medical.expenses_total"),
    stateLocalIncomeTaxPaid: w2Box17 + caSdi + (estStateTax ?? 0),
    generalSalesTaxElection: decisionByKey.get("decisions.itemized.elect_general_sales_tax") as
      boolean | undefined,
    realEstateTaxes: num(inputs, "state_local_tax.real_estate"),
    personalPropertyTaxes: num(inputs, "state_local_tax.personal_property"),
    mortgageInterestForm1098: mortgage.interest,
    mortgageInterestWaits: interestForm1098 !== undefined && mortgage.interest === undefined,
    mortgageInterestNotForm1098: num(inputs, MORTGAGE_KEYS.interestNotForm1098),
    pointsNotForm1098: num(inputs, MORTGAGE_KEYS.pointsNotForm1098),
    giftsCashCheck: num(inputs, "charitable.cash"),
    giftsOtherThanCash: num(inputs, "charitable.noncash"),
    giftsCarryover: num(inputs, "charitable.carryover"),
    netQualifiedDisasterLoss: loss.amount,
    disasterLossGap: loss.gap,
    increasedStandardDeduction,
    gamblingLosses: num(inputs, GAMBLING_KEYS.losses),
  };
}
