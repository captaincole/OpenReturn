import { parseRetirementDistributionFact } from "../../../facts/index.js";
import type { TaxFactRow } from "../../../facts/rows.js";
import { rowTaxable } from "../../../federal/1040/resolveInfo.js";
import { sum } from "../../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { EarlyDistributionOwner, Form3805pFilingInfo } from "./filingInfo.js";

/*
 * ca-3805p-inst-2025::sec::b-who-must-file::b01 and ::b02: file when an early
 * taxable distribution from a qualified plan shows a box 7 code other than 2, 3
 * or 4 (those codes claim an exception; a rollover, codes G and H, is not an early
 * distribution). Code 1 is "early distribution, no known exception" (with a
 * second letter too: 1B, 1D, 1L…); S is a SIMPLE IRA in its first two years.
 * Code J (early Roth IRA) takes line 1 from Form 8606 line 19
 * (::sec::line-1-early-distributions-included-in-income::b05), which the engine
 * does not compute: a code J distribution is not counted here.
 */
const EARLY_NO_EXCEPTION_CODES = ["1", "S"];
const SIMPLE_IRA_CODE = "S";

/* Line 1 is the amount included in income: the same taxable amount the 1040 uses. */
function earlyTaxableAmount(fact: TaxFactRow, onlyCode?: string): number {
  const parsed = parseRetirementDistributionFact(fact);
  if (!parsed) return 0;
  const { box7 } = parsed.distribution;
  const codes = onlyCode === undefined ? EARLY_NO_EXCEPTION_CODES : [onlyCode];
  const early = codes.some((code) => box7.includes(code));
  return early ? (rowTaxable(parsed.distribution) ?? 0) : 0;
}

/*
 * MANUAL EDIT: the form is per person (ca-3805p-inst-2025::sec::b-who-must-file::b03,
 * "Each spouse/RDP must complete a separate form FTB 3805P"). The owner is set
 * when every early distribution belongs to one person; a 1099-R without an
 * owner is the taxpayer's. Two owners need two forms, so the owner stays unset.
 */
function earlyDistributionOwner(distributions: TaxFactRow[]): EarlyDistributionOwner | undefined {
  const owners = new Set<EarlyDistributionOwner>();
  for (const fact of distributions) {
    if (earlyTaxableAmount(fact) <= 0) continue;
    owners.add(parseRetirementDistributionFact(fact)?.distribution.owner ?? "taxpayer");
  }
  if (owners.size !== 1) return undefined;
  return [...owners][0];
}

export function resolve3805pInfo(inputs: ResolverInputs): Form3805pFilingInfo {
  const distributions = factsInCategory(inputs, "retirement") as TaxFactRow[];
  const earlyDistributionsInIncome = sum(...distributions.map((fact) => earlyTaxableAmount(fact)));
  const simpleIraEarlyDistributions = sum(
    ...distributions.map((fact) => earlyTaxableAmount(fact, SIMPLE_IRA_CODE)),
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3805p",
    fallbacks: [
      {
        rule: `fallback: $${earlyDistributionsInIncome} of taxable early distributions with no exception code`,
        value: earlyDistributionsInIncome > 0,
        triggeredByFactKeys: distributions.map((fact) => fact.key),
      },
    ],
  });
  return {
    mustFile: { "form-3805p": resolution },
    earlyDistributionsInIncome,
    simpleIraEarlyDistributions,
    earlyDistributionOwner: earlyDistributionOwner(distributions),
  };
}
