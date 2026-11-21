/* Section A, Archer MSAs: Part I (contributions) and Part II (distributions). */

import {
  ARCHER_MSA_KEYS,
  archerMsaCoverage,
  isW2FactKey,
  numberAnswer,
  type ArcherMsaCoveragePeriod,
  type HsaDistributionFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import {
  archerExceptionRule,
  DEATH_OR_PROHIBITED_CODES,
  distributionCode,
  exceptedPart,
  holderOf,
  type AccountHolder,
} from "./exceptions.js";
import type { Form8853Lines } from "./filingInfo.js";
import {
  additional20Tax,
  additionalTaxBase,
  distributionLines,
  line3Limitation,
  MFS_FAMILY_DEFAULT_SHARE,
  MONTHS_IN_YEAR,
  partI,
  taxableDistributions,
} from "./lines.js";

export interface SectionResult {
  lines: Form8853Lines;
  /* Answers the lines read: a key whose value is undefined is missing. */
  required: Record<string, unknown>;
  holders: AccountHolder[];
  /* The lines another form takes that apply here: blank among them means "waits". */
  expected?: Array<keyof Form8853Lines>;
  /* Line 9b's base: the part of line 8 that meets no exception. */
  subjectToTax?: number;
  /* Part I is only the spouse's self-only Archer MSA, which leaves the taxpayer's HSA limit alone. */
  spouseSelfOnly?: boolean;
}

/* W-2 box 12 code R: employer contributions to an Archer MSA (irs-8853-inst-2025::sec::line-1::b01). */
const EMPLOYER_ARCHER_CODE = "R";

function employerContributions(inputs: ResolverInputs): {
  total?: number;
  holders: AccountHolder[];
} {
  let total: number | undefined;
  const holders: AccountHolder[] = [];
  for (const row of factsInCategory(inputs, "wages").filter((fact) => isW2FactKey(fact.key))) {
    const w2 = row.value as W2FactValue;
    const amounts = (w2.box12 ?? [])
      .filter((entry) => entry.code.toUpperCase() === EMPLOYER_ARCHER_CODE)
      .map((entry) => entry.amount);
    if (amounts.length === 0) continue;
    total = sum(total, ...amounts);
    holders.push(w2Owner(inputs, w2) ?? "taxpayer");
  }
  return { total, holders };
}

const PART_I_FIELDS = [
  "0.line.1_employer_contributions",
  "0.line.2_archer_msa_contributions",
  "0.line.3_limitation",
  "0.line.4_compensation",
  "0.line.5_archer_msa_deduction",
] as const;

const BOTH_SPOUSES =
  "Both spouses have Archer MSA coverage: the instructions call for a statement Part I for each spouse, or one family plan (irs-8853-inst-2025::sec::how-to-complete-part-i::b01, case 2), which the engine does not model.";
const BAD_MONTHS =
  "The Archer MSA coverage periods count more than 12 months, or a negative month, so the Line 3 chart cannot be figured.";

const hasFamily = (periods: ReadonlyArray<ArcherMsaCoveragePeriod>) =>
  periods.some((period) => period.coverage === "family");

/*
 * Both spouses with self-only plans, one of them funded by an employer, is
 * the two-statement case too: the employer bars only its own employee's
 * deduction (irs-8853-inst-2025::sec::employer-contributions-to-an-archer-msa::b01).
 * With family coverage an employer contribution bars both, so line 5 is -0-.
 */
function coverageGap(
  periods: ReadonlyArray<ArcherMsaCoveragePeriod>,
  employerHolders: ReadonlyArray<AccountHolder>,
): string | undefined {
  const owners = new Set(periods.map((period) => period.owner ?? "taxpayer"));
  if (owners.size > 1) return BOTH_SPOUSES;
  const otherSpouseFunded = employerHolders.some((holder) => !owners.has(holder));
  if (otherSpouseFunded && !hasFamily(periods)) return BOTH_SPOUSES;
  const months = periods.map((period) => period.months);
  if (months.some((count) => count < 0) || sum(...months) > MONTHS_IN_YEAR) return BAD_MONTHS;
  return undefined;
}

/* Married filing separately with family coverage: one-half of 75% unless the spouses agree otherwise. */
function familyShare(inputs: ResolverInputs, periods: ReadonlyArray<ArcherMsaCoveragePeriod>) {
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  if (!separate || !hasFamily(periods)) return undefined;
  return numberAnswer(inputs.facts, ARCHER_MSA_KEYS.familyLimitShare) ?? MFS_FAMILY_DEFAULT_SHARE;
}

function partILines(inputs: ResolverInputs): SectionResult {
  const employer = employerContributions(inputs);
  const own = numberAnswer(inputs.facts, ARCHER_MSA_KEYS.ownContributions);
  const periods = archerMsaCoverage(inputs.facts);
  if (employer.total === undefined && own === undefined && periods === undefined) {
    return { lines: {}, required: {}, holders: [] };
  }
  const holders = [
    ...employer.holders,
    ...(periods ?? []).map((period) => period.owner ?? "taxpayer"),
  ];
  const gap = periods === undefined ? undefined : coverageGap(periods, employer.holders);
  if (gap !== undefined) {
    const lines = Object.fromEntries(PART_I_FIELDS.map((field) => [field, unsupported(gap)]));
    return { lines, required: {}, holders };
  }
  const barred = (employer.total ?? 0) > 0;
  const compensation = numberAnswer(inputs.facts, ARCHER_MSA_KEYS.compensation);
  const result = partI({
    employerContributions: employer.total,
    ownContributions: own,
    limitation:
      periods === undefined ? undefined : line3Limitation(periods, familyShare(inputs, periods)),
    compensation,
  });
  return {
    expected: ["0.line.2_archer_msa_contributions", "0.line.5_archer_msa_deduction"],
    lines: {
      "0.line.1_employer_contributions": result.line1,
      "0.line.2_archer_msa_contributions": result.line2,
      "0.line.3_limitation": result.line3,
      "0.line.4_compensation": result.line4,
      "0.line.5_archer_msa_deduction": result.line5,
    },
    required: {
      [ARCHER_MSA_KEYS.ownContributions]: own,
      ...(barred
        ? {}
        : { [ARCHER_MSA_KEYS.coverage]: periods, [ARCHER_MSA_KEYS.compensation]: compensation }),
    },
    holders,
    spouseSelfOnly:
      periods !== undefined &&
      !hasFamily(periods) &&
      holders.every((holder) => holder === "spouse"),
  };
}

const PART_II_FIELDS = [
  "0.line.6a_total_archer_msa_distributions",
  "0.line.6b_rollovers_excess_withdrawn",
  "0.line.6c_net_distributions",
  "0.line.7_archer_qualified_medical_expenses",
  "0.line.8_taxable_archer_msa_distributions",
  "0.line.9a_exception_additional_20_tax",
  "0.line.9b_additional_20_tax",
] as const;

export const DEATH_OR_PROHIBITED =
  "A 1099-SA shows distribution code 4, 5 or 6 (death of the account holder, or a prohibited transaction): the fair market value rules for those (irs-8853-inst-2025::sec::death-of-account-holder::b01, ::deemed-distributions-from-archer-msas::b01) are not modeled.";

export const dobOf =
  (inputs: ResolverInputs) =>
  (holder: AccountHolder): string | undefined => {
    const value = inputs.factByKey.get(
      holder === "spouse" ? "identity.spouse.dob" : "identity.dob",
    );
    return typeof value === "string" ? value : undefined;
  };

/* Lines 9a and 9b from line 8. */
function additionalTaxLines(
  inputs: ResolverInputs,
  distributions: ReadonlyArray<HsaDistributionFactValue>,
  line8: number | undefined,
): { lines: Form8853Lines; required: Record<string, unknown>; subject?: number } {
  if (line8 === undefined || line8 === 0) return { lines: {}, required: {} };
  const stated = numberAnswer(inputs.facts, ARCHER_MSA_KEYS.exceptedTaxableDistributions);
  const rule = archerExceptionRule(distributions, dobOf(inputs));
  if (stated === undefined && rule.rule === "waits") {
    return { lines: {}, required: { [rule.dobKey]: undefined } };
  }
  const excepted = exceptedPart(line8, stated, rule);
  const required =
    rule.rule === "ask" ? { [ARCHER_MSA_KEYS.exceptedTaxableDistributions]: stated } : {};
  if (excepted === undefined) return { lines: {}, required };
  const base = additionalTaxBase(line8, excepted);
  return {
    lines: {
      "0.line.9a_exception_additional_20_tax": base.exceptionBox,
      "0.line.9b_additional_20_tax": additional20Tax(base.subject),
    },
    required,
    subject: base.subject,
  };
}

function partIILines(inputs: ResolverInputs, archer: HsaDistributionFactValue[]): SectionResult {
  if (archer.length === 0) return { lines: {}, required: {}, holders: [] };
  const holders = archer.map(holderOf);
  if (archer.some((row) => DEATH_OR_PROHIBITED_CODES.includes(distributionCode(row)))) {
    const lines = Object.fromEntries(
      PART_II_FIELDS.map((field) => [field, unsupported(DEATH_OR_PROHIBITED)]),
    );
    return { lines, required: {}, holders };
  }
  const rolled = numberAnswer(inputs.facts, ARCHER_MSA_KEYS.rolledOverOrExcessWithdrawn);
  const lines6 = distributionLines(
    archer.map((row) => row.box1),
    rolled,
  );
  const medical = numberAnswer(inputs.facts, ARCHER_MSA_KEYS.qualifiedMedicalExpenses);
  const needsMedical = lines6.net > 0;
  const line8 = !needsMedical
    ? 0
    : medical === undefined
      ? undefined
      : taxableDistributions(lines6.net, medical);
  const tax = additionalTaxLines(inputs, archer, line8);
  const expected: Array<keyof Form8853Lines> = ["0.line.8_taxable_archer_msa_distributions"];
  if (line8 !== 0) expected.push("0.line.9b_additional_20_tax");
  return {
    expected,
    subjectToTax: tax.subject,
    lines: {
      "0.line.6a_total_archer_msa_distributions": lines6.gross,
      "0.line.6b_rollovers_excess_withdrawn": lines6.rolledOver,
      "0.line.6c_net_distributions": lines6.net,
      "0.line.7_archer_qualified_medical_expenses": needsMedical
        ? roundDollars(medical)
        : undefined,
      "0.line.8_taxable_archer_msa_distributions": line8,
      ...tax.lines,
    },
    required: {
      ...(needsMedical ? { [ARCHER_MSA_KEYS.qualifiedMedicalExpenses]: medical } : {}),
      ...tax.required,
    },
    holders,
  };
}

export function sectionA(
  inputs: ResolverInputs,
  archer: HsaDistributionFactValue[],
): SectionResult {
  const one = partILines(inputs);
  const two = partIILines(inputs, archer);
  return {
    lines: { ...one.lines, ...two.lines },
    required: { ...one.required, ...two.required },
    holders: [...one.holders, ...two.holders],
    expected: [...(one.expected ?? []), ...(two.expected ?? [])],
    subjectToTax: two.subjectToTax,
    spouseSelfOnly: one.spouseSelfOnly,
  };
}
