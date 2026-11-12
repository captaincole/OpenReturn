/*
 * Disability pensions: a 1099-R with box 7 code 3 that is not from an IRA.
 * Received before the minimum retirement age set by the employer, it is wages
 * on Form 1040 line 1h; after that age, a pension on lines 5a and 5b
 * (irs-1040-inst-2025::sec::lines-5a-and-5b::b01, irs-1040-inst-2025::sec::line-1h::b02).
 * Schedule R line 11 (taxable disability income) reads the line 1h part by person.
 */

import {
  isDisabilityPension,
  isRetirementDistributionFactKey,
  makeDisabilityBeforeMinimumRetirementAgeKey,
  type RetirementDistributionFactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, type ResolverInputs } from "../../resolverInputs.js";
import { rowTaxable } from "./resolveInfo.js";

export interface DisabilityPension {
  distribution: RetirementDistributionFactValue;
  /* The answer's key: received before the employer's minimum retirement age. */
  answerKey: string;
  /* Undefined while the taxpayer has not answered. */
  beforeMinimumRetirementAge?: boolean;
}

export function disabilityPensions(inputs: ResolverInputs): DisabilityPension[] {
  return factsInCategory(inputs, "retirement").flatMap((row) => {
    if (!isRetirementDistributionFactKey(row.key)) return [];
    const distribution = row.value as RetirementDistributionFactValue;
    if (!isDisabilityPension(distribution)) return [];
    // The key is payer.<payerSlug>.distributions.<distributionId>.
    const [, payerSlug, , distributionId] = row.key.split(".");
    const answerKey = makeDisabilityBeforeMinimumRetirementAgeKey(payerSlug, distributionId);
    const answer = inputs.factByKey.get(answerKey);
    return [
      {
        distribution,
        answerKey,
        beforeMinimumRetirementAge: typeof answer === "boolean" ? answer : undefined,
      },
    ];
  });
}

/* Every pension's answer is in. */
export function disabilityAnswersComplete(pensions: DisabilityPension[]): boolean {
  return pensions.every((pension) => pension.beforeMinimumRetirementAge !== undefined);
}

/*
 * Line 1h's disability pensions for one person (owner absent means the
 * taxpayer): the taxable amount of each pension received before the minimum
 * retirement age. Undefined while an answer or a taxable amount is missing.
 */
export function disabilityWages(
  pensions: DisabilityPension[],
  owner?: "taxpayer" | "spouse",
): number | undefined {
  if (!disabilityAnswersComplete(pensions)) return undefined;
  const own = pensions.filter(
    (pension) =>
      pension.beforeMinimumRetirementAge === true &&
      (owner === undefined || (pension.distribution.owner ?? "taxpayer") === owner),
  );
  const taxable = own.map((pension) => rowTaxable(pension.distribution));
  return taxable.includes(undefined) ? undefined : sum(...taxable);
}
