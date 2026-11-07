import { dependentCredit, getDependentFacts } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { DependentRow, Schedule8812FilingInfo } from "./filingInfo.js";

/* Resolvers see no tax year; the 1040 pins its age rules to 2025 the same way (born before 1/2/1961). */
const TAX_YEAR = 2025;

/*
 * irs-1040s8-inst-2025::sec::credits-for-qualifying-children::b01 and ::b02: the
 * schedule claims the child tax credit for a dependent under 17 with an SSN, and
 * the credit for other dependents for any other dependent with a TIN. It files
 * when a dependent fact earns either credit. The credit is decided here once;
 * the 1040 Dependents table reads it from the rows. A dependent whose answers
 * are not all in keeps the question open.
 */
export function resolveSchedule8812Info(inputs: ResolverInputs): Schedule8812FilingInfo {
  const dependents: DependentRow[] = getDependentFacts(inputs.facts).map((fact) => ({
    factKey: fact.sourceFact.key,
    dependent: fact.dependent,
    credit: dependentCredit(fact.dependent, TAX_YEAR),
  }));
  const undecided = dependents.filter((row) => row.credit === undefined);
  const childTaxCreditCount = dependents.filter((row) => row.credit === "child_tax_credit").length;
  const otherDependentCount = dependents.filter((row) => row.credit === "other_dependents").length;
  const claims = childTaxCreditCount + otherDependentCount > 0;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_8812",
    fallbacks:
      undecided.length > 0
        ? []
        : [
            {
              rule: `fallback: ${childTaxCreditCount} dependent(s) for the child tax credit and ${otherDependentCount} for the credit for other dependents`,
              value: claims,
              triggeredByFactKeys: dependents.map((row) => row.factKey),
            },
          ],
  });
  return {
    mustFile: { "schedule-8812": resolution },
    /* A dependent with an answer missing (date of birth, months, citizenship, Form 8332) is asked again. */
    missingInputs: { "schedule-8812": undecided.map((row) => row.factKey) },
    dependents,
    childTaxCreditCount: undecided.length > 0 ? undefined : childTaxCreditCount,
    otherDependentCount: undecided.length > 0 ? undefined : otherDependentCount,
  };
}
