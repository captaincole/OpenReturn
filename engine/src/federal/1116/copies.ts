/*
 * Every Form 1116 of the return at once: one copy for each category, with the
 * line 16 allocation between them and Part IV on the summary copy. A line is a
 * number, blank (undefined: nothing applies, or it waits for an answer), or a
 * gap (unsupported), and a gap carries to every line that reads it.
 */

import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { formGap } from "../461/figures.js";
import type {
  ForeignTaxInfo,
  Form1116Category,
  Form1116CategoryInfo,
  Form1116FilingInfo,
} from "./filingInfo.js";
import { limitationOf, type Limitation } from "./limitation.js";
import {
  blocker,
  isGap,
  line16Adjustments,
  partIIIValues,
  partIVLines,
  type PartIVLines,
  type Value,
} from "./lines.js";
import {
  INTEREST_ALLOCATION_LIMIT,
  groupByCountry,
  isHighTaxed,
  partIColumn,
  partIIRow,
  type PartIColumn,
  type PartIIRow,
} from "./partI.js";
import { regularTaxForCredit, type Accessor } from "./returnAmounts.js";
import type { ForeignTaxSource } from "./sources.js";

export { isGap, type Value };

export interface ColumnLines {
  country: string | undefined;
  sources: ForeignTaxSource[];
  partII: PartIIRow;
}

export interface CopyLines {
  category: Form1116Category;
  columns: ColumnLines[];
  /* The Part I columns, or why they wait or cannot be figured. */
  partI: PartIColumn[] | Unsupported | undefined;
  line1b: boolean | undefined;
  line8: number;
  line10: Value;
  line11: Value;
  line12: Value;
  line13: Value;
  line14: Value;
  line15: Value;
  line16: Value;
  line17: Value;
  line18: Value;
  line19: Value;
  line20: Value;
  line21: Value;
  line22: Value;
  line23: Value;
  line24: Value;
}

export interface Form1116Set {
  /* The summary copy (the largest line 24) first. */
  copies: CopyLines[];
  partIV: PartIVLines | Unsupported | undefined;
}

const INTEREST_GAP =
  "Gross foreign income is more than $5,000, so investment, student loan or car loan interest is apportioned by the asset method (irs-1116-inst-2025::sec::line-4b::b01), and no fact holds the assets' basis.";
const HIGH_TAX_GAP =
  "Passive foreign tax is more than the top U.S. rate on the income: it is high-taxed income, reclassified out of the passive category (irs-1116-inst-2025::sec::line-13-2::b01), which the engine does not do.";
/* Line 1b's compensation test (irs-1116-inst-2025::sec::line-1b::b01). */
export const ALTERNATIVE_BASIS_COMPENSATION = 250000;

const gapOr = (reason: string | undefined, value: Value): Value =>
  reason === undefined ? value : unsupported(reason);

function partIOf(
  each: Form1116CategoryInfo,
  columns: ColumnLines[],
  foreignTax: ForeignTaxInfo,
  limitation: Limitation | Unsupported | undefined,
): PartIColumn[] | Unsupported | undefined {
  if (foreignTax.line12Gap) return unsupported(foreignTax.line12Gap);
  if (limitation === undefined || isGap(limitation)) return limitation;
  if (foreignTax.sources.some((source) => source.grossIncome === undefined)) return undefined;
  const foreignGross = sum(...foreignTax.sources.map((source) => source.grossIncome));
  const apportions = foreignGross > INTEREST_ALLOCATION_LIMIT;
  if (apportions && limitation.amounts.otherInterestExpense > 0) return unsupported(INTEREST_GAP);
  const shared = {
    line3a: roundDollars(limitation.amounts.line3a),
    line3b: roundDollars(limitation.amounts.line3b),
    line3e: roundDollars(limitation.amounts.line3e),
    homeMortgageInterest: apportions ? limitation.amounts.homeMortgageInterest : 0,
  };
  return columns.map((column) => partIColumn(column.sources, shared, limitation.bands));
}

/* Lines 1–15 of one copy: what the category's own sources and the shared limit give. */
function draftCopy(
  each: Form1116CategoryInfo,
  foreignTax: ForeignTaxInfo,
  limitation: Limitation | Unsupported | undefined,
): CopyLines {
  const columns = groupByCountry(each.sources).map((sources) => ({
    country: sources[0]?.country,
    sources,
    partII: partIIRow(sources),
  }));
  const partI = partIOf(each, columns, foreignTax, limitation);
  const line8 = sum(...columns.map((column) => column.partII.total));
  const line10 = each.carryover === undefined ? undefined : each.carryover > 0 ? each.carryover : 0;
  const line15 = Array.isArray(partI)
    ? sum(...partI.map((column) => column.line1a)) - sum(...partI.map((column) => column.line6))
    : partI;
  const compensation = isGap(limitation) ? undefined : limitation?.amounts.compensation;
  return {
    category: each.category,
    columns,
    partI,
    line1b:
      each.sources.some((source) => source.alternativeBasisSourcing === true) &&
      compensation !== undefined &&
      compensation >= ALTERNATIVE_BASIS_COMPENSATION
        ? true
        : undefined,
    line8,
    line10,
    line11: line10 === undefined ? undefined : line8 + line10,
    line12: gapOr(foreignTax.line12Gap, 0),
    line13: undefined,
    line14: undefined,
    line15,
    line16: undefined,
    line17: undefined,
    line18: undefined,
    line19: undefined,
    line20: undefined,
    line21: undefined,
    line22: gapOr(foreignTax.line22Gap, 0),
    line23: undefined,
    line24: undefined,
  };
}

/* Line 13: blank, or a gap for every copy when a passive column is high-taxed. */
function highTaxLine(drafts: CopyLines[]): Value {
  const passive = drafts.find((draft) => draft.category === "passive");
  if (passive === undefined) return 0;
  const { partI } = passive;
  if (!Array.isArray(partI)) return partI;
  const high = partI.some((column, index) => isHighTaxed(column, passive.columns[index].partII));
  return high ? unsupported(HIGH_TAX_GAP) : 0;
}

const FORM_461_GAP =
  "Form 461 line 16 shows an excess business loss: line 16 adds back the part of it that belongs to the category (irs-1116-inst-2025::sec::line-16::b01), which the engine does not split by category.";

/*
 * Adjustment 1 of line 16, the disallowed business loss: the gap when Form 461
 * line 16 is below 0, or Form 461's own gap; undefined while it waits or with
 * no excess business loss (no adjustment).
 */
function form461Line16(form: Accessor, info: Form1116FilingInfo): Value | null {
  if (info.mustFile?.["form-461"]?.value !== true) return null;
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const line16 = numberOrBlank(form["form-461.0.line.16_excess_business_loss"]);
  if (line16 === undefined) return undefined;
  return line16 < 0 ? unsupported(FORM_461_GAP) : null;
}

/* Line 16 for each copy (lines.ts line16Adjustments), or the value that blocks them all. */
function line16Of(
  drafts: CopyLines[],
  foreignTax: ForeignTaxInfo,
  limitation: Limitation | Unsupported | undefined,
  form461: Value | null,
): Map<Form1116Category, Value> {
  const all = (value: Value) => new Map(drafts.map((draft) => [draft.category, value]));
  if (foreignTax.line16Gap) return all(unsupported(foreignTax.line16Gap));
  if (form461 !== null) return all(form461);
  const block = blocker(...drafts.map((draft) => draft.line15));
  if (block !== null) return all(block);
  if (limitation === undefined || isGap(limitation)) return all(limitation);
  const line15 = Object.fromEntries(
    drafts.map((draft) => [draft.category, draft.line15 as number]),
  );
  const adjusted = line16Adjustments(line15, limitation.line18Amount);
  return new Map(drafts.map((draft) => [draft.category, adjusted[draft.category]]));
}

/* Lines 14 and 16–24 of one copy (lines.ts partIIIValues). */
function finishCopy(
  draft: CopyLines,
  line13: Value,
  line16: Value,
  line20: Value,
  limitation: Limitation | Unsupported | undefined,
): CopyLines {
  const line18Amount =
    limitation === undefined || isGap(limitation) ? limitation : limitation.line18Amount;
  const values = partIIIValues({ ...draft, line13, line16, line18Amount, line20 });
  return { ...draft, ...values, line13, line16, line20 };
}

/* Part IV from every copy's line 24 (lines.ts partIVLines). */
function partIVOf(copies: CopyLines[], line20: Value): PartIVLines | Unsupported | undefined {
  const block = blocker(line20, ...copies.map((copy) => copy.line24));
  if (block !== null) return block;
  const line24Of = (category: Form1116Category) =>
    copies.find((copy) => copy.category === category)?.line24 as number | undefined;
  return partIVLines(line24Of("passive"), line24Of("general"), line20 as number);
}

/* "Complete Part IV on only one Form 1116 (the one with the largest amount entered on line 24)" (irs-1116-inst-2025::sec::part-iv-summary-of-separate::b01). */
function summaryFirst(copies: CopyLines[]): CopyLines[] {
  const amount = (copy: CopyLines) => (typeof copy.line24 === "number" ? copy.line24 : -1);
  return [...copies].sort((first, second) => amount(second) - amount(first));
}

export function form1116Set(
  form: Accessor,
  info: Form1116FilingInfo,
): Form1116Set | Unsupported | undefined {
  const foreignTax = info.foreignTax;
  if (foreignTax?.formGap) return unsupported(foreignTax.formGap);
  if (foreignTax === undefined || foreignTax.categories.length === 0) return undefined;
  // A K-1's foreign taxes that cannot be read, or taxes not known yet (resolveInfo.ts).
  if (foreignTax.k1Gap) return unsupported(foreignTax.k1Gap);
  if (foreignTax.taxesWaiting === true) return undefined;
  const limitation = limitationOf(form, info, foreignTax.sources);
  const drafts = foreignTax.categories.map((each) => draftCopy(each, foreignTax, limitation));
  const line13 = highTaxLine(drafts);
  const line16 = line16Of(drafts, foreignTax, limitation, form461Line16(form, info));
  const line20 = regularTaxForCredit(form, info);
  const floored = typeof line20 === "number" ? Math.max(0, line20) : line20;
  const copies = drafts.map((draft) =>
    finishCopy(draft, line13, line16.get(draft.category), floored, limitation),
  );
  return { copies: summaryFirst(copies), partIV: partIVOf(copies, floored) };
}
