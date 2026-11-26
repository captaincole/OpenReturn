/*
 * The FTB 5870A copies a return files: one for each trust whose distribution
 * California taxes on this form, Part I or Part II by the beneficiary's
 * interest (ca-5870a-inst-2025::sec::purpose::b01, ::b02).
 */

import {
  getTrustAccumulationDistributionFacts,
  type TrustAccumulationDistributionFact,
} from "../../../facts/index.js";
import { roundDollars, sum } from "../../../money.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { Carried, Form5870ACopy, Form5870AResult } from "./filingInfo.js";
import { partIResult } from "./partI.js";
import { partIIResult } from "./partII.js";

/*
 * A trust fact that files FTB 5870A: a California answer other than "untaxed",
 * or a federal throwback year with the California answers still to come.
 */
export function filesForm5870A(fact: TrustAccumulationDistributionFact): boolean {
  const { california, throwbackYears } = fact.value;
  if (california === undefined) return throwbackYears.length > 0;
  return california.beneficiaryInterest !== "untaxed";
}

function resultOf(
  inputs: ResolverInputs,
  fact: TrustAccumulationDistributionFact,
): Form5870AResult {
  const { california } = fact.value;
  if (california === undefined) return { kind: "waits", missing: [fact.key] };
  /*
   * "If IRC Section 667 and R&TC Section 17745(b) both appear to apply to the
   * same distribution, calculate the tax on the distribution using R&TC
   * Section 17745 and Part II only" (purpose::b01): the beneficiary's interest
   * names one part.
   */
  const { beneficiary, trustType } = fact.value;
  return california.beneficiaryInterest === "schedule_j"
    ? partIResult(inputs, california.throwbackYears, fact.key, beneficiary ?? "taxpayer", trustType)
    : partIIResult(inputs, california, fact.key);
}

/* Every FTB 5870A the facts file, in the order recorded. */
export function form5870ACopies(inputs: ResolverInputs): Form5870ACopy[] {
  return getTrustAccumulationDistributionFacts(inputs.facts)
    .filter(filesForm5870A)
    .map((fact) => ({
      factKey: fact.key,
      trustName: fact.value.trustName,
      trustEin: fact.value.trustEin,
      beneficiary: fact.value.beneficiary ?? "taxpayer",
      california: fact.value.california,
      result: resultOf(inputs, fact),
    }));
}

/*
 * "Do not use form FTB 5870A if you were a non-contingent beneficiary and ...
 * the trust did not file Form 541 or pay the required California tax due. The
 * entire trust accumulation income is taxable in the year that you receive the
 * distribution, and should be reported on Schedule CA (540), Part I, Section B,
 * line 8z, column C" (purpose::b02). The total of those distributions, or the
 * trust keys while an amount is missing.
 */
export function untaxedDistributions(inputs: ResolverInputs): { amount: number } | string[] {
  const untaxed = getTrustAccumulationDistributionFacts(inputs.facts).filter(
    (fact) => fact.value.california?.beneficiaryInterest === "untaxed",
  );
  const missing = untaxed.filter(
    (fact) => fact.value.california?.accumulationDistribution === undefined,
  );
  if (missing.length > 0) return missing.map((fact) => fact.key);
  const amounts = untaxed.map((fact) => fact.value.california?.accumulationDistribution);
  return { amount: roundDollars(sum(...amounts)) };
}

const isGap = (value: Carried): value is { gap: string } =>
  typeof value === "object" && "gap" in value;

/* Two amounts for one line: a gap wins, then a wait, then the sum; undefined when neither applies. */
export function combine(first: Carried, second: Carried): Carried {
  if (isGap(first)) return first;
  if (isGap(second)) return second;
  if (first === "waits" || second === "waits") return "waits";
  if (first === undefined || second === undefined) return first ?? second;
  return { amount: first.amount + second.amount };
}
