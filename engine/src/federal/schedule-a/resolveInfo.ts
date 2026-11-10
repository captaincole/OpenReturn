import { MORTGAGE_KEYS } from "../../facts/index.js";
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

/* Schedule A files when the return itemizes (decisions.itemize_vs_standard), or when set explicitly. */
export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const resolution = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_a",
    fallbacks: [
      {
        rule: "fallback: decisions.itemize_vs_standard = itemized",
        value: decisionByKey.get("decisions.itemize_vs_standard") === "itemized",
        triggeredByDecisionKeys: ["decisions.itemize_vs_standard"],
      },
    ],
  });
  const w2Box17 = sumW2Box(inputs, "box17");
  const caSdi = sumCaSdi(factsInCategory(inputs, "wages"));
  const estStateTax = num(inputs, "state_local_tax.estimated_payments");
  const medicalDentalExpenses = num(inputs, "medical.expenses_total");
  const giftsCashCheck = num(inputs, "charitable.cash");
  const giftsOtherThanCash = num(inputs, "charitable.noncash");
  const realEstateTaxes = num(inputs, "state_local_tax.real_estate");
  const interestForm1098 = num(inputs, MORTGAGE_KEYS.interestForm1098);
  const principalForm1098 = num(inputs, MORTGAGE_KEYS.outstandingPrincipalForm1098);
  const mortgage = mortgageInterestWithinLimit(inputs, interestForm1098, principalForm1098);
  return {
    mustFile: { "schedule-a": resolution },
    /* An itemizer answers these once; 0 is an answer. Blank lines would hide a deduction. */
    missingInputs: {
      "schedule-a": missingInputs({
        "medical.expenses_total": medicalDentalExpenses,
        "state_local_tax.real_estate": realEstateTaxes,
        [MORTGAGE_KEYS.interestForm1098]: interestForm1098,
        /* The 1098's box 2: needed with its interest, for the acquisition-debt limit. */
        ...((interestForm1098 ?? 0) > 0
          ? { [MORTGAGE_KEYS.outstandingPrincipalForm1098]: principalForm1098 }
          : {}),
        /* Box 3 decides the limit for a loan between $750,000 and $1,000,000. */
        ...(mortgage.originationDateNeeded
          ? { [MORTGAGE_KEYS.originationDateForm1098]: undefined }
          : {}),
        "charitable.cash": giftsCashCheck,
        "charitable.noncash": giftsOtherThanCash,
      }),
    },
    medicalDentalExpenses,
    stateLocalIncomeTaxPaid: w2Box17 + caSdi + (estStateTax ?? 0),
    generalSalesTaxElection: decisionByKey.get("decisions.itemized.elect_general_sales_tax") as
      boolean | undefined,
    realEstateTaxes,
    personalPropertyTaxes: num(inputs, "state_local_tax.personal_property"),
    mortgageInterestForm1098: mortgage.interest,
    mortgageInterestWaits: interestForm1098 !== undefined && mortgage.interest === undefined,
    mortgageInterestNotForm1098: num(inputs, MORTGAGE_KEYS.interestNotForm1098),
    pointsNotForm1098: num(inputs, MORTGAGE_KEYS.pointsNotForm1098),
    giftsCashCheck,
    giftsOtherThanCash,
    giftsCarryover: num(inputs, "charitable.carryover"),
  };
}
