/*
 * The S corporation shareholder's basis limit, figured the way Form 7203 does
 * (irs-7203-inst-2025::sec::basis-limitations::b01 to ::b05). The order is the
 * form's: stock basis at the start, plus contributions and income items, less
 * distributions, less nondeductible expenses; then the losses and deductions,
 * limited to what is left, and past stock basis to debt basis. When the basis
 * is smaller than the losses and deductions, each is allowed in proportion
 * (Part III, ::part-iii::b01, ::b02) and the rest carries to next year with
 * its character.
 *
 * figureBasis returns every Form 7203 line, so the basis stage (limits.ts) and
 * Form 7203's rules (federal/7203/) read one computation. Amounts are whole
 * dollars, the way the form prints them.
 */

import { atLeast, prorateDollars, roundDollars, sum } from "../../money.js";
import { isLossOrDeduction, roleOf, type ItemType } from "./itemTypes.js";
import {
  describeItem,
  entityTitle,
  hasCarriedBasisLoss,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";

/* The Part I line 3 rows a K-1 item can increase (3j, 3l and 3m have no item yet). */
export type IncreaseLine = "3a" | "3b" | "3c" | "3d" | "3e" | "3f" | "3g" | "3h" | "3i" | "3k";

/* The Part III rows, lines 35 to 46. */
export type PartIIILine =
  "35" | "36" | "37" | "38" | "39" | "40" | "41" | "42" | "43" | "44" | "45" | "46";

/* The Part I line an item's income goes to (irs-7203-inst-2025::sec::line-3::b01, ::line-3k::b01). */
const INCREASE_LINES: Partial<Record<ItemType, IncreaseLine>> = {
  ordinary_business_income: "3a",
  net_rental_real_estate_income: "3b",
  other_net_rental_income: "3c",
  interest: "3d",
  ordinary_dividends: "3e",
  royalties: "3f",
  net_short_term_capital_gain: "3g",
  net_long_term_capital_gain: "3g",
  net_section_1231_gain: "3h",
  other_income: "3i",
  other_portfolio_income: "3i",
  tax_exempt_interest: "3k",
  other_tax_exempt_income: "3k",
};

/* The Part III line of a loss or deduction; line 44 and line 45 split box 12's other deductions. */
function partIIILineOf(item: PassThroughItem): PartIIILine | undefined {
  if (item.type === "other_deduction") {
    return item.detail === "section_59e_expenditures" ? "44" : "45";
  }
  return PART_III_LINES[item.type];
}

const PART_III_LINES: Partial<Record<ItemType, PartIIILine>> = {
  ordinary_business_income: "35",
  net_rental_real_estate_income: "36",
  other_net_rental_income: "37",
  net_short_term_capital_gain: "38",
  net_long_term_capital_gain: "38",
  net_section_1231_gain: "39",
  other_income: "40",
  other_portfolio_income: "40",
  section_179_deduction: "41",
  charitable_contribution: "42",
  investment_interest_expense: "43",
  portfolio_deduction: "45",
  foreign_tax_paid: "46",
};

/* Items that do not move stock basis: parts of another item, and information. */
const NO_BASIS_EFFECT: ReadonlyArray<ItemType> = ["guaranteed_payments_total"];

/* One loss or deduction item in Part III: columns (a) to (e), positive amounts. */
export interface PartIIIRow {
  line: PartIIILine;
  item: PassThroughItem;
  /* Column (a): this year's amount; 0 for an item carried from an earlier year. */
  current: number;
  /* Column (b): carried from an earlier year; 0 for this year's item. */
  carriedIn: number;
  /* Column (c): allowed from stock basis. */
  fromStock: number;
  /* Column (d): allowed from debt basis. */
  fromDebt: number;
  /* Column (e): carried to next year. */
  carriedOut: number;
}

/* Part I, lines 1 to 15. */
export interface StockBasisLines {
  line1: number;
  line2: number;
  increases: Partial<Record<IncreaseLine, number>>;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8a: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line14: number;
  line15: number;
}

/* Part II, column (d) totals; the engine keeps one total for all of the loans. */
export interface DebtBasisLines {
  line16: number;
  line17: number;
  line18: number;
  line20: number;
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  line27: number;
  line28: number;
  line29: number;
  line30: number;
  line31: number;
}

export interface BasisFigures {
  stock: StockBasisLines;
  /* Undefined when the shareholder has no loans to the corporation. */
  debt?: DebtBasisLines;
  rows: PartIIIRow[];
  /* Line 6 above line 5: a capital gain (irs-7203-inst-2025::sec::line-6::b01). */
  distributionOverBasis: number;
}

/*
 * - figured: every line; gaps lists what the engine figures but cannot report
 *   (the gain of a distribution above basis), so the stage stops the K-1;
 * - waiting: a holding answer is missing;
 * - unsupported: a case the form's computation here does not handle.
 */
export type BasisOutcome =
  | { kind: "figured"; figures: BasisFigures; gaps: string[] }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

const positive = (item: PassThroughItem) => Math.abs(item.amount ?? 0);

/* A loss or deduction that Part III limits: a loss, a deduction, or foreign taxes. */
export function isPartIIIItem(item: PassThroughItem): boolean {
  if (partIIILineOf(item) === undefined) return false;
  return item.type === "foreign_tax_paid"
    ? (item.amount ?? 0) > 0
    : isLossOrDeduction(item.type, item.amount);
}

const BASIS_DECREASES: ReadonlyArray<ItemType> = ["distribution", "loan_repayment"];

/* The items the basis limit acts on: a loss, a deduction, foreign taxes, a distribution, a loan repayment. */
export const basisItems = (items: PassThroughItem[]) =>
  items.filter(
    (item) =>
      isLossOrDeduction(item.type, item.amount) ||
      isPartIIIItem(item) ||
      BASIS_DECREASES.includes(item.type),
  );

/*
 * A shareholder who disposed of stock checks column (e) and attaches the basis
 * computation (irs-1040se-inst-2025::sec::line-28::b03). Fewer shares at the
 * end of the year than at the start (Part II item H) is such a disposal.
 */
export function soldSomeShares(entity: PassThroughEntity): boolean {
  const k1 = entity.k1;
  if (k1.form !== "1120-S") return false;
  const { sharesAtStart, sharesAtEnd } = k1;
  return sharesAtStart !== undefined && sharesAtEnd !== undefined && sharesAtEnd < sharesAtStart;
}

/*
 * Who files Form 7203 (irs-7203-inst-2025::sec::who-must-file::b01): a
 * shareholder "claiming a deduction for their share of an aggregate loss ...
 * (including an aggregate loss not allowed last year because of basis
 * limitations)", or who received a non-dividend distribution, disposed of
 * stock, or received a loan repayment. Any loss or deduction item counts
 * (federal/7203/QUESTIONS.md).
 */
export function needsForm7203(entity: PassThroughEntity): boolean {
  if (entity.form !== "1120-S") return false;
  return (
    basisItems(entity.items).length > 0 ||
    hasCarriedBasisLoss(entity.holding) ||
    soldSomeShares(entity) ||
    entity.holding?.disposedOfEntirely === true ||
    entity.k1.finalK1 === true
  );
}

/* An item whose effect on stock basis the computation knows: Part I, Part III, or none. */
function basisEffectKnown(item: PassThroughItem): boolean {
  if (isPartIIIItem(item) || NO_BASIS_EFFECT.includes(item.type)) return true;
  if (item.type === "distribution" || item.type === "nondeductible_expenses") return true;
  if ((item.amount ?? 0) > 0 && INCREASE_LINES[item.type] !== undefined) return true;
  const role = roleOf(item.type);
  return role === "subset" || role === "information" || role === "payment";
}

const total = (items: PassThroughItem[], type: ItemType) =>
  roundDollars(sum(...items.filter((item) => item.type === type).map(positive)));

/* Part I line 3: each income item above 0 on its line, cents kept until the line. */
function increaseLines(items: PassThroughItem[]): Partial<Record<IncreaseLine, number>> {
  const byLine = new Map<IncreaseLine, number[]>();
  for (const item of items) {
    const line = INCREASE_LINES[item.type];
    if (line === undefined || (item.amount ?? 0) <= 0) continue;
    byLine.set(line, [...(byLine.get(line) ?? []), item.amount ?? 0]);
  }
  return Object.fromEntries(
    [...byLine].map(([line, amounts]) => [line, roundDollars(sum(...amounts))]),
  );
}

/* Part III columns (a) and (b): this year's items, then the carried ones, in line order. */
function partIIIRows(entity: PassThroughEntity): PartIIIRow[] {
  const row = (item: PassThroughItem): PartIIIRow => {
    const amount = roundDollars(positive(item));
    const carried = item.fromPriorYear === true;
    return {
      line: partIIILineOf(item) ?? "45",
      item,
      current: carried ? 0 : amount,
      carriedIn: carried ? amount : 0,
      fromStock: 0,
      fromDebt: 0,
      carriedOut: 0,
    };
  };
  const rows = [...entity.items.filter(isPartIIIItem), ...entity.priorYearItems].map(row);
  return rows.sort((first, second) => Number(first.line) - Number(second.line));
}

/* Part I lines 1 to 10, from the holding's start and the K-1's items. */
function stockBeforeLosses(start: number, contributions: number, items: PassThroughItem[]) {
  const increases = increaseLines(items);
  const line4 = sum(...Object.values(increases));
  const line5 = start + contributions + line4;
  const line6 = total(items, "distribution");
  const line7 = atLeast(0, line5 - line6);
  const line8a = total(items, "nondeductible_expenses");
  return {
    line1: start,
    line2: contributions,
    increases,
    line4,
    line5,
    line6,
    line7,
    line8a,
    line9: line8a,
    line10: line7 === 0 ? 0 : atLeast(0, line7 - line8a),
  };
}

/*
 * Columns (c) and (d) take every row's (a) plus (b) when the basis covers the
 * total, else each row's share in proportion; the shares add up to the basis.
 */
function allocate(basis: number, amounts: number[]): number[] {
  const whole = sum(...amounts);
  if (basis <= 0) return amounts.map(() => 0);
  return basis >= whole ? amounts : prorateDollars(basis, amounts);
}

/*
 * Line 23 (irs-7203-inst-2025::sec::line-23::b01, ::line-4::b01): a reduced debt
 * basis is restored by the net increase, line 4 less lines 6, 9 and 13 and less
 * line 47 columns (a) and (b), up to the face of the loan (line 16 less line 21).
 */
function restoration(stock: ReturnType<typeof stockBeforeLosses>, rows: PartIIIRow[], debt: Loans) {
  const losses = sum(...rows.map((row) => row.current + row.carriedIn));
  const netIncrease = stock.line4 - stock.line6 - stock.line9 - losses;
  const reduced = debt.line16 - debt.line21;
  return netIncrease > 0 && reduced > 0 ? Math.min(netIncrease, reduced) : 0;
}

interface Loans {
  line16: number;
  line17: number;
  line21: number;
}

/* Part II: debt basis before losses (lines 16 to 29), and the debt's share of each row. */
function debtBasis(
  stock: ReturnType<typeof stockBeforeLosses>,
  rows: PartIIIRow[],
  loans: Loans,
): { lines: Omit<DebtBasisLines, "line30" | "line31">; fromDebt: number[] } {
  const line23 = restoration(stock, rows, loans);
  const line24 = loans.line21 + loans.line17 + line23;
  const line28 = Math.min(atLeast(0, stock.line8a - stock.line7), line24);
  const line29 = atLeast(0, line24 - line28);
  const remaining = rows.map((row) => row.current + row.carriedIn - row.fromStock);
  const stockUsedUp = sum(...rows.map((row) => row.fromStock)) >= stock.line10;
  const lines = {
    ...loans,
    line18: loans.line16 + loans.line17,
    line20: loans.line16 + loans.line17,
    line22: loans.line17,
    line23,
    line24,
    line27: line24,
    line28,
    line29,
  };
  return { lines, fromDebt: stockUsedUp ? allocate(line29, remaining) : remaining.map(() => 0) };
}

/* Why the computation here cannot figure this K-1's basis, or undefined. */
function basisGap(entity: PassThroughEntity): string | undefined {
  const repaid = entity.items.filter((item) => item.type === "loan_repayment");
  if (repaid.length > 0) {
    return `${entityTitle(entity)}: ${repaid.map(describeItem).join(", ")}: a loan repayment needs Form 7203 Part II Section C (the gain on the repayment), which is not modeled.`;
  }
  const unknown = entity.items.filter((item) => !basisEffectKnown(item));
  if (unknown.length > 0) {
    return `${entityTitle(entity)}: ${unknown.map(describeItem).join(", ")}: its effect on stock basis (Form 7203) is not modeled.`;
  }
  return undefined;
}

/* The holding's loans, or the answer that is missing. */
function loansOf(entity: PassThroughEntity): Loans | "waiting" | undefined {
  const holding = entity.holding;
  const line16 = roundDollars(holding?.loanBalanceAtStart ?? 0);
  const line17 = roundDollars(holding?.newLoans ?? 0);
  const debtAtStart = holding?.debtBasisAtStart;
  if (line16 + line17 === 0 && (debtAtStart ?? 0) === 0) return undefined;
  if (debtAtStart === undefined) return "waiting";
  return { line16, line17, line21: roundDollars(debtAtStart) };
}

/* Form 7203 for one S corporation K-1: every line, or why it waits or cannot be figured. */
export function figureBasis(entity: PassThroughEntity): BasisOutcome {
  const gap = basisGap(entity);
  if (gap) return { kind: "unsupported", reason: gap };
  const start = entity.holding?.stockBasisAtStart;
  const loans = loansOf(entity);
  if (start === undefined || loans === "waiting") {
    return { kind: "waiting", factKeys: [entity.holdingKey] };
  }
  const contributions = roundDollars(entity.holding?.capitalContributions ?? 0);
  const stock = stockBeforeLosses(roundDollars(start), contributions, entity.items);
  const fromStock = allocate(
    stock.line10,
    partIIIRows(entity).map((row) => row.current + row.carriedIn),
  );
  const rows = partIIIRows(entity).map((row, index) => ({ ...row, fromStock: fromStock[index] }));
  const debt = loans && debtBasis(stock, rows, loans);
  const figured = rows.map((row, index) => {
    const fromDebt = debt?.fromDebt[index] ?? 0;
    return { ...row, fromDebt, carriedOut: row.current + row.carriedIn - row.fromStock - fromDebt };
  });
  const figures = withEndingBasis(stock, figured, debt?.lines);
  return { kind: "figured", figures, gaps: distributionGap(entity, figures) };
}

/* Lines 11 to 15, 30 and 31 once Part III is allocated. */
function withEndingBasis(
  stock: ReturnType<typeof stockBeforeLosses>,
  rows: PartIIIRow[],
  debt: Omit<DebtBasisLines, "line30" | "line31"> | undefined,
): BasisFigures {
  const line11 = sum(...rows.map((row) => row.fromStock));
  const line12 = debt?.line23 ?? 0;
  const line30 = sum(...rows.map((row) => row.fromDebt));
  return {
    stock: {
      ...stock,
      line11,
      line12,
      line14: line11 + line12,
      line15: atLeast(0, stock.line10 - line11 - line12),
    },
    debt: debt && { ...debt, line30, line31: atLeast(0, debt.line29 - line30) },
    rows,
    distributionOverBasis: atLeast(0, stock.line6 - stock.line5),
  };
}

/*
 * irs-7203-inst-2025::sec::line-6::b01: a distribution above stock basis is a
 * capital gain on Form 8949 and Schedule D (box C or F, by holding period,
 * irs-8949-inst-2025::sec::part-ii::b14). The engine adds no Form 8949 row
 * from a K-1, so the gain is a gap.
 */
function distributionGap(entity: PassThroughEntity, figures: BasisFigures): string[] {
  if (figures.distributionOverBasis <= 0) return [];
  return [
    `${entityTitle(entity)}: distributions of $${figures.stock.line6} are more than the stock basis of $${figures.stock.line5}; the $${figures.distributionOverBasis} above basis is a capital gain on Form 8949 and Schedule D, which the engine does not add from a K-1.`,
  ];
}

/* An item with its amount replaced, signed the way the K-1 prints it (a loss negative). */
export function withAmount(item: PassThroughItem, amount: number): PassThroughItem {
  const sign = roleOf(item.type) === "income" ? -1 : 1;
  return { ...item, amount: sign * amount };
}
