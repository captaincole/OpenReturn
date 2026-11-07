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

/* MM/DD/YYYY, as the Form 1098 prints box 3; undefined when unreadable. */
function originatedOnOrBefore(date: string | undefined, cutoff: typeof LIMIT_DATE): boolean {
  if (date === undefined) return false;
  const parts = date.trim().split("/").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return false;
  const [month, day, year] = parts as [number, number, number];
  if (year !== cutoff.year) return year < cutoff.year;
  if (month !== cutoff.month) return month < cutoff.month;
  return day <= cutoff.day;
}

/*
 * irs-1040sa-inst-2025::sec::line-8a::b01: line 8a takes the Form 1098 interest
 * and points unless a limit applies; then Pub. 936 figures the deductible part,
 * which the engine does not model. The outstanding principal (box 2) says
 * whether the limit applies; above it the line waits.
 */
function mortgageInterestForm1098(
  inputs: ResolverInputs,
  interestAndPoints: number | undefined,
  principal: number | undefined,
): number | undefined {
  if (interestAndPoints === undefined || principal === undefined) return undefined;
  const separate =
    inputs.decisionByKey.get("decisions.scope.filing_status") === "married_filing_separately";
  const originated = text(inputs, MORTGAGE_KEYS.originationDateForm1098);
  const limit = originatedOnOrBefore(originated, LIMIT_DATE)
    ? PRE_2018_DEBT_LIMIT
    : POST_2017_DEBT_LIMIT;
  return principal <= (separate ? limit / 2 : limit) ? interestAndPoints : undefined;
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
    mortgageInterestForm1098: mortgageInterestForm1098(inputs, interestForm1098, principalForm1098),
    mortgageInterestNotForm1098: num(inputs, MORTGAGE_KEYS.interestNotForm1098),
    pointsNotForm1098: num(inputs, MORTGAGE_KEYS.pointsNotForm1098),
    giftsCashCheck,
    giftsOtherThanCash,
    giftsCarryover: num(inputs, "charitable.carryover"),
  };
}
