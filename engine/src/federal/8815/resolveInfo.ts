import {
  getSavingsBondCashedFacts,
  getSavingsBondExpenseFacts,
  type SavingsBondCashedFact,
} from "../../facts/index.js";
import type { MustFileResolution } from "../../filingInfo.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8815FilingInfo, SavingsBondExclusion } from "./filingInfo.js";
import { line9Gap } from "./line9Gaps.js";
import {
  bondQualifies,
  expenseLines,
  line6Worksheet,
  PHASE_OUT_2025,
  type PhaseOutLimits,
} from "./lines.js";

function limitsFor(status: string | undefined): PhaseOutLimits | undefined {
  if (status === "married_filing_jointly") return PHASE_OUT_2025.joint;
  if (status === "single" || status === "head_of_household") return PHASE_OUT_2025.single;
  if (status === "qualifying_surviving_spouse") return PHASE_OUT_2025.single;
  return undefined;
}

export interface SavingsBondExclusionScope {
  resolution: MustFileResolution;
  exclusion: SavingsBondExclusion;
  qualifiedBonds: SavingsBondCashedFact[];
}

/*
 * Who files (irs-8815-form-2025::sec::who-can-take-the-exclusion::b01): a
 * qualified bond cashed in 2025 (series EE or I, issued after 1989, the
 * ownership test), qualified expenses left after line 3 (line 4 above zero,
 * else "stop"), and a filing status other than married filing separately. The
 * fourth test, modified AGI under the limit, is line 9's Note: the resolver
 * cannot see line 9, so above the limit the form files and stops after line 9.
 * The explicit decision still wins.
 */
export function savingsBondExclusionScope(inputs: ResolverInputs): SavingsBondExclusionScope {
  const bonds = getSavingsBondCashedFacts(inputs.facts);
  const qualifiedBonds = bonds.filter((bond) => bondQualifies(bond.value));
  const expenses = getSavingsBondExpenseFacts(inputs.facts);
  const status = filingStatusOf(inputs);
  const marriedFilingSeparately = status === "married_filing_separately";
  const exclusion: SavingsBondExclusion = {
    rows: expenses.map(({ value }) => ({
      studentName: value.studentName,
      institutionName: value.institutionName,
      institutionAddress: value.institutionAddress,
    })),
    line2: roundDollars(sum(...expenses.map(({ value }) => value.qualifiedExpenses))),
    // Line 3 prints 0 with no benefit, as in the filled form of Pub. 970 (2007), p. 57.
    line3: roundDollars(sum(...expenses.map(({ value }) => value.nontaxableBenefits))),
    worksheet:
      qualifiedBonds.length > 0
        ? line6Worksheet(qualifiedBonds.map(({ value }) => value))
        : undefined,
    limits: limitsFor(status),
    marriedFilingSeparately,
    line9Gap: line9Gap(inputs),
  };
  const line4 = expenseLines(exclusion.line2, exclusion.line3, exclusion.worksheet).line4;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8815",
    fallbacks: [
      {
        rule: `fallback: ${qualifiedBonds.length} qualified savings bond(s) cashed, line 4 $${line4} > 0, not married filing separately (${!marriedFilingSeparately})`,
        value: qualifiedBonds.length > 0 && line4 > 0 && !marriedFilingSeparately,
        triggeredByFactKeys: [...qualifiedBonds, ...expenses].map((fact) => fact.key),
      },
    ],
  });
  return { resolution, exclusion, qualifiedBonds };
}

/* True when Form 8815 files, for the forms that read its results. */
export function filesForm8815(scope: SavingsBondExclusionScope): boolean {
  return scope.resolution.value === true;
}

/*
 * The most line 14 can be: line 6, the interest on the qualified bonds (lines 7
 * and 12 are at most 1). Zero when the form does not file.
 */
export function largestSavingsBondExclusion(scope: SavingsBondExclusionScope): number {
  if (!filesForm8815(scope)) return 0;
  return atLeast(0, scope.exclusion.worksheet?.formLine6);
}

export function resolve8815Info(inputs: ResolverInputs): Form8815FilingInfo {
  const scope = savingsBondExclusionScope(inputs);
  return {
    mustFile: { "form-8815": scope.resolution },
    savingsBondExclusion: scope.exclusion,
  };
}
