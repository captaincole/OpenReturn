import { HSA_COVERAGE_KEYS, type HsaCoverageType } from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form8889FilingInfo } from "./filingInfo.js";

const SA_KEY_RE = /^account\.[^.]+\.hsa_distributions\.[^.]+$/;

export function resolve8889Info(inputs: ResolverInputs): Form8889FilingInfo {
  const { factByKey } = inputs;
  const coverageType = factByKey.get(HSA_COVERAGE_KEYS.coverageType) as HsaCoverageType | undefined;
  const employer = employerContributions(inputs);
  const distributions = factsInCategory(inputs, "hsa").filter((row) => SA_KEY_RE.test(row.key));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8889",
    fallbacks: [
      {
        rule: "fallback: HSA coverage, W-2 box 12 code W, or 1099-SA present",
        value: coverageType !== undefined || employer !== undefined || distributions.length > 0,
      },
    ],
  });
  const ownContributions = numberFact(factByKey.get(HSA_COVERAGE_KEYS.ownContributions));
  const allQualified = factByKey.get(HSA_COVERAGE_KEYS.distributionsAllQualified) as
    boolean | undefined;
  return {
    mustFile: { "form-8889": resolution },
    missingInputs: {
      "form-8889": missingInputs({
        [HSA_COVERAGE_KEYS.coverageType]: coverageType,
        [HSA_COVERAGE_KEYS.ownContributions]: ownContributions,
        ...(distributions.length > 0
          ? { [HSA_COVERAGE_KEYS.distributionsAllQualified]: allQualified }
          : {}),
      }),
    },
    hsaCoverageType: coverageType,
    hsaCoverageMonths: numberFact(factByKey.get(HSA_COVERAGE_KEYS.coverageMonths)),
    hsaOwnContributions: ownContributions,
    hsaEmployerContributions: employer,
    hsaDistributionsTotal:
      distributions.length > 0
        ? sum(...distributions.map((row) => numberFact((row.value as { box1?: unknown }).box1)))
        : undefined,
    hsaDistributionsAllQualified: allQualified,
  };
}

function employerContributions(inputs: ResolverInputs): number | undefined {
  let total: number | undefined;
  for (const row of factsInCategory(inputs, "wages")) {
    const box12 = (row.value as { box12?: Array<{ code: string; amount: number }> }).box12 ?? [];
    for (const entry of box12) {
      if (entry.code.toUpperCase() === "W") total = (total ?? 0) + entry.amount;
    }
  }
  return total;
}

function numberFact(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
