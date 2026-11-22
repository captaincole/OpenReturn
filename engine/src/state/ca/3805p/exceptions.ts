/*
 * FTB 3805P Part I line 2: the part of line 1 an exception covers, read from
 * the same facts as federal Form 5329 line 2. "California and federal laws are
 * generally the same for the tax on early distributions except for the rate of
 * tax assessed. California does not conform to all of the federal exceptions"
 * (ca-3805p-inst-2025::sec::b-who-must-file::b02). The FTB list keeps the
 * federal numbers 01–23 (ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b02–b05,
 * against irs-5329-inst-2025::sec::exceptions-to-the-additional-tax-on-early::b01–b05),
 * marks three of them "Not applicable", and adds 24 and 25.
 */

import {
  makeEarlyDistributionExceptionKey,
  type RetirementDistributionFact,
} from "../../../facts/index.js";
import {
  excludedAmount,
  line2,
  line2ExceptionNumber,
  type EarlyDistributionRow,
} from "../../../federal/5329/lines.js";
import {
  earlyDistributionPerson,
  isEarlyDistribution,
  over59AndAHalfAllYear,
  retirementDistributionFacts,
} from "../../../federal/5329/partI.js";
import { sum } from "../../../money.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { EarlyDistributionOwner } from "./filingInfo.js";

/*
 * ::line-2-early-distributions-not-subject-to-additional-tax::b03: "13: Not
 * applicable."; ::b04: "17: Not applicable." and "18: Not applicable." (federal
 * 13 is a section 457 plan, 17 a federal phased retirement annuity, 18 a
 * section 414(w) withdrawal). The FTB list gives these numbers no California
 * exception, so such a row stays on line 3 and pays the California tax.
 */
export const EXCEPTIONS_CALIFORNIA_DOES_NOT_ALLOW: readonly string[] = ["13", "17", "18"];

export type CaliforniaExclusion =
  /* No exception applies: line 2 is blank and line 3 is line 1. */
  | { status: "none" }
  /* Line 2's amount (each row capped at its amount in income) and its number, 99 for more than one. */
  | { status: "excluded"; amount: number; number: string; simpleIraExcluded: number }
  /* A stated exception is unreadable or wrong for the plan: Cade asks again, and lines 2–4 wait. */
  | { status: "pending" }
  /* An exception applies to a row whose amount in income the engine does not figure. */
  | { status: "gap"; reason: string };

export interface CaliforniaExclusionRead {
  exclusion: CaliforniaExclusion;
  invalidExceptionKeys: string[];
}

const NONE: CaliforniaExclusionRead = { exclusion: { status: "none" }, invalidExceptionKeys: [] };

const gapReason = (federalGap: string) =>
  `An exception covers an early distribution, and line 2 takes the part of each distribution's amount in income it excludes (ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b01), which the engine does not figure here: ${federalGap}`;

/* A row keeps its exception only when California allows the number. */
const inCalifornia = (row: EarlyDistributionRow): EarlyDistributionRow =>
  row.exception && EXCEPTIONS_CALIFORNIA_DOES_NOT_ALLOW.includes(row.exception.number)
    ? { ...row, exception: undefined }
    : row;

/* Whether any exception would apply to the person's early rows: a stated one, or exception 12 (59½ all year). */
function claimsException(
  inputs: ResolverInputs,
  owner: EarlyDistributionOwner,
  facts: RetirementDistributionFact[],
): boolean {
  if (over59AndAHalfAllYear(inputs, owner)) return true;
  return facts.some(
    (fact) =>
      (fact.distribution.owner ?? "taxpayer") === owner &&
      isEarlyDistribution(fact.distribution) &&
      inputs.factByKey.has(makeEarlyDistributionExceptionKey(fact.payerSlug, fact.distributionId)),
  );
}

/*
 * The person's line 2, from the federal Part I rows (partI.ts): exception 12
 * covers a code 1 or S row in full when the person was 59½ or older all year
 * (FTB exception 12, ::b03), and a stated exception covers at most the row's
 * amount in income (excludedAmount), as on Form 5329.
 */
export function californiaExclusion(
  inputs: ResolverInputs,
  owner: EarlyDistributionOwner | undefined,
): CaliforniaExclusionRead {
  if (owner === undefined) return NONE;
  const facts = retirementDistributionFacts(inputs);
  const { person, invalidExceptionKeys } = earlyDistributionPerson(inputs, owner, facts);
  if (invalidExceptionKeys.length > 0)
    return { exclusion: { status: "pending" }, invalidExceptionKeys };
  if (!person) return NONE;
  if (person.gap !== undefined) {
    if (!claimsException(inputs, owner, facts)) return NONE;
    return { exclusion: { status: "gap", reason: gapReason(person.gap) }, invalidExceptionKeys };
  }
  const rows = person.rows.map(inCalifornia);
  const number = line2ExceptionNumber(rows);
  if (number === undefined) return NONE;
  const simpleIraExcluded = sum(
    ...rows.filter((row) => row.simpleIraFirstTwoYears).map(excludedAmount),
  );
  return {
    exclusion: { status: "excluded", amount: line2(rows), number, simpleIraExcluded },
    invalidExceptionKeys,
  };
}
