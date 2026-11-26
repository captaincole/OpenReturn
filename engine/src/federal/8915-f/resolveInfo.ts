import { readTraditionalIraFact, type IraOwner } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { IraHolder } from "../8606/filingInfo.js";
import { form8606Filers } from "../8606/resolveInfo.js";
import { isRothOnForm8606 } from "./designations.js";
import { MUST_FILE_8915_F_KEY, figureForms, type Form8915FFigure } from "./figure.js";
import type { Form8915FCopy, Form8915FFilingInfo } from "./filingInfo.js";
import type { FromForm8606Kinds } from "./partIII.js";
import { earlyDistributionExclusions, returnTotals } from "./returnTotals.js";

const MUST_FILE_KEY = MUST_FILE_8915_F_KEY;

/* Item C has six places; the Part I table two (more with a statement); the Part IV table two. */
const ITEM_C_PLACES = 6;
const TABLE_ROWS = 2;

const ITEM_C_GAP =
  "More than six disasters: item C has six places and the instructions give no rule for more.";
const STATEMENT_GAP =
  "More than two Part I disasters: the box asks for a statement that lists each one (part-i-total-distributions-from-all::b01), and the engine writes no statements.";
const PART_IV_TABLE_GAP =
  "More than two Part IV disasters: the table has two rows and the instructions give no rule for more.";
const SAME_YEAR_GAP =
  "Two Form 8915-F facts for one person and one item B year: the disasters of a year go on one form.";
const TWO_PART_I_GAP =
  "One person completes Part I, or Parts I and IV, on more than one Form 8915-F: the later form's available distributions are what the earlier form leaves (section-601-of-the-secure-2-0-act-of-2022::b02–b03, line-7::b02–b03), which the engine does not figure.";
const FORM_8606_GAP =
  "Lines 18 and 19 read Form 8606, and the engine figures them for one Form 8915-F on the return whose owner has the first Form 8606.";
const HOME_PURCHASE_8606_GAP =
  "A Part IV distribution from an IRA reported on Form 8606: Form 8606 leaves out the part repaid (irs-8606-inst-2025::sec::line-7::b02, line-19::b02), which the engine does not do.";
const INDIRECT_ROLLOVER_GAP =
  "A traditional IRA qualified disaster distribution next to an indirect rollover of the same person: the engine does not tell which distribution was rolled over.";

/* Line 17: the Part I distributions Form 8606 takes. */
function onForm8606(figure: Form8915FFigure, holder: IraHolder | undefined): FromForm8606Kinds {
  const partI = figure.partI;
  const qualified = (pick: (index: number) => boolean) =>
    partI?.pieces.some((_, index) => pick(index) && partI.qualified[index] > 0) === true;
  return {
    traditional:
      holder?.partI === true && qualified((index) => partI?.pieces[index].line === "traditional"),
    roth: qualified((index) => partI !== undefined && isRothOnForm8606(partI.pieces[index])),
  };
}

/* A gap of one form against Form 8606 and the IRA answers. */
function copyGap(
  inputs: ResolverInputs,
  figure: Form8915FFigure,
  holder: IraHolder | undefined,
): string | undefined {
  const homeIra = figure.partIV?.pieces.filter((piece) => piece.line !== "plan") ?? [];
  if (homeIra.some((piece) => piece.line === "roth" || holder?.partI === true))
    return HOME_PURCHASE_8606_GAP;
  const traditional = figure.partI?.pieces.some((piece) => piece.line === "traditional") ?? false;
  const rolledOver = readTraditionalIraFact(inputs.factByKey, figure.owner)?.rolledOver ?? 0;
  return traditional && rolledOver > 0 ? INDIRECT_ROLLOVER_GAP : undefined;
}

function printGaps(figure: Form8915FFigure): Form8915FCopy["printGaps"] {
  return {
    itemC: figure.disasters.length > ITEM_C_PLACES ? ITEM_C_GAP : undefined,
    partIStatement: (figure.partI?.disasters.length ?? 0) > TABLE_ROWS ? STATEMENT_GAP : undefined,
    partIVTable:
      (figure.partIV?.disasters.length ?? 0) > TABLE_ROWS ? PART_IV_TABLE_GAP : undefined,
  };
}

/* The checks across the forms of the return. */
function returnGap(copies: readonly Form8915FCopy[], filers: readonly IraHolder[]) {
  const owners: IraOwner[] = ["taxpayer", "spouse"];
  for (const owner of owners) {
    const own = copies.filter((copy) => copy.figure.owner === owner).map((copy) => copy.figure);
    const years = new Set(own.map((figure) => figure.disasterYear));
    if (years.size < own.length) return SAME_YEAR_GAP;
    const withPartI = own.filter((figure) => figure.partI !== undefined);
    const withPartIV = own.filter((figure) => figure.partIV !== undefined);
    const mixed = withPartI.some((figure) => withPartIV.some((other) => other !== figure));
    if (withPartI.length > 1 || mixed) return TWO_PART_I_GAP;
  }
  const reads8606 = copies.filter((copy) => copy.onForm8606.traditional || copy.onForm8606.roth);
  if (reads8606.length === 0) return undefined;
  const supported = copies.length === 1 && filers[0]?.owner === copies[0].figure.owner;
  return supported ? undefined : FORM_8606_GAP;
}

/*
 * Who files (irs-8915f-inst-2025::sec::who-must-file::b01): a qualified
 * disaster distribution or a qualified distribution this year, income this
 * year from a distribution spread over 3 years, or a repayment. A fact the
 * engine cannot figure files the form too, so its gap shows. The explicit
 * decision still wins.
 */
export function resolve8915FInfo(inputs: ResolverInputs): Form8915FFilingInfo {
  const results = figureForms(inputs);
  const filed = results.filter((result) => !("figure" in result) || result.figure.files);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${filed.length} Form 8915-F fact(s) with a distribution, income spread from an earlier year, or a repayment`,
        value: filed.length > 0,
        triggeredByFactKeys: filed.map((result) =>
          "figure" in result ? result.figure.key : result.key,
        ),
      },
    ],
  });
  const info: Form8915FFilingInfo = { mustFile: { "form-8915-f": mustFile } };
  if (mustFile.value !== true || filed.length === 0) return info;
  const filers = form8606Filers(inputs);
  const holderOf = (owner: IraOwner) => filers.find((holder) => holder.owner === owner);
  const factGap = filed.find((result) => !("figure" in result));
  const copies: Form8915FCopy[] = filed.flatMap((result) =>
    "figure" in result
      ? [
          {
            figure: result.figure,
            onForm8606: onForm8606(result.figure, holderOf(result.figure.owner)),
            printGaps: printGaps(result.figure),
          },
        ]
      : [],
  );
  const gap =
    (factGap && "gap" in factGap ? factGap.gap : undefined) ??
    copies.map((copy) => copyGap(inputs, copy.figure, holderOf(copy.figure.owner))).find(Boolean) ??
    returnGap(copies, filers);
  return {
    ...info,
    form8915FCopies: copies,
    form8915FGap: gap,
    form8915FReturn: gap ? { gap, ira: ZERO, pension: ZERO } : returnTotals(copies),
  };
}

const ZERO = { takenFromRows: 0, income: 0 };

/* Form 5329 line 1: the part of each 1099-R that the filed Forms 8915-F leave off, by fact key. */
export function form8915FExclusions(inputs: ResolverInputs): Map<string, number> {
  return earlyDistributionExclusions(resolve8915FInfo(inputs).form8915FCopies ?? []);
}
