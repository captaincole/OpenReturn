import {
  dependentCredit,
  getDependentFacts,
  isW2FactKey,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { sum, type Money } from "../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { DependentRow, Schedule8812FilingInfo } from "./filingInfo.js";

// irs-1040s8-inst-2025::sec::line-18b::b01: nontaxable combat pay is "shown in Form W-2, box 12, with code Q".
const COMBAT_PAY_CODE = "Q";

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
    ...w2Amounts(inputs),
  };
}

// Every W-2 counts, a spouse's too: lines 18b and 21 include a joint filer's spouse.
function w2Amounts(inputs: ResolverInputs): Partial<Schedule8812FilingInfo> {
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue);
  const combatPay = w2s
    .flatMap((w2) => w2.box12 ?? [])
    .filter((entry) => entry.code.toUpperCase() === COMBAT_PAY_CODE);
  return {
    w2NontaxableCombatPay:
      combatPay.length > 0 ? (sum(...combatPay.map((entry) => entry.amount)) as Money) : undefined,
    w2SocialSecurityTaxWithheld: sum(...w2s.map((w2) => w2.box4)) as Money,
    w2MedicareTaxWithheld: sum(...w2s.map((w2) => w2.box6)) as Money,
  };
}
