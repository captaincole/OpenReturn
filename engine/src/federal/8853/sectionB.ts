/* Section B, Medicare Advantage MSA distributions: lines 10 through 13b. */

import {
  MEDICARE_ADVANTAGE_MSA_KEYS,
  numberAnswer,
  type HsaDistributionFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import {
  DEATH_OR_PROHIBITED_CODES,
  distributionCode,
  exceptedPart,
  holderOf,
  medicareAdvantageExceptionRule,
} from "./exceptions.js";
import type { Form8853Lines } from "./filingInfo.js";
import {
  additional50TaxWorksheet,
  additionalTaxBase,
  distributionLines,
  taxableDistributions,
} from "./lines.js";
import type { SectionResult } from "./sectionA.js";

const SECTION_B_FIELDS = [
  "0.line.10_total_medicare_advantage_distributions",
  "0.line.11_medicare_advantage_medical_expenses",
  "0.line.12_taxable_medicare_advantage_distributions",
  "0.line.13a_exception_additional_50_tax",
  "0.line.13b_additional_50_tax",
] as const;

/* Code 2 (excess contributions) cannot arise: only Medicare contributes, and line 10 leaves out its erroneous contributions. */
const EXCESS_CONTRIBUTION_CODE = "2";

const BOTH_SPOUSES =
  "Both spouses received Medicare Advantage MSA distributions: the instructions call for a statement Section B for each spouse (irs-8853-inst-2025::sec::section-b-medicare-advantage-msa::b01), which the engine does not model.";
const NOT_MODELED_CODE =
  "A Medicare Advantage MSA 1099-SA shows distribution code 2, 4, 5 or 6 (an erroneous Medicare contribution, the death of the account holder, or a prohibited transaction): those rules (irs-8853-inst-2025::sec::line-10::b01, ::death-of-account-holder-2::b01) are not modeled.";

function gapOf(distributions: ReadonlyArray<HsaDistributionFactValue>): string | undefined {
  if (new Set(distributions.map(holderOf)).size > 1) return BOTH_SPOUSES;
  const codes = [...DEATH_OR_PROHIBITED_CODES, EXCESS_CONTRIBUTION_CODE];
  return distributions.some((row) => codes.includes(distributionCode(row)))
    ? NOT_MODELED_CODE
    : undefined;
}

/* Lines 13a and 13b from line 12 (the worksheet when part of line 12 is subject to the tax). */
function additionalTaxLines(
  inputs: ResolverInputs,
  distributions: ReadonlyArray<HsaDistributionFactValue>,
  line12: number | undefined,
): { lines: Form8853Lines; required: Record<string, unknown> } {
  if (line12 === undefined || line12 === 0) return { lines: {}, required: {} };
  const keys = MEDICARE_ADVANTAGE_MSA_KEYS;
  const stated = numberAnswer(inputs.facts, keys.exceptedTaxableDistributions);
  const rule = medicareAdvantageExceptionRule(distributions);
  const excepted = exceptedPart(line12, stated, rule);
  const required: Record<string, unknown> =
    rule.rule === "ask" ? { [keys.exceptedTaxableDistributions]: stated } : {};
  if (excepted === undefined) return { lines: {}, required };
  const base = additionalTaxBase(line12, excepted);
  const valueEndOf2024 = numberAnswer(inputs.facts, keys.valueEndOf2024);
  const annualDeductible = numberAnswer(inputs.facts, keys.annualDeductible);
  if (base.subject > 0) required[keys.valueEndOf2024] = valueEndOf2024;
  if (base.subject > 0 && (valueEndOf2024 ?? 0) > 0)
    required[keys.annualDeductible] = annualDeductible;
  const worksheet = additional50TaxWorksheet({
    subject: base.subject,
    valueEndOf2024,
    annualDeductible,
  });
  return {
    lines: {
      "0.line.13a_exception_additional_50_tax": base.exceptionBox,
      "0.line.13b_additional_50_tax": worksheet?.line7,
    },
    required,
  };
}

export function sectionB(
  inputs: ResolverInputs,
  distributions: HsaDistributionFactValue[],
): SectionResult {
  if (distributions.length === 0) return { lines: {}, required: {}, holders: [] };
  const holders = distributions.map(holderOf);
  const gap = gapOf(distributions);
  if (gap !== undefined) {
    return {
      lines: Object.fromEntries(SECTION_B_FIELDS.map((field) => [field, unsupported(gap)])),
      required: {},
      holders,
    };
  }
  const line10 = distributionLines(distributions.map((row) => row.box1)).gross;
  const medical = numberAnswer(inputs.facts, MEDICARE_ADVANTAGE_MSA_KEYS.qualifiedMedicalExpenses);
  const needsMedical = line10 > 0;
  const line12 = !needsMedical
    ? 0
    : medical === undefined
      ? undefined
      : taxableDistributions(line10, medical);
  const tax = additionalTaxLines(inputs, distributions, line12);
  const expected: Array<keyof Form8853Lines> = [
    "0.line.12_taxable_medicare_advantage_distributions",
  ];
  if (line12 !== 0) expected.push("0.line.13b_additional_50_tax");
  return {
    expected,
    lines: {
      "0.line.10_total_medicare_advantage_distributions": line10,
      "0.line.11_medicare_advantage_medical_expenses": needsMedical
        ? roundDollars(medical)
        : undefined,
      "0.line.12_taxable_medicare_advantage_distributions": line12,
      ...tax.lines,
    },
    required: {
      ...(needsMedical ? { [MEDICARE_ADVANTAGE_MSA_KEYS.qualifiedMedicalExpenses]: medical } : {}),
      ...tax.required,
    },
    holders,
  };
}
