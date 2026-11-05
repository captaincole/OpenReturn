import { readBusinessFacts } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { netProfit, tentativeProfit } from "../schedule-c/lines.js";
import type { ScheduleSEFilingInfo } from "./filingInfo.js";

/* Line 4a: 92.35% of line 3. */
export const NET_EARNINGS_RATE = 0.9235;
const MIN_NET_EARNINGS = 400;

/*
 * irs-1040sse-inst-2025::sec::who-must-file-schedule-se::b01: line 4c of $400 or
 * more. Only Schedule C feeds line 3 now: farm income (line 1a), partnership
 * earnings, church employee income and the optional methods have no facts yet.
 * One Schedule SE per person; a spouse's business on a joint return is not
 * modeled, so only the taxpayer's businesses count.
 */
export function resolveScheduleSEInfo(inputs: ResolverInputs): ScheduleSEFilingInfo {
  const own = readBusinessFacts(inputs.facts).businesses.filter(
    (business) => (business.value.owner ?? "taxpayer") === "taxpayer",
  );
  const profits = own.map((business) => netProfit(business.value));
  const known = profits.every((profit) => profit !== undefined);
  const profit = own.length === 0 || !known ? undefined : sum(...profits);
  const line4a = profit !== undefined && profit > 0 ? roundDollars(profit * NET_EARNINGS_RATE) : 0;
  /*
   * A blank line 31 that is a tentative loss (line 29 < 0) can only add a limited
   * loss, so when the known profits alone stay under $400 the answer is still no.
   */
  const knownProfit = sum(...profits.filter((value) => value !== undefined));
  const onlyLossesUnknown = own.every(
    (business, index) => profits[index] !== undefined || (tentativeProfit(business.value) ?? 0) < 0,
  );
  const decided =
    known ||
    (onlyLossesUnknown && roundDollars(knownProfit * NET_EARNINGS_RATE) < MIN_NET_EARNINGS);
  return {
    mustFile: {
      // A business whose line 31 is blank leaves the question open, unless only losses are unknown.
      "schedule-se": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_se",
        fallbacks: !known
          ? []
          : [
              {
                rule: "fallback: Schedule SE line 4c (92.35% of Schedule C net profit) is $400 or more",
                value: line4a >= MIN_NET_EARNINGS,
                triggeredByFactKeys: own.map((business) => business.key),
              },
            ],
      }),
    },
    scheduleCNetProfit: profit,
  };
}
