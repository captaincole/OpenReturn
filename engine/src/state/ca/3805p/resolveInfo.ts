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

interface EarlyRow {
  key: string;
  owner: EarlyDistributionOwner;
  /* The amount included in income, the 1040's rule; undefined while undetermined. */
  taxable: number | undefined;
  simpleIra: boolean;
}

function earlyRows(distributions: TaxFactRow[]): EarlyRow[] {
  const rows: EarlyRow[] = [];
  for (const fact of distributions) {
    const parsed = parseRetirementDistributionFact(fact);
    if (!parsed) continue;
    const { box7, owner } = parsed.distribution;
    if (!EARLY_NO_EXCEPTION_CODES.some((code) => box7.includes(code))) continue;
    rows.push({
      key: fact.key,
      owner: owner ?? "taxpayer",
      taxable: rowTaxable(parsed.distribution),
      simpleIra: box7.includes(SIMPLE_IRA_CODE),
    });
  }
  return rows;
}

/*
 * Blank while a row's taxable amount is undetermined (box 2a blank, "taxable
 * amount not determined"): the 1040 leaves that row's line 4b or 5b open too,
 * and the engine never takes an unknown for 0.
 */
function amountOf(rows: EarlyRow[]): number | undefined {
  if (rows.some((row) => row.taxable === undefined)) return undefined;
  return sum(...rows.map((row) => row.taxable ?? 0));
}

/*
 * MANUAL EDIT: the form is per person (ca-3805p-inst-2025::sec::b-who-must-file::b03,
 * "Each spouse/RDP must complete a separate form FTB 3805P"). When both spouses
 * took an early distribution two forms are needed, which the engine does not
 * model: the amounts stay blank, so Form 540 line 63 waits instead of carrying
 * one combined, nameless form.
 */
export function resolve3805pInfo(inputs: ResolverInputs): Form3805pFilingInfo {
  const distributions = factsInCategory(inputs, "retirement") as TaxFactRow[];
  const rows = earlyRows(distributions);
  const owners = [...new Set(rows.map((row) => row.owner))];
  const onePerson = owners.length === 1;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3805p",
    fallbacks: [
      {
        rule: `fallback: ${rows.length} early distribution(s) with no exception code`,
        value: rows.length > 0,
        triggeredByFactKeys: rows.map((row) => row.key),
      },
    ],
  });
  return {
    mustFile: { "form-3805p": resolution },
    earlyDistributionsInIncome: onePerson ? amountOf(rows) : undefined,
    simpleIraEarlyDistributions: onePerson
      ? amountOf(rows.filter((row) => row.simpleIra))
      : undefined,
    earlyDistributionOwner: onePerson ? owners[0] : undefined,
  };
}
