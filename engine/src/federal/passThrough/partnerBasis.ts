/*
 * The partner's basis limit, figured the way the Worksheet for Adjusting the
 * Basis of a Partner's Interest in the Partnership does: there is no IRS form
 * (irs-1065k1-inst-2025::sec::basis-limitations::b01). Part I: the basis at
 * the start, contributions, the change in the share of liabilities, the income
 * items, less distributions and a decrease in liabilities (lines 1 to 11).
 * Part II: nondeductible expenses (line 12), then the losses and deductions
 * (line 15), each allowed in proportion when the basis is smaller than their
 * total, the rest carried to next year with its character
 * (::part-ii-allowable-loss-and-deduction-items::b01, ::line-14::b03, ::b04).
 * Amounts are whole dollars, as Form 7203 prints them (basis.ts).
 */

import type { PartnerLiabilities } from "../../facts/index.js";
import { atLeast, prorateDollars, roundDollars, sum } from "../../money.js";
import { withAmount } from "./basis.js";
import {
  describeItem,
  entityTitle,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";
import { isLossOrDeduction, roleOf, type ItemType } from "./itemTypes.js";

/* Part I line 4: the increase line an income item goes to (::line-4::b01; the worksheet's rows). */
export type PartnerIncreaseLine =
  "4a" | "4b" | "4c" | "4d" | "4e" | "4f" | "4g" | "4h" | "4i" | "4j" | "4k" | "4l";

const INCREASE_LINES: Partial<Record<ItemType, PartnerIncreaseLine>> = {
  ordinary_business_income: "4a",
  net_rental_real_estate_income: "4b",
  other_net_rental_income: "4c",
  interest: "4d",
  ordinary_dividends: "4e",
  royalties: "4g",
  net_short_term_capital_gain: "4h",
  net_long_term_capital_gain: "4i",
  net_section_1231_gain: "4j",
  other_income: "4k",
  other_portfolio_income: "4k",
  tax_exempt_interest: "4l",
  other_tax_exempt_income: "4l",
};

/* Part II line 15: the row of each loss or deduction (irs-1065k1-inst-2025::sec::other-deductions::b01). */
export type PartnerLossLine =
  | "15a"
  | "15b"
  | "15c"
  | "15d"
  | "15e"
  | "15f"
  | "15g"
  | "15h"
  | "15i"
  | "15j"
  | "15k"
  | "15l"
  | "15m"
  | "15o"
  | "15p";

const LOSS_LINES: Partial<Record<ItemType, PartnerLossLine>> = {
  ordinary_business_income: "15a",
  net_rental_real_estate_income: "15b",
  other_net_rental_income: "15c",
  foreign_tax_paid: "15d",
  net_short_term_capital_gain: "15e",
  net_long_term_capital_gain: "15f",
  net_section_1231_gain: "15g",
  other_income: "15h",
  other_portfolio_income: "15h",
  section_179_deduction: "15i",
  charitable_contribution: "15j",
  investment_interest_expense: "15k",
  other_deduction: "15p",
};

function lossLineOf(item: PassThroughItem): PartnerLossLine | undefined {
  if (item.type === "portfolio_deduction") {
    return item.detail === "royalty_deductions" ? "15l" : "15o";
  }
  if (item.type === "other_deduction" && item.detail === "section_59e_expenditures") return "15m";
  return LOSS_LINES[item.type];
}

/* A loss or deduction line 15 limits: a loss, a deduction, or foreign taxes. */
export function isPartnerLossItem(item: PassThroughItem): boolean {
  if (lossLineOf(item) === undefined) return false;
  return item.type === "foreign_tax_paid"
    ? (item.amount ?? 0) > 0
    : isLossOrDeduction(item.type, item.amount);
}

/* One line 15 row: columns A to E as positive amounts. */
export interface PartnerLossRow {
  line: PartnerLossLine;
  item: PassThroughItem;
  /* Column A: this year's amount; 0 for an item carried from an earlier year. */
  current: number;
  /* Column B: carried from an earlier year. */
  carriedIn: number;
  /* Column D: allowed this year. */
  allowed: number;
  /* Column E: carried to next year. */
  carriedOut: number;
}

export interface PartnerBasisLines {
  line1: number;
  line2: number;
  line3a: number;
  line3b: number;
  line3e: number;
  increases: Partial<Record<PartnerIncreaseLine, number>>;
  line4o: number;
  line7: number;
  line8a: number;
  line9a: number;
  line10: number;
  line11a: number;
  /* Gain on distributions above basis (::line-11b::b01). */
  line11b: number;
  /* Nondeductible expenses, column D. */
  line12: number;
  line14: number;
  /* Allowed losses and deductions: line 15s column D. */
  line16: number;
  line18: number;
}

export interface PartnerBasisFigures {
  lines: PartnerBasisLines;
  rows: PartnerLossRow[];
}

export type PartnerBasisOutcome =
  | { kind: "figured"; figures: PartnerBasisFigures }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

const positive = (item: PassThroughItem) => Math.abs(item.amount ?? 0);

/* Cash and marketable securities (box 19 code A) are line 8a; every other distribution is not modeled. */
const CASH_DISTRIBUTION = "cash_and_marketable_securities";

/*
 * Items whose effect on basis the worksheet here does not figure: business
 * interest expense (line 4n and line 15q, a loss class of its own,
 * ::line-14::b02), excess business interest expense (line 15n), a distribution
 * of property or a deemed one, and a box the table does not know.
 */
function unknownEffect(item: PassThroughItem): boolean {
  if (item.type === "distribution") return item.detail !== CASH_DISTRIBUTION;
  if (item.type === "other_information") return item.detail === "business_interest_expense";
  if (item.type === "other_deduction") return item.detail === "excess_business_interest_expense";
  return roleOf(item.type) === "unknown";
}

/* Why the worksheet here cannot figure this K-1's basis, or undefined. */
function basisGap(entity: PassThroughEntity): string | undefined {
  const unknown = entity.items.filter(unknownEffect);
  if (unknown.length === 0) return undefined;
  return `${entityTitle(entity)}: ${unknown.map(describeItem).join(", ")}: its effect on the partner's basis (the Partner's Basis Worksheet) is not modeled.`;
}

const liabilityTotal = (liabilities: PartnerLiabilities) =>
  roundDollars(
    sum(liabilities.nonrecourse, liabilities.qualifiedNonrecourseFinancing, liabilities.recourse),
  );

/* Lines 3a and 3b from item K1; waiting when the K-1 gives one end of the year only. */
function liabilitiesOf(entity: PassThroughEntity): { start: number; end: number } | "waiting" {
  const k1 = entity.k1;
  if (k1.form !== "1065") return { start: 0, end: 0 };
  const { liabilitiesAtStart, liabilitiesAtEnd } = k1;
  if (liabilitiesAtStart === undefined && liabilitiesAtEnd === undefined) {
    return { start: 0, end: 0 };
  }
  if (liabilitiesAtStart === undefined || liabilitiesAtEnd === undefined) return "waiting";
  return { start: liabilityTotal(liabilitiesAtStart), end: liabilityTotal(liabilitiesAtEnd) };
}

/* Line 4: each income item above 0 on its line, cents kept until the line (::line-4::b01). */
function increaseLines(items: PassThroughItem[]): Partial<Record<PartnerIncreaseLine, number>> {
  const byLine = new Map<PartnerIncreaseLine, number[]>();
  for (const item of items) {
    const line =
      item.type === "other_information" && item.detail === "dividend_equivalents"
        ? "4f"
        : INCREASE_LINES[item.type];
    if (line === undefined || (item.amount ?? 0) <= 0) continue;
    byLine.set(line, [...(byLine.get(line) ?? []), item.amount ?? 0]);
  }
  return Object.fromEntries(
    [...byLine].map(([line, amounts]) => [line, roundDollars(sum(...amounts))]),
  );
}

const totalOf = (items: PassThroughItem[], type: ItemType) =>
  roundDollars(sum(...items.filter((item) => item.type === type).map(positive)));

/* Part I, lines 1 to 11b. */
function partI(
  entity: PassThroughEntity,
  start: number,
  liabilities: { start: number; end: number },
) {
  const items = entity.items;
  const line2 = roundDollars(entity.holding?.capitalContributions ?? 0);
  const line3c = liabilities.end - liabilities.start;
  const increases = increaseLines(items);
  const line4o = sum(...Object.values(increases));
  const line3e = atLeast(0, line3c);
  const line7 = start + line2 + line3e + line4o;
  const line8a = totalOf(items, "distribution");
  const line9a = atLeast(0, -line3c);
  const line10 = line8a + line9a;
  return {
    line1: start,
    line2,
    line3a: liabilities.end,
    line3b: liabilities.start,
    line3e,
    increases,
    line4o,
    line7,
    line8a,
    line9a,
    line10,
    line11a: atLeast(0, line7 - line10),
    line11b: atLeast(0, line10 - line7),
  };
}

/* Line 15 columns A and B: this year's items, then the carried ones, in line order. */
function lossRows(entity: PassThroughEntity, items: PassThroughItem[]): PartnerLossRow[] {
  const row = (item: PassThroughItem): PartnerLossRow => {
    const amount = roundDollars(positive(item));
    const carried = item.fromPriorYear === true;
    return {
      line: lossLineOf(item) ?? "15p",
      item,
      current: carried ? 0 : amount,
      carriedIn: carried ? amount : 0,
      allowed: 0,
      carriedOut: 0,
    };
  };
  const rows = [...items.filter(isPartnerLossItem), ...entity.priorYearItems].map(row);
  return rows.sort((first, second) => first.line.localeCompare(second.line));
}

/* Column D: every row's total when line 14 covers them, else each row's share (::line-14::b03). */
function allocate(basis: number, amounts: number[]): number[] {
  if (basis <= 0) return amounts.map(() => 0);
  return basis >= sum(...amounts) ? amounts : prorateDollars(basis, amounts);
}

/* The worksheet for one partnership K-1: every line, or why it waits or cannot be figured. */
export function figurePartnerBasis(entity: PassThroughEntity): PartnerBasisOutcome {
  const gap = basisGap(entity);
  if (gap) return { kind: "unsupported", reason: gap };
  const start = entity.holding?.partnershipBasisAtStart;
  if (start === undefined) return { kind: "waiting", factKeys: [entity.holdingKey] };
  const liabilities = liabilitiesOf(entity);
  if (liabilities === "waiting") return { kind: "waiting", factKeys: [entity.key] };
  const lines = partI(entity, roundDollars(start), liabilities);
  const line12 = totalOf(entity.items, "nondeductible_expenses");
  const line14 = atLeast(0, lines.line11a - line12);
  const rows = lossRows(entity, entity.items);
  const allowed = allocate(
    line14,
    rows.map((row) => row.current + row.carriedIn),
  );
  const figured = rows.map((row, index) => ({
    ...row,
    allowed: allowed[index],
    carriedOut: row.current + row.carriedIn - allowed[index],
  }));
  const line16 = sum(...figured.map((row) => row.allowed));
  return {
    kind: "figured",
    figures: {
      lines: {
        ...lines,
        line12: Math.min(line12, lines.line11a),
        line14,
        line16,
        line18: line14 - line16,
      },
      rows: figured,
    },
  };
}

/*
 * What the worksheet figures but the engine cannot report: a gain on
 * distributions above basis (line 11b, a gain on Form 8949), nondeductible
 * expenses above the basis (line 12 column E), and, for an interest disposed
 * of this year, any loss held back, which the sale ends.
 */
export function partnerBasisGaps(
  entity: PassThroughEntity,
  figures: PartnerBasisFigures,
): string[] {
  const title = entityTitle(entity);
  const { lines, rows } = figures;
  const gaps: string[] = [];
  if (lines.line11b > 0) {
    gaps.push(
      `${title}: distributions and a decrease in liabilities of $${lines.line10} are more than the partner's basis of $${lines.line7}; the $${lines.line11b} above basis is a gain (the Partner's Basis Worksheet line 11b), which the engine does not add from a K-1.`,
    );
  }
  if (totalOf(entity.items, "nondeductible_expenses") > lines.line11a) {
    gaps.push(
      `${title}: nondeductible expenses above the partner's basis carry to next year (the Partner's Basis Worksheet line 12, column E), which is not modeled.`,
    );
  }
  const heldBack = rows.some((row) => row.carriedOut > 0);
  if (heldBack && entity.holding?.disposedOfEntirely === true) {
    gaps.push(
      `${title}: a loss above the partner's basis in the year the interest is disposed of is not modeled.`,
    );
  }
  return gaps;
}

/* The basis stage's items: every item outside line 15 passes; each row is allowed by column D and carries column E. */
export function partnerBasisItems(
  items: PassThroughItem[],
  rows: PartnerLossRow[],
): { allowed: PassThroughItem[]; carried: PassThroughItem[] } {
  const outside = items.filter((item) => !isPartnerLossItem(item));
  return {
    allowed: [
      ...outside,
      ...rows.filter((row) => row.allowed > 0).map((row) => withAmount(row.item, row.allowed)),
    ],
    carried: rows
      .filter((row) => row.carriedOut > 0)
      .map((row) => withAmount(row.item, row.carriedOut)),
  };
}
