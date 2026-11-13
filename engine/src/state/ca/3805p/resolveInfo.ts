import {
  parseRetirementDistributionFact,
  readRothIraFact,
  readTraditionalIraFact,
  type RetirementDistributionFactValue,
} from "../../../facts/index.js";
import type { TaxFactRow } from "../../../facts/rows.js";
import { rowTaxable, traditionalTaxable } from "../../../federal/1040/resolveInfo.js";
import { partIIIFigures } from "../../../federal/8606/partIII.js";
import { form8606Filers } from "../../../federal/8606/resolveInfo.js";
import { sum } from "../../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { EarlyDistributionOwner, Form3805pFilingInfo } from "./filingInfo.js";

/*
 * ca-3805p-inst-2025::sec::b-who-must-file::b01 and ::b02: file when an early
 * taxable distribution from a qualified plan shows a box 7 code other than 2, 3
 * or 4 (those codes claim an exception; a rollover, codes G and H, is not an early
 * distribution), and not when the taxable part was all rolled over within 60
 * days. Code 1 is "early distribution, no known exception" (with a second
 * letter too: 1B, 1D, 1L…); S is a SIMPLE IRA in its first two years. Code J
 * (early Roth IRA) takes line 1 from Form 8606 line 19
 * (::sec::line-1-early-distributions-included-in-income::b05); rothEarlyAmount
 * says how much of it counts.
 */
const EARLY_NO_EXCEPTION_CODES = ["1", "S", "J"];
const ROTH_IRA_EARLY_CODE = "J";
const SIMPLE_IRA_CODE = "S";

interface EarlyRow {
  key: string;
  owner: EarlyDistributionOwner;
  distribution: RetirementDistributionFactValue;
}

const ownerOf = (distribution: RetirementDistributionFactValue): EarlyDistributionOwner =>
  distribution.owner ?? "taxpayer";

function parsedDistributions(distributions: TaxFactRow[]): RetirementDistributionFactValue[] {
  return distributions
    .map((fact) => parseRetirementDistributionFact(fact)?.distribution)
    .filter((row): row is RetirementDistributionFactValue => row !== undefined);
}

function earlyRows(distributions: TaxFactRow[]): EarlyRow[] {
  const rows: EarlyRow[] = [];
  for (const fact of distributions) {
    const parsed = parseRetirementDistributionFact(fact);
    if (!parsed) continue;
    const { box7 } = parsed.distribution;
    if (!EARLY_NO_EXCEPTION_CODES.some((code) => box7.includes(code))) continue;
    rows.push({
      key: fact.key,
      owner: ownerOf(parsed.distribution),
      distribution: parsed.distribution,
    });
  }
  return rows;
}

/*
 * Line 1 is the amount included in income (::sec::line-1-early-distributions-included-in-income::b01),
 * the 1040's rule. A pension or plan row takes its taxable amount. IRA rows
 * follow 1040 line 4b: an indirect rollover (the traditional IRA fact's
 * `rolledOver`) comes off their taxable total, and a Form 8606 Part I filer
 * recovers basis on that form, which the engine leaves to the 1040: blank here.
 * When the person also has IRA rows that are not early, the rollover cannot be
 * split between them: blank. Blank, too, while any row's taxable amount is
 * undetermined (box 2a blank, "taxable amount not determined"), as on the 1040.
 */
function amountIncludedInIncome(
  inputs: ResolverInputs,
  owner: EarlyDistributionOwner,
  rows: EarlyRow[],
  allIraRowsOfOwner: RetirementDistributionFactValue[],
): number | undefined {
  const roth = rows.filter((row) => row.distribution.box7.includes(ROTH_IRA_EARLY_CODE));
  if (roth.length > 0 && rothEarlyAmount(inputs, owner, roth) === undefined) return undefined;
  const plan = rows
    .filter((row) => !row.distribution.box7.includes(ROTH_IRA_EARLY_CODE))
    .filter((row) => !row.distribution.box7IraSepSimple)
    .map((row) => rowTaxable(row.distribution));
  if (plan.includes(undefined)) return undefined;
  const iraRows = rows.filter(
    (row) =>
      row.distribution.box7IraSepSimple && !row.distribution.box7.includes(ROTH_IRA_EARLY_CODE),
  );
  if (iraRows.length === 0) return sum(...plan);
  if (form8606Filers(inputs).some((holder) => holder.owner === owner && holder.partI)) {
    return undefined;
  }
  if (allIraRowsOfOwner.length !== iraRows.length) return undefined;
  const rolledOver = readTraditionalIraFact(inputs.factByKey, owner)?.rolledOver ?? 0;
  const ira = traditionalTaxable(
    iraRows.map((row) => row.distribution),
    rolledOver,
  );
  return ira === undefined ? undefined : sum(...plan, ira);
}

/*
 * MANUAL EDIT: an early Roth IRA distribution (code J). Line 1 takes Form 8606
 * line 19 allocated in order: first to line 20 and to the basis in regular
 * contributions (line 22), which are not subject to the tax, then to amounts
 * that are (::line-1-early-distributions-included-in-income::b06–b07). When line 23
 * is 0, all of line 19 went to line 20 and line 22, so line 1 takes nothing.
 * Otherwise the allocation needs earlier years' Pub. 1005 worksheets, which no
 * fact gives: undefined.
 */
function rothEarlyAmount(
  inputs: ResolverInputs,
  owner: EarlyDistributionOwner,
  rows: EarlyRow[],
): number | undefined {
  const answers = readRothIraFact(inputs.factByKey, owner);
  if (!answers) return undefined;
  const line23 = partIIIFigures(
    rows.map((row) => row.distribution),
    answers,
  ).line23;
  return line23 === 0 ? 0 : undefined;
}

/*
 * MANUAL EDIT: the form is per person (ca-3805p-inst-2025::sec::b-who-must-file::b03,
 * "Each spouse/RDP must complete a separate form FTB 3805P"). When both spouses
 * took an early distribution two forms are needed, which the engine does not
 * model: the amounts stay blank, so Form 540 line 64 waits instead of carrying
 * one combined, nameless form.
 */
export function resolve3805pInfo(inputs: ResolverInputs): Form3805pFilingInfo {
  const distributions = factsInCategory(inputs, "retirement") as TaxFactRow[];
  const rows = earlyRows(distributions);
  const owners = [...new Set(rows.map((row) => row.owner))];
  const owner = owners.length === 1 ? owners[0] : undefined;
  const allIraRowsOfOwner = parsedDistributions(distributions).filter(
    (row) => row.box7IraSepSimple && ownerOf(row) === owner,
  );
  const amount =
    owner === undefined
      ? undefined
      : amountIncludedInIncome(inputs, owner, rows, allIraRowsOfOwner);
  const simpleIraAmount = rows
    .filter((row) => row.distribution.box7.includes(SIMPLE_IRA_CODE))
    .map((row) => rowTaxable(row.distribution));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3805p",
    fallbacks: [
      {
        rule: `fallback: ${rows.length} early distribution(s) with no exception code, $${amount ?? "?"} included in income`,
        /* A full rollover leaves nothing in income: no form (::b02). Unknown amounts keep the form, and wait. */
        value: rows.length > 0 && (amount === undefined || amount > 0),
        triggeredByFactKeys: rows.map((row) => row.key),
      },
    ],
  });
  return {
    mustFile: { "form-3805p": resolution },
    earlyDistributionsInIncome: amount,
    simpleIraEarlyDistributions:
      amount === undefined || simpleIraAmount.includes(undefined)
        ? undefined
        : Math.min(amount, sum(...simpleIraAmount)),
    earlyDistributionOwner: owner,
  };
}
