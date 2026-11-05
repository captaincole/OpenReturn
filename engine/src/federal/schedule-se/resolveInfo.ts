import { isW2FactKey, readBusinessFacts, type W2FactValue } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { roundDollars, sum } from "../../money.js";
import { missingInputs, resolveMustFile, text, type ResolverInputs } from "../../resolverInputs.js";
import { ssn, type SSN } from "../../values.js";
import { netProfit, tentativeProfit } from "../schedule-c/lines.js";
import type { ScheduleSEFilingInfo } from "./filingInfo.js";

/* Line 4a: 92.35% of line 3. */
export const NET_EARNINGS_RATE = 0.9235;
export const MIN_NET_EARNINGS = 400;

/*
 * irs-1040sse-inst-2025::sec::who-must-file-schedule-se::b01: line 4c of $400 or
 * more. Only Schedule C feeds line 3 now: farm income (line 1a), partnership
 * earnings, church employee income and the optional methods have no facts yet.
 * One Schedule SE per person; a spouse's Schedule SE on a joint return is not
 * modeled, so a spouse-owned business leaves the question open.
 */
export function resolveScheduleSEInfo(inputs: ResolverInputs): ScheduleSEFilingInfo {
  const businesses = readBusinessFacts(inputs.facts).businesses;
  const own = businesses.filter((business) => (business.value.owner ?? "taxpayer") === "taxpayer");
  const spouseBusiness = businesses.length > own.length;
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
    !spouseBusiness &&
    (known ||
      (onlyLossesUnknown && roundDollars(knownProfit * NET_EARNINGS_RATE) < MIN_NET_EARNINGS));
  const wages = taxpayerSocialSecurityWages(inputs);
  return {
    mustFile: {
      // A blank line 31 leaves the question open, unless only losses are unknown; so does a spouse business.
      "schedule-se": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_se",
        fallbacks: !decided
          ? []
          : [
              {
                rule: "fallback: Schedule SE line 4c (92.35% of Schedule C net profit) is $400 or more",
                value: known && line4a >= MIN_NET_EARNINGS,
                triggeredByFactKeys: own.map((business) => business.key),
              },
            ],
      }),
    },
    missingInputs: {
      "schedule-se": missingInputs(
        Object.fromEntries(wages.unplacedW2Keys.map((key) => [key, undefined])),
      ),
    },
    scheduleCNetProfit: profit,
    w2SocialSecurityWagesAndTips: wages.wages,
  };
}

/*
 * Line 6 from facts, for Form 8959's Who Must File: line 4c (92.35% of the profit,
 * 0 under $400); no optional methods or church income. 0 when Schedule SE is not
 * filed, undefined while its must-file answer or line 31 is open.
 */
export function selfEmploymentIncome(info: ScheduleSEFilingInfo): number | undefined {
  const filed = info.mustFile?.["schedule-se"]?.value;
  if (filed === false) return 0;
  const profit = info.scheduleCNetProfit;
  if (filed === undefined || profit === undefined) return undefined;
  const line4a = profit > 0 ? roundDollars(profit * NET_EARNINGS_RATE) : 0;
  return line4a >= MIN_NET_EARNINGS ? line4a : 0;
}

/* The 9 digits of an SSN as entered, or undefined when it is missing or malformed. */
function ssnOf(raw: string | undefined): SSN | undefined {
  if (!raw) return undefined;
  try {
    return ssn(raw);
  } catch {
    return undefined;
  }
}

/*
 * Line 8a: the taxpayer's W-2 social security wages and tips (boxes 3 and 7). On
 * a joint return only a W-2 with the taxpayer's SSN counts; a W-2 with no
 * employee SSN cannot be placed, so line 8a waits and Cade is asked about it. On
 * any other status every W-2 on the return is the filer's.
 */
function taxpayerSocialSecurityWages(inputs: ResolverInputs): {
  wages: number | undefined;
  unplacedW2Keys: string[];
} {
  const w2s = inputs.facts
    .filter((fact) => fact.category === "wages" && isW2FactKey(fact.key))
    .map((fact) => ({ key: fact.key, w2: fact.value as W2FactValue }));
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const taxpayerSsn = ssnOf(text(inputs, "identity.ssn"));
  const unplacedW2Keys = joint
    ? w2s.filter(({ w2 }) => ssnOf(w2.employee?.ssn) === undefined).map(({ key }) => key)
    : [];
  const own = joint
    ? w2s.filter(({ w2 }) => taxpayerSsn !== undefined && ssnOf(w2.employee?.ssn) === taxpayerSsn)
    : w2s;
  const wages =
    own.length === 0 || unplacedW2Keys.length > 0
      ? undefined
      : sum(...own.flatMap(({ w2 }) => [w2.box3, w2.box7]));
  return { wages, unplacedW2Keys };
}
