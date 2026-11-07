import {
  dependentCredit,
  getDependentFacts,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { DependentRow, Schedule8812FilingInfo } from "./filingInfo.js";

/* Resolvers see no tax year; the 1040 pins its age rules to 2025 the same way (born before 1/2/1961). */
const TAX_YEAR = 2025;

function dependentRow(factKey: string, dependent: DependentFactValue): DependentRow {
  const livedWithYouOverHalfYear = livedWithTaxpayerOverHalfYear(dependent, TAX_YEAR);
  return {
    factKey,
    dependent,
    livedWithYouOverHalfYear,
    livedWithYouInUs:
      livedWithYouOverHalfYear === undefined || dependent.livedInUs === undefined
        ? undefined
        : livedWithYouOverHalfYear && dependent.livedInUs,
    credit: dependentCredit(dependent, TAX_YEAR),
  };
}

/*
 * irs-1040s8-inst-2025::sec::credits-for-qualifying-children::b01 and ::b02: the
 * schedule claims the child tax credit for a dependent under 17 with an SSN, and
 * the credit for other dependents for any other dependent with a TIN. It files
 * when a dependent fact earns either credit. Every derived Dependents-table
 * answer is decided here once; the 1040 reads it from the rows. While a
 * dependent's answers are not all in, the schedule files and lists them as
 * missing, so they reach the pending facts: a blocked must-file would hide them.
 */
export function resolveSchedule8812Info(inputs: ResolverInputs): Schedule8812FilingInfo {
  const dependents = getDependentFacts(inputs.facts).map((fact) =>
    dependentRow(fact.sourceFact.key, fact.dependent),
  );
  const undecided = dependents.filter((row) => row.credit === undefined);
  const childTaxCreditCount = dependents.filter((row) => row.credit === "child_tax_credit").length;
  const otherDependentCount = dependents.filter((row) => row.credit === "other_dependents").length;
  const claims = childTaxCreditCount + otherDependentCount > 0;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_8812",
    fallbacks: [
      undecided.length > 0
        ? {
            rule: `fallback: ${undecided.length} dependent(s) with an answer missing; the schedule files until they are in`,
            value: true,
            triggeredByFactKeys: undecided.map((row) => row.factKey),
          }
        : {
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
