/*
 * Part III: "Enter the following items for your total assets reported in Part
 * V or Part VI and the schedule, form, or return on which you reported the
 * items" (irs-8938-inst-2025::sec::part-iii::b01). The engine reads each item
 * from the return's own income facts on the asset's account slug, so the
 * amount is the one the return reports.
 */

import {
  makeDividendFactKey,
  makeInterestFactKey,
  makeMiscIncomeFactKey,
  type DividendFactValue,
  type Form8949Box,
  type InterestFactValue,
  type MiscIncomeFactValue,
} from "../../facts/index.js";
import { waitsForExchangeRate } from "../../incomeInDollars.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";

export const TAX_ITEMS = [
  "interest",
  "dividends",
  "royalties",
  "otherIncome",
  "gains",
  "deductions",
  "credits",
] as const;
export type TaxItem = (typeof TAX_ITEMS)[number];

/* One asset's tax items: cents kept, except gains (each Form 8949 row is whole dollars). */
export interface AssetTaxItems {
  amounts: Partial<Record<TaxItem, number>>;
  /*
   * The items that wait: gains for a sale whose basis or exchange rate is not
   * known yet (with Form 8949), and the items of a 1099-INT or 1099-DIV fact
   * that waits for its exchange rate (incomeInDollars.ts).
   */
  waiting: TaxItem[];
  /* The Schedule D lines that carry the gains: "10", "13". */
  scheduleDLines: string[];
  /* Why an item cannot be figured, by item. */
  gaps: Partial<Record<TaxItem, string>>;
}

/* The Schedule D line that takes each Form 8949 box's totals (the printed lines 1b to 10; schedule-d/bindings.ts BOX_LINES). */
const SCHEDULE_D_LINE: Record<Form8949Box, string> = {
  "partI.boxA": "1b",
  "partI.boxG": "1b",
  "partI.boxB": "2",
  "partI.boxH": "2",
  "partI.boxC": "3",
  "partI.boxI": "3",
  "partII.boxD": "8b",
  "partII.boxJ": "8b",
  "partII.boxE": "9",
  "partII.boxK": "9",
  "partII.boxF": "10",
  "partII.boxL": "10",
};
/* Capital gain distributions (Form 1099-DIV box 2a) go on Schedule D line 13. */
const DISTRIBUTIONS_LINE = "13";

const ROYALTIES_GAP =
  "A foreign asset's 1099-MISC box 2 royalties: the engine has no route for them to Schedule E, so Part III cannot name where they are reported.";
const BUSINESS_GAP =
  "A foreign asset's 1099-MISC pays a business: its income is in Schedule C gross receipts, which Part III would have to split by asset.";

const factValue = <T>(inputs: ResolverInputs, key: string): T | undefined =>
  inputs.factByKey.get(key) as T | undefined;

/* The 1099-B sales of the account: each Form 8949 row's gain, (h) = rounded (d) − rounded (e) + (g). */
function gainsOf(inputs: ResolverInputs, accountSlug: string) {
  const prefix = `account.${accountSlug}.trades.`;
  const tradeIds = new Set(
    inputs.facts
      .filter((row) => row.category === "investment_income" && row.key.startsWith(prefix))
      .map((row) => row.key.slice(prefix.length)),
  );
  const sales = inputs.trades.boxed.filter((boxed) => tradeIds.has(boxed.trade.tradeId));
  const wait = sales.some((sale) => sale.basis === undefined || sale.waitsForRate === true);
  const rows = sales.map((sale) =>
    sum(
      roundDollars(sale.trade.proceeds),
      -roundDollars(sale.basis ?? 0),
      roundDollars(sale.trade.adjustmentAmount ?? 0),
    ),
  );
  const lines = sales.map((sale) => SCHEDULE_D_LINE[sale.box]);
  return { rows, wait, lines };
}

function miscItems(misc: MiscIncomeFactValue | undefined, gaps: AssetTaxItems["gaps"]) {
  if (misc === undefined) return { royalties: undefined, otherIncome: undefined };
  if (misc.businessId !== undefined) {
    gaps.royalties = BUSINESS_GAP;
    gaps.otherIncome = BUSINESS_GAP;
  } else if ((misc.box2 ?? 0) !== 0) {
    gaps.royalties = ROYALTIES_GAP;
  }
  return { royalties: misc.box2, otherIncome: misc.box3 };
}

/*
 * The items of one asset:
 * - interest: Schedule B line 1's amount for the payer, 1099-INT boxes 1 and 3;
 * - dividends: 1099-DIV box 1a (Schedule B line 5);
 * - royalties and other income: 1099-MISC boxes 2 and 3 (Schedule 1 line 8z for box 3);
 * - gains (losses): each Form 8949 row of the account's sales, and box 2a
 *   capital gain distributions (Schedule D line 13);
 * - deductions: 1099-INT box 2, the early withdrawal penalty (Schedule 1 line 18);
 * - credits: the foreign tax paid, 1099-INT box 6 and 1099-DIV box 7. The
 *   bindings print it only when Schedule 3 line 1 claims the credit.
 */
export function assetTaxItems(inputs: ResolverInputs, accountSlug: string): AssetTaxItems {
  const interest = factValue<InterestFactValue>(inputs, makeInterestFactKey(accountSlug));
  const dividends = factValue<DividendFactValue>(inputs, makeDividendFactKey(accountSlug));
  const misc = factValue<MiscIncomeFactValue>(inputs, makeMiscIncomeFactKey(accountSlug));
  const gaps: AssetTaxItems["gaps"] = {};
  const { royalties, otherIncome } = miscItems(misc, gaps);
  const sales = gainsOf(inputs, accountSlug);
  const distributions = dividends?.box2a;
  const scheduleDLines = [...sales.lines, ...(distributions ? [DISTRIBUTIONS_LINE] : [])];
  return {
    amounts: {
      interest: sumOrBlank(interest?.box1, interest?.box3),
      dividends: dividends?.box1a,
      royalties,
      otherIncome,
      gains: sumOrBlank(...sales.rows, roundDollars(distributions)),
      deductions: interest?.box2,
      credits: sumOrBlank(interest?.box6, dividends?.box7),
    },
    waiting: waitingItems(sales.wait, interest, dividends),
    scheduleDLines: [...new Set(scheduleDLines)],
    gaps,
  };
}

function waitingItems(
  salesWait: boolean,
  interest: InterestFactValue | undefined,
  dividends: DividendFactValue | undefined,
): TaxItem[] {
  const waiting: TaxItem[] = [
    ...(salesWait ? (["gains"] as const) : []),
    ...(waitsForExchangeRate(interest) ? (["interest", "deductions", "credits"] as const) : []),
    ...(waitsForExchangeRate(dividends) ? (["dividends", "gains", "credits"] as const) : []),
  ];
  return [...new Set(waiting)];
}

/* "No tax item reported in Part III with respect to this asset" (lines 22d and 31d). */
export function hasNoTaxItem(items: AssetTaxItems): boolean {
  return (
    items.waiting.length === 0 &&
    TAX_ITEMS.every((item) => (items.amounts[item] ?? 0) === 0) &&
    Object.keys(items.gaps).length === 0
  );
}

/* One category's line (13 or 14) for each item: the assets' amounts added, cents kept. */
export interface CategoryItems {
  totals: Partial<Record<TaxItem, number>>;
  waiting: TaxItem[];
  scheduleDLines: string[];
  gaps: Partial<Record<TaxItem, string>>;
}

export function categoryItems(assets: ReadonlyArray<AssetTaxItems>): CategoryItems {
  const totals: Partial<Record<TaxItem, number>> = {};
  for (const item of TAX_ITEMS) {
    const total = sumOrBlank(...assets.map((asset) => asset.amounts[item]));
    if (total !== undefined && total !== 0) totals[item] = total;
  }
  return {
    totals,
    waiting: [...new Set(assets.flatMap((asset) => asset.waiting))],
    scheduleDLines: [...new Set(assets.flatMap((asset) => asset.scheduleDLines))],
    gaps: Object.assign({}, ...assets.map((asset) => asset.gaps)),
  };
}
