import {
  ARCHER_MSA_KEYS,
  getLtcBenefitsFacts,
  isHsaDistributionFactKey,
  type HsaDistributionFactValue,
} from "../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { AccountHolder } from "./exceptions.js";
import type { Form8853FilingInfo } from "./filingInfo.js";
import { sectionA } from "./sectionA.js";
import { sectionB } from "./sectionB.js";
import { sectionC } from "./sectionC.js";

export interface Form8853Inputs {
  archer: HsaDistributionFactValue[];
  medicareAdvantage: HsaDistributionFactValue[];
}

/* Form 1099-SA box 5 sorts each distribution: Section A (Archer MSA) or Section B (MA MSA). */
export function msaDistributions(inputs: ResolverInputs): Form8853Inputs {
  const all = inputs.facts
    .filter((fact) => fact.category === "hsa" && isHsaDistributionFactKey(fact.key))
    .map((fact) => fact.value as HsaDistributionFactValue);
  return {
    archer: all.filter((row) => row.box5 === "Archer MSA"),
    medicareAdvantage: all.filter((row) => row.box5 === "MA MSA"),
  };
}

/* "If both spouses have MSAs", the SSN shown first on the return (irs-8853-inst-2025::sec::specific-instructions::b01). */
function msaHolder(holders: ReadonlyArray<AccountHolder>): AccountHolder | undefined {
  if (holders.length === 0) return undefined;
  return holders.every((holder) => holder === "spouse") ? "spouse" : "taxpayer";
}

/*
 * Who must file (irs-8853-inst-2025::sec::who-must-file::b01): an Archer MSA
 * contribution (W-2 code R or the taxpayer's own), an Archer MSA or Medicare
 * Advantage MSA distribution (a 1099-SA), or per diem LTC payments or
 * accelerated death benefits (a 1099-LTC with box 3 "Per diem"; the Section C
 * chart, ::multiple-payees::b01). The explicit decision still wins.
 */
export function resolve8853Info(inputs: ResolverInputs): Form8853FilingInfo {
  const { archer, medicareAdvantage } = msaDistributions(inputs);
  const archerMsa = sectionA(inputs, archer);
  const medicareMsa = sectionB(inputs, medicareAdvantage);
  const longTermCare = sectionC(inputs);
  const contributions =
    archerMsa.lines["0.line.1_employer_contributions"] !== undefined ||
    inputs.factByKey.get(ARCHER_MSA_KEYS.ownContributions) !== undefined;
  const ltc = getLtcBenefitsFacts(inputs.facts).filter((fact) => fact.value.box3 === "per_diem");
  const triggers = inputs.facts
    .filter(
      (fact) =>
        fact.key === ARCHER_MSA_KEYS.ownContributions ||
        (fact.category === "hsa" &&
          isHsaDistributionFactKey(fact.key) &&
          (fact.value as HsaDistributionFactValue).box5 !== "HSA"),
    )
    .map((fact) => fact.key)
    .concat(ltc.map((fact) => fact.key));
  const signal =
    contributions || archer.length > 0 || medicareAdvantage.length > 0 || ltc.length > 0;
  return {
    mustFile: {
      "form-8853": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8853",
        fallbacks: [
          {
            rule: "fallback: an Archer MSA contribution, an MSA distribution (1099-SA) or per diem LTC payments (1099-LTC)",
            value: signal,
            triggeredByFactKeys: triggers,
          },
        ],
      }),
    },
    missingInputs: {
      "form-8853": missingInputs({
        ...archerMsa.required,
        ...medicareMsa.required,
        ...longTermCare.required,
      }),
    },
    form8853Lines: { ...archerMsa.lines, ...medicareMsa.lines, ...longTermCare.lines },
    form8853Expected: [
      ...(archerMsa.expected ?? []),
      ...(medicareMsa.expected ?? []),
      ...(longTermCare.expected ?? []),
    ],
    form8853MsaHolder: msaHolder([...archerMsa.holders, ...medicareMsa.holders]),
    form8853Policyholder: longTermCare.policyholder,
    form8853MsaHolders: [...new Set([...archerMsa.holders, ...medicareMsa.holders])],
    form8853ArcherSubjectToTax: archerMsa.subjectToTax,
  };
}
