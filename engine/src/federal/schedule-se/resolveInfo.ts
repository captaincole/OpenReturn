import { readBusinessFacts } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { netProfit } from "../schedule-c/lines.js";
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
  const profit =
    own.length === 0
      ? undefined
      : own.reduce((total, business) => total + netProfit(business.value), 0);
  const line4a = profit !== undefined && profit > 0 ? roundDollars(profit * NET_EARNINGS_RATE) : 0;
  return {
    mustFile: {
      "schedule-se": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_se",
        fallbacks: [
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
