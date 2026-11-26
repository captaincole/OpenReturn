/*
 * Lines 2a, 2b, 3a and 3b from the 1099-INT and 1099-DIV facts (when Schedule B
 * does not give lines 2b and 3b). A foreign-currency fact that waits for its
 * exchange rate (incomeInDollars.ts) leaves its kind's slots undefined, so the
 * lines wait with it.
 */

import { isDividendFactKey, isInterestFactKey } from "../../facts/index.js";
import { exchangeRateGap, waitsForExchangeRate } from "../../incomeInDollars.js";
import { sum } from "../../money.js";
import { factsInCategory, sumInvestmentBox, type ResolverInputs } from "../../resolverInputs.js";
import { bondCreditInterest } from "../8912/interest.js";
import type { Form1040FilingInfo } from "./filingInfo.js";

type Slot<K extends keyof Form1040FilingInfo> = Form1040FilingInfo[K];

function factsOfKind(inputs: ResolverInputs, isKind: (key: string) => boolean) {
  return factsInCategory(inputs, "investment_income").filter((fact) => isKind(fact.key));
}

/* A fact not converted: it waits for a date, or it is a gap that Schedule B shows on its row. */
const kindWaits = (inputs: ResolverInputs, isKind: (key: string) => boolean) =>
  factsOfKind(inputs, isKind).some(
    (fact) => waitsForExchangeRate(fact.value) || exchangeRateGap(fact.value) !== undefined,
  );

/*
 * The filter pins each box to 1099-INT: other 1099 sections may reuse low
 * box names. No interest facts: undefined, so the cells stay blank, not "0".
 */
function documentInterestSlots(inputs: ResolverInputs): Form1040FilingInfo {
  if (factsOfKind(inputs, isInterestFactKey).length === 0 || kindWaits(inputs, isInterestFactKey)) {
    return { taxableInterestTotal: undefined, taxExemptInterestTotal: undefined };
  }
  const box = (name: string) => sumInvestmentBox(inputs, name, isInterestFactKey);
  return {
    // Box 3 (US savings bond and Treasury interest) is taxable federally, as on Schedule B line 1.
    taxableInterestTotal: (box("box1") + box("box3")) as Slot<"taxableInterestTotal">,
    taxExemptInterestTotal: box("box8") as Slot<"taxExemptInterestTotal">,
  };
}

/*
 * MANUAL EDIT: a held tax credit bond's credit that no Form 1099-INT reports
 * is taxable interest too (federal/8912/interest.ts), also when Schedule B does
 * not file. It waits while a bond does; no bond, the 1099-INT totals as before.
 */
export function interestSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const slots = documentInterestSlots(inputs);
  const bondInterest = bondCreditInterest(inputs).map((row) => row.amount);
  if (bondInterest.length === 0 || kindWaits(inputs, isInterestFactKey)) return slots;
  const waits = bondInterest.some((amount) => amount === undefined);
  return {
    ...slots,
    taxableInterestTotal: waits
      ? undefined
      : (sum(slots.taxableInterestTotal, ...bondInterest) as Slot<"taxableInterestTotal">),
  };
}

/* Boxes 1b and 1a of every investment fact, as before; undefined while a 1099-DIV fact waits. */
export function dividendSlots(inputs: ResolverInputs): Form1040FilingInfo {
  if (kindWaits(inputs, isDividendFactKey)) {
    return { qualifiedDividends: undefined, ordinaryDividends: undefined };
  }
  return {
    qualifiedDividends: sumInvestmentBox(inputs, "box1b") as Slot<"qualifiedDividends">,
    ordinaryDividends: sumInvestmentBox(inputs, "box1a") as Slot<"ordinaryDividends">,
  };
}
