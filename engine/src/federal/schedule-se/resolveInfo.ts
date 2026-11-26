import {
  businessesOnReturn,
  farmOwnerOf,
  farmsOnReturn,
  isW2FactKey,
  ownerOf,
  type W2FactValue,
} from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { netProfit, tentativeProfit } from "../schedule-c/lines.js";
import { scheduleCOpen } from "../schedule-c/resolveInfo.js";
import { scheduleFOpen } from "../schedule-f/resolveInfo.js";
import { farmsTotal } from "../schedule-f/totals.js";
import type { ScheduleSEFilingInfo } from "./filingInfo.js";
import { CRP_FILING_THRESHOLD, MIN_NET_EARNINGS, netEarnings } from "./lines.js";

/*
 * irs-1040sse-inst-2025::sec::who-must-file-schedule-se::b01: line 4c of $400 or
 * more. Schedule C (line 2) and Schedule F (line 1a, with line 1b) feed line 3;
 * partnership earnings, church employee income and the optional methods have
 * no facts yet.
 * One Schedule SE per person; a spouse's Schedule SE on a joint return is not
 * modeled, so a spouse-owned business on a joint return leaves the question open.
 */
export function resolveScheduleSEInfo(inputs: ResolverInputs): ScheduleSEFilingInfo {
  // An unknown filing status may turn out joint, so a spouse's business counts until it is known.
  const status = filingStatusOf(inputs);
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    status === undefined || status === "married_filing_jointly",
  );
  const own = businesses.filter((business) => ownerOf(business.value) === "taxpayer");
  const spouseBusiness = businesses.length > own.length;
  const onReturn = businesses.map((business) => business.value);
  const profits = own.map((business) => netProfit(business.value, onReturn));
  const known = profits.every((profit) => profit !== undefined);
  const profit = own.length === 0 || !known ? undefined : sum(...profits);
  const line4a = profit === undefined ? 0 : netEarnings(profit);
  /*
   * A blank line 31 that is a tentative loss (line 29 < 0) can only add a limited
   * loss, so when the known profits alone stay under $400 the answer is still no.
   */
  const knownProfit = sum(...profits.filter((value) => value !== undefined));
  const onlyLossesUnknown = own.every(
    (business, index) => profits[index] !== undefined || (tentativeProfit(business.value) ?? 0) < 0,
  );
  const farm = farmPart(inputs, status === undefined || status === "married_filing_jointly");
  const decided =
    !spouseBusiness &&
    !scheduleCOpen(inputs) &&
    malformedKeys.length === 0 &&
    farm.decided &&
    farm.known &&
    (known ||
      (onlyLossesUnknown &&
        netEarnings(knownProfit + sum(farm.profit) - sum(farm.crp)) < MIN_NET_EARNINGS));
  const line3 = selfEmploymentLine3(profit, farm, known);
  const files = line3 !== undefined && mustFileForLine3(line3, profit ?? 0, farm);
  const wages = taxpayerSocialSecurityWages(inputs);
  return {
    mustFile: {
      /*
       * A blank line 31 leaves the question open, unless only losses are unknown; so does a
       * spouse's business on a joint return, a business fact that cannot be read, or an
       * open Schedule C (a 1099-K that names no business). Farms the same way: a waiting
       * or unhandled line 34, a spouse's farm on a joint return, or an open Schedule F.
       */
      "schedule-se": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_se",
        fallbacks: !decided
          ? []
          : [
              {
                rule: "fallback: Schedule SE line 4c (92.35% of Schedule C and Schedule F net profit, less line 1b) is $400 or more, or lines 1a and 2 are $434 or more with an amount on line 1b",
                value: files,
                triggeredByFactKeys: [...own.map((business) => business.key), ...farm.keys],
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
    scheduleCNetProfitWaits: own.length > 0 && profit === undefined,
    farmNetProfit: farm.profit,
    farmNetProfitGap: farm.gap,
    farmNetProfitWaits: farm.waits,
    crpPayments: farm.crp,
    selfEmploymentLine3: line3,
    w2SocialSecurityWagesAndTips: wages.wages,
  };
}

/*
 * Line 1a: the taxpayer's farms, Schedule F line 34 (irs-1040sf-inst-2025::sec::line-34::b02);
 * line 1b: their taxable CRP payments received while on social security
 * (irs-1040sse-inst-2025::sec::line-1b::b01). A spouse's farm on a joint return
 * needs the spouse's Schedule SE, which is not modeled, so the answer stays open.
 */
function farmPart(inputs: ResolverInputs, joint: boolean) {
  const { farms, malformedKeys } = farmsOnReturn(inputs.facts, joint);
  const own = farms.filter((farm) => farmOwnerOf(farm.value) === "taxpayer");
  const total = farmsTotal(own);
  const crp = sumOrBlank(...own.map((farm) => farm.value.crpPaymentsWhileReceivingSocialSecurity));
  return {
    keys: own.map((farm) => farm.key),
    any: own.length > 0,
    profit: total?.kind === "amount" ? total.amount : undefined,
    gap: total?.kind === "gap" ? total.reason : undefined,
    waits: total?.kind === "waits",
    known: total === undefined || total.kind === "amount",
    decided:
      own.length === farms.length &&
      malformedKeys.length === 0 &&
      !scheduleFOpen(inputs) &&
      total?.kind !== "gap",
    crp: crp === undefined || crp === 0 ? undefined : crp,
  };
}

type FarmPart = ReturnType<typeof farmPart>;

/* Line 3 from facts: line 1a plus line 2 less line 1b; undefined while a part waits or with neither. */
function selfEmploymentLine3(
  scheduleC: number | undefined,
  farm: FarmPart,
  scheduleCKnown: boolean,
): number | undefined {
  if (!scheduleCKnown || !farm.known || farm.gap) return undefined;
  if (scheduleC === undefined && !farm.any) return undefined;
  return sum(roundDollars(farm.profit), roundDollars(scheduleC)) - sum(roundDollars(farm.crp));
}

/* Who must file: line 4c of $400 or more, or the line 1b rule ($434 of lines 1a and 2). */
function mustFileForLine3(line3: number, scheduleC: number, farm: FarmPart): boolean {
  if (netEarnings(line3) >= MIN_NET_EARNINGS) return true;
  const line1aAnd2 = sum(roundDollars(farm.profit), roundDollars(scheduleC));
  return farm.crp !== undefined && line1aAnd2 >= CRP_FILING_THRESHOLD;
}

/*
 * Line 6 from facts, for Form 8959's Who Must File: line 4c (92.35% of line 3,
 * 0 under $400); no optional methods or church income. 0 when Schedule SE is not
 * filed, undefined while its must-file answer, line 31 or line 34 is open.
 */
export function selfEmploymentIncome(info: ScheduleSEFilingInfo): number | undefined {
  const filed = info.mustFile?.["schedule-se"]?.value;
  if (filed === false) return 0;
  const line3 = info.selfEmploymentLine3;
  if (filed === undefined || line3 === undefined) return undefined;
  const line4a = netEarnings(line3);
  return line4a >= MIN_NET_EARNINGS ? line4a : 0;
}

/*
 * Line 8a: the taxpayer's W-2 social security wages and tips (boxes 3 and 7). On
 * a joint return only the taxpayer's W-2s count: the fact's owner when Cade
 * recorded one, else the employee SSN. A W-2 with neither cannot be placed, so
 * line 8a waits and Cade is asked about it. On any other status every W-2 on
 * the return is the filer's.
 */
function taxpayerSocialSecurityWages(inputs: ResolverInputs): {
  wages: number | undefined;
  unplacedW2Keys: string[];
} {
  const w2s = inputs.facts
    .filter((fact) => fact.category === "wages" && isW2FactKey(fact.key))
    .map((fact) => ({ key: fact.key, w2: fact.value as W2FactValue }));
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const unplacedW2Keys = joint
    ? w2s.filter(({ w2 }) => w2Owner(inputs, w2) === undefined).map(({ key }) => key)
    : [];
  const own = joint ? w2s.filter(({ w2 }) => w2Owner(inputs, w2) === "taxpayer") : w2s;
  const wages =
    own.length === 0 || unplacedW2Keys.length > 0
      ? undefined
      : sum(...own.flatMap(({ w2 }) => [w2.box3, w2.box7]));
  return { wages, unplacedW2Keys };
}
