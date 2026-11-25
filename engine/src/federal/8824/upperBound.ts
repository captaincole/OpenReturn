/*
 * What Form 8824 adds to AGI, at most, from its facts alone: for Form 8960's Who
 * Must File (8960/mustFile.ts). An exchange's amounts come from its own fact, so
 * the bound is the gains it sends this year (the deferred gain on line 24 stays
 * out unless a related party disposition reports it). When the amounts are not
 * settled (a gap, or lines 9 and 10 not answered), lines 23 and 24 add up to
 * line 19, so the realized gain bounds what an exchange reports in any year,
 * with line 14 for other property. Part IV reports at most line 32.
 */

import {
  readConflictOfInterestSaleFacts,
  readLikeKindExchangeFacts,
  type LikeKindExchangeFact,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { activityOf } from "../4797/activities.js";
import { evaluateExchange, realizedOf } from "./exchange.js";
import { TAX_YEAR, partIVLines, yearOf } from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

function exchangeGainUpperBound(fact: LikeKindExchangeFact): number {
  const outcome = evaluateExchange(fact);
  if (outcome.kind === "not_this_year") return 0;
  const { route } = outcome.kind === "filed" ? outcome.form : { route: undefined };
  if (route !== undefined && route.gap === undefined && !route.waits) {
    const { shortTermCapital, longTermCapital, section1231, ordinary } = route.amounts;
    return sum(
      atLeast(0, shortTermCapital),
      atLeast(0, longTermCapital),
      atLeast(0, section1231),
      atLeast(0, ordinary),
    );
  }
  const lines = realizedOf(fact.value);
  return atLeast(0, lines.line19) + atLeast(0, lines.line14 ?? 0);
}

export function form8824GainUpperBound(facts: ReadonlyArray<FactRow>): number {
  const exchanges = readLikeKindExchangeFacts(facts).facts.map(exchangeGainUpperBound);
  const sales = readConflictOfInterestSaleFacts(facts)
    .facts.filter(({ value }) => yearOf(value.dateSold) === TAX_YEAR)
    .map(({ value }) =>
      atLeast(
        0,
        partIVLines({
          amountReceived: value.amountReceived,
          sellingExpenses: value.sellingExpenses ?? 0,
          basis: value.basis,
          replacementCost: value.replacementCost,
          recapture: 0,
        }).line32,
      ),
    );
  return sum(...exchanges, ...sales);
}

/*
 * Investment income for Form 8960's gate: a Part IV sale, or an exchange whose
 * property no business with line G "Yes" used (line 5b keeps the gain in, as for
 * a Form 4797 sale).
 */
export function form8824HasInvestmentIncome(
  facts: ReadonlyArray<FactRow>,
  nonpassiveBusinessKeys: ReadonlyArray<string>,
): boolean {
  const exchange = readLikeKindExchangeFacts(facts).facts.some(
    ({ value }) => !nonpassiveBusinessKeys.includes(activityOf(value.givenUp) ?? ""),
  );
  return exchange || readConflictOfInterestSaleFacts(facts).facts.length > 0;
}
