import {
  dependentCredit,
  isDependentFactKey,
  parseDependentFact,
  type DependentFact,
} from "../../facts/index.js";
import type { TaxFactRow } from "../../facts/rows.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Schedule8812FilingInfo } from "./filingInfo.js";

/*
 * irs-1040s8-inst-2025::sec::credits-for-qualifying-children::b01 and ::b02: the
 * schedule claims the child tax credit for a dependent under 17 with an SSN, and
 * the credit for other dependents for any other dependent with a TIN. It files
 * when a dependent fact earns either credit. A dependent whose date of birth is
 * unknown keeps the question open.
 */
/* Resolvers see no tax year; the 1040 pins its age rules to 2025 the same way (born before 1/2/1961). */
const TAX_YEAR = 2025;

export function resolveSchedule8812Info(inputs: ResolverInputs): Schedule8812FilingInfo {
  const dependents = factsInCategory(inputs, "dependents")
    .filter((row) => isDependentFactKey(row.key))
    .map((row) => parseDependentFact(row as TaxFactRow))
    .filter((fact): fact is DependentFact => fact !== null);
  const credits = dependents.map((fact) => dependentCredit(fact.dependent, TAX_YEAR));
  const undecided = credits.some((credit) => credit === undefined);
  const childTaxCreditCount = credits.filter((credit) => credit === "child_tax_credit").length;
  const otherDependentCount = credits.filter((credit) => credit === "other_dependents").length;
  const claims = childTaxCreditCount + otherDependentCount > 0;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_8812",
    fallbacks: undecided
      ? []
      : [
          {
            rule: `fallback: ${childTaxCreditCount} dependent(s) for the child tax credit and ${otherDependentCount} for the credit for other dependents`,
            value: claims,
            triggeredByFactKeys: dependents.map((fact) => fact.sourceFact.key),
          },
        ],
  });
  return {
    mustFile: { "schedule-8812": resolution },
    dependents,
    childTaxCreditCount: undecided ? undefined : childTaxCreditCount,
    otherDependentCount: undecided ? undefined : otherDependentCount,
  };
}
