/*
 * Form 6765's credit as a Form 3800 source: line 30 goes to "Form 3800, Part
 * III, line 4i" for an eligible small business, else line 1c
 * (irs-6765-face-2025::sec::face-page-2::b01; irs-6765-inst-2025::sec::line-29::b01).
 *
 * Line 30 is line 28 (the taxpayer's own research) plus line 29 (the K-1s).
 * The K-1 credits already are Form 3800 sources of their own (3800/sources.ts),
 * each with its own eligible small business answer and attributable income,
 * because the research credit limitation is figured "separately for each sole
 * proprietorship or pass-through entity" (irs-3800-inst-2025::sec::lines-1c-and-4i::b01).
 * So this adds line 28 only, with the taxable income attributable to the
 * business, and Form 3800 Part III totals line 30.
 */

import { RESEARCH_CREDIT_KEY, getGeneralBusinessCreditFacts } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap } from "../3800/cells.js";
import type { CurrentCredit } from "../3800/credits.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { RESEARCH_LINES } from "../3800/rows.js";
import { asCell } from "./cells.js";
import { isEligibleSmallBusiness } from "./lines.js";
import { resolve6765Info } from "./resolveInfo.js";

/* Eligible small businesses report on line 4i; "All others, report the credit on line 1c" (line-29::b01). */
const SMALL_BUSINESS_LINE = "4i";
const OTHER_LINE = "1c";

const STATED_TWICE_GAP =
  "A research credit is stated as a Form 3800 line 1c or 4i amount with no pass-through entity, and Form 6765 figures one from the research credit fact: the engine cannot tell whether they are the same credit.";

/*
 * Line 28 as a Form 3800 source, and the answer it waits on (the business's
 * material participation, Schedule C line G). None while Form 6765 does not
 * file or has no credit of its own.
 */
export function researchCreditSources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const research = resolve6765Info(inputs).researchCredit;
  const line28 = research?.figures.line28;
  if (research === undefined || line28 === undefined || line28 === 0) {
    return { sources: [], missing: [] };
  }
  const { fact, business } = research;
  const line = isEligibleSmallBusiness(fact.grossReceiptsPriorYears)
    ? SMALL_BUSINESS_LINE
    : OTHER_LINE;
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => RESEARCH_LINES.includes(value.line) && value.passThroughEin === undefined,
  );
  const passive = business?.materiallyParticipated === false;
  const credit: CurrentCredit = {
    line,
    key: RESEARCH_CREDIT_KEY,
    amount: statedTwice ? gap(STATED_TWICE_GAP) : asCell(line28),
    passive,
    activity: passive ? { name: business?.name ?? "", rentalRealEstate: false } : undefined,
  };
  const waiting = business !== undefined && business.materiallyParticipated === undefined;
  return {
    sources: [{ credit, attributableTaxableIncome: fact.attributableTaxableIncome }],
    missing: waiting ? [fact.businessKey] : [],
  };
}
