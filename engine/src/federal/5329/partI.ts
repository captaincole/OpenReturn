/*
 * Form 5329 Part I inputs for each person: the early distributions in income,
 * the exception on each, and the cases the engine does not figure.
 */

import { age59AndAHalfIn2025 } from "../../birthDate.js";
import {
  EXCEPTIONS_FOR_IRAS_ONLY,
  EXCEPTIONS_NOT_FOR_IRAS,
  EXCEPTION_AGE_59_AND_A_HALF,
  ROTH_IRA_CODES,
  SPOUSE_KEYS,
  hasDistributionCode,
  makeEarlyDistributionExceptionKey,
  parseRetirementDistributionFact,
  readEarlyDistributionException,
  readRothIraFact,
  readTraditionalIraFact,
  type IraOwner,
  type RetirementDistributionFact,
  type RetirementDistributionFactValue,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { text, type ResolverInputs } from "../../resolverInputs.js";
import { rowTaxable } from "../1040/rowTaxable.js";
import { NONQUALIFIED_ROTH_CODES, partIIIFigures } from "../8606/partIII.js";
import { form8606Filers } from "../8606/resolveInfo.js";
import type { EarlyDistributionPerson } from "./filingInfo.js";
import type { EarlyDistributionRow } from "./lines.js";

/*
 * Box 7 code 1, "early distribution, no known exception", alone or with a
 * second code (1B, 1L, 1M…), and S, a SIMPLE IRA in its first 2 years
 * (irs-5329-inst-2025::sec::line-4::b01). Codes 2, 3 and 4 claim an exception,
 * so the form is not needed for them (irs-pub-575-2025::sec::tax-on-early-distributions::b06).
 * Codes 7 (normal), G and H (direct rollovers) and Q (qualified Roth) are not early.
 */
const EARLY_CODES = ["1", "S"];
const SIMPLE_IRA_CODE = "S";
const DESIGNATED_ROTH_CODE = "B";
const CORRECTIVE_CODES = ["8", "P"];
const DIRECT_ROLLOVER_CODE = "G";

export const ROTH_IRA_GAP =
  "A Roth IRA distribution that is not qualified (code J or T) goes past the regular contribution basis or includes a first-time homebuyer amount: line 1 then takes Form 8606 line 25c, line 20 and the recapture of 2021–2025 conversions and rollovers (irs-5329-inst-2025::sec::line-1::b03–b05), which the engine does not figure.";
const DESIGNATED_ROTH_GAP =
  "A designated Roth account distribution with an amount in box 10 includes a recapture of an in-plan Roth rollover on line 1 (irs-5329-inst-2025::sec::line-1::b02), which the engine does not figure.";
const CORRECTIVE_GAP =
  "A code 1 corrective distribution (code 8 or P) of excess deferrals or contributions is not subject to the tax, but its earnings may be (irs-5329-inst-2025::sec::part-i-additional-tax-on-early::b02); the engine does not split it.";
const UNDETERMINED_GAP =
  "An early distribution's taxable amount is not determined (1099-R box 2b), so the part included in income is not known; the engine does not figure it.";
const IRA_BASIS_GAP =
  "An early IRA distribution of a person with IRA basis takes its taxable part from Form 8606 line 15c, which the engine does not split between distributions.";
const ROLLOVER_SPLIT_GAP =
  "An IRA rollover cannot be split between a person's IRA distributions, so the part of the early distribution included in income is not known.";

const ownerOf = (distribution: RetirementDistributionFactValue): IraOwner =>
  distribution.owner ?? "taxpayer";

const isTraditionalIra = (distribution: RetirementDistributionFactValue) =>
  distribution.box7IraSepSimple && !hasDistributionCode(distribution, ROTH_IRA_CODES);

export const isEarlyDistribution = (distribution: RetirementDistributionFactValue) =>
  hasDistributionCode(distribution, EARLY_CODES) &&
  !hasDistributionCode(distribution, ROTH_IRA_CODES);

/* A row's own gap, before any amount is figured. */
function rowGap(distribution: RetirementDistributionFactValue): string | undefined {
  if (hasDistributionCode(distribution, CORRECTIVE_CODES)) return CORRECTIVE_GAP;
  if (hasDistributionCode(distribution, [DESIGNATED_ROTH_CODE]) && (distribution.box10 ?? 0) > 0)
    return DESIGNATED_ROTH_GAP;
  return rowTaxable(distribution) === undefined ? UNDETERMINED_GAP : undefined;
}

/*
 * Line 1 counts the part included in income (::line-1::b01), the 1040's
 * amount; a rolled-over part is not subject (::who-must-file::b03). The
 * person's indirect rollover (the traditional IRA answer's `rolledOver`, less
 * the direct rollovers, code G) comes off an IRA row only when it is the
 * person's one IRA distribution.
 */
function amountsInIncome(
  inputs: ResolverInputs,
  owner: IraOwner,
  own: RetirementDistributionFactValue[],
  early: RetirementDistributionFactValue[],
): number[] | string {
  const iraRows = own.filter(isTraditionalIra);
  const earlyIra = early.filter(isTraditionalIra);
  if (earlyIra.length > 0) {
    if (form8606Filers(inputs).some((holder) => holder.owner === owner && holder.partI))
      return IRA_BASIS_GAP;
  }
  const direct = iraRows.filter((row) => hasDistributionCode(row, [DIRECT_ROLLOVER_CODE]));
  const rolledOver = readTraditionalIraFact(inputs.factByKey, owner)?.rolledOver ?? 0;
  const indirect = atLeast(0, rolledOver - sum(...direct.map((row) => row.box1)));
  const notDirect = iraRows.filter((row) => !direct.includes(row));
  if (earlyIra.length > 0 && indirect > 0 && notDirect.length !== 1) return ROLLOVER_SPLIT_GAP;
  return early.map((row) => {
    const taxable = rowTaxable(row) ?? 0;
    return isTraditionalIra(row) ? atLeast(0, taxable - indirect) : taxable;
  });
}

/*
 * Code J and T rows: with the Roth IRA answers, Form 8606 line 23 of 0 and no
 * line 20 amount mean the distribution stayed within the regular contribution
 * basis, which comes out first and is not taxed (::line-1::b04,
 * irs-pub-590b-2025::sec::ordering-rules-for-distributions::b01): nothing goes
 * on line 1. Anything else is the Roth recapture the engine does not figure.
 */
function rothStatus(
  inputs: ResolverInputs,
  owner: IraOwner,
  own: RetirementDistributionFactValue[],
): "none" | "pending" | "gap" {
  const roth = own.filter((row) => hasDistributionCode(row, NONQUALIFIED_ROTH_CODES));
  if (roth.length === 0) return "none";
  const answers = readRothIraFact(inputs.factByKey, owner);
  if (!answers) return "pending";
  const figures = partIIIFigures(roth, answers);
  if (figures.line23 === undefined) return "pending";
  return figures.line20 > 0 || figures.line23 > 0 ? "gap" : "none";
}

interface ExceptionRead {
  exception?: { number: string; amount: number };
  /* A stated exception that does not apply to this kind of plan, or is unreadable: Cade asks again. */
  invalidKey?: string;
}

/*
 * The row's exception. Exception 12 covers all of a code 1 or S row when the
 * person was 59½ or older all year (::exceptions-to-the-additional-tax-on-early::b02–b03).
 */
function exceptionOf(
  inputs: ResolverInputs,
  fact: RetirementDistributionFact,
  amountInIncome: number,
  over59AndAHalf: boolean,
): ExceptionRead {
  if (over59AndAHalf)
    return { exception: { number: EXCEPTION_AGE_59_AND_A_HALF, amount: amountInIncome } };
  const key = makeEarlyDistributionExceptionKey(fact.payerSlug, fact.distributionId);
  if (!inputs.factByKey.has(key)) return {};
  const stated = readEarlyDistributionException(
    inputs.factByKey,
    fact.payerSlug,
    fact.distributionId,
  );
  const ira = isTraditionalIra(fact.distribution);
  const wrongPlan =
    stated !== undefined &&
    (ira
      ? EXCEPTIONS_NOT_FOR_IRAS.includes(stated.number)
      : EXCEPTIONS_FOR_IRAS_ONLY.includes(stated.number));
  return stated && !wrongPlan ? { exception: stated } : { invalidKey: key };
}

const DOB_KEYS: Record<IraOwner, string> = { taxpayer: "identity.dob", spouse: SPOUSE_KEYS.dob };

export interface PersonRead {
  person?: EarlyDistributionPerson;
  invalidExceptionKeys: string[];
}

export function earlyDistributionPerson(
  inputs: ResolverInputs,
  owner: IraOwner,
  facts: RetirementDistributionFact[],
): PersonRead {
  const ownFacts = facts.filter((fact) => ownerOf(fact.distribution) === owner);
  const own = ownFacts.map((fact) => fact.distribution);
  const earlyFacts = ownFacts.filter((fact) => isEarlyDistribution(fact.distribution));
  const early = earlyFacts.map((fact) => fact.distribution);
  const factKeys = [
    ...earlyFacts,
    ...ownFacts.filter((fact) => hasDistributionCode(fact.distribution, NONQUALIFIED_ROTH_CODES)),
  ].map((fact) => fact.sourceFact.key);
  const roth = rothStatus(inputs, owner, own);
  const gap =
    (roth === "gap" ? ROTH_IRA_GAP : undefined) ??
    early.map(rowGap).find((reason) => reason !== undefined);
  const amounts = gap === undefined ? amountsInIncome(inputs, owner, own, early) : gap;
  const blank = { owner, rows: [], needsForm: false, factKeys };
  if (typeof amounts === "string") {
    return { person: { ...blank, gap: amounts, pending: false }, invalidExceptionKeys: [] };
  }
  const over59AndAHalf = age59AndAHalfIn2025(text(inputs, DOB_KEYS[owner])) === "all_year";
  const reads = earlyFacts.map((fact, index) =>
    exceptionOf(inputs, fact, amounts[index], over59AndAHalf),
  );
  const rows: EarlyDistributionRow[] = earlyFacts
    .map((fact, index) => ({
      amountInIncome: amounts[index],
      simpleIraFirstTwoYears: hasDistributionCode(fact.distribution, [SIMPLE_IRA_CODE]),
      exception: reads[index].exception,
    }))
    .filter((row) => row.amountInIncome > 0);
  const invalidExceptionKeys = reads.flatMap((read) => (read.invalidKey ? [read.invalidKey] : []));
  const pending = roth === "pending" || invalidExceptionKeys.length > 0;
  if (rows.length === 0 && !pending) return { invalidExceptionKeys };
  const needsForm = rows.some((row) => row.exception || row.simpleIraFirstTwoYears);
  return { person: { ...blank, rows, pending, needsForm }, invalidExceptionKeys };
}

/* Every 1099-R fact on the return. */
export function retirementDistributionFacts(inputs: ResolverInputs): RetirementDistributionFact[] {
  return inputs.facts.flatMap((row) => {
    const fact = parseRetirementDistributionFact(row);
    return fact === null ? [] : [fact];
  });
}
