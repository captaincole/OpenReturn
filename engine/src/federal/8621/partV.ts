/*
 * When one fund's form takes Part V, and its lines 15 and 16. Part V is for a
 * section 1291 fund (irs-8621-inst-2025::sec::part-v::b01), for the first year
 * of a mark-to-market election on stock held before (::how-to-make-the-election-3::b01),
 * and for the deemed sale and deemed dividend elections D to H.
 */

import type { PficFundFactValue } from "../../facts/index.js";
import { currencyOf, saleInDollars, yearEndValueUsd } from "./currency.js";
import { line15Of, TAX_YEAR, type Line15 } from "./line15.js";
import { line16Of, type Line16 } from "./line16.js";

export interface PartV {
  line15: Line15;
  /* Elections E, G and H: the deemed dividend on line 15e(2) (::how-to-make-the-election-5::b01). */
  deemedDividend?: number;
  line16?: Line16;
  /* Why lines 16b–16f cannot be figured while lines 15a–15f can. */
  line16Gap?: string;
}

const LAST_DAY_OF_YEAR = `${TAX_YEAR}-12-31`;

/*
 * Election C on stock held before 2025, with no QEF election: "the PFIC stock
 * is treated as sold at fair market value on the last day of the tax year ...
 * and the gain is treated as an excess distribution subject to section 1291"
 * (::how-to-make-the-election-3::b01).
 */
export function markToMarketFirstYear(fund: PficFundFactValue, holdingStart: Date): boolean {
  return (
    fund.regime === "mark_to_market" &&
    fund.elections?.markToMarket === true &&
    holdingStart.getUTCFullYear() < TAX_YEAR
  );
}

const DEEMED_DIVIDEND_ELECTIONS = (fund: PficFundFactValue) =>
  fund.elections?.deemedDividend === true ||
  fund.elections?.section1297eDeemedDividend === true ||
  fund.elections?.formerPficDeemedDividend === true;

const DEEMED_SALE_ELECTIONS = (fund: PficFundFactValue) =>
  fund.elections?.deemedSale === true || fund.elections?.formerPficDeemedSale === true;

/* Whether this fund's form takes Part V at all. */
export function takesPartV(fund: PficFundFactValue, holdingStart: Date): boolean {
  return (
    fund.regime === "section_1291" ||
    markToMarketFirstYear(fund, holdingStart) ||
    DEEMED_SALE_ELECTIONS(fund) ||
    DEEMED_DIVIDEND_ELECTIONS(fund)
  );
}

const DEEMED_DIVIDEND_HOLDING_PERIOD =
  "Elections E, G and H allocate the deemed dividend only to PFIC days, with a holding period that ends before the qualification or termination date; the engine does not figure lines 16b to 16f for them.";
const NO_YEAR_END_BASIS =
  "The fund fact does not state the adjusted basis at the end of the year (the deemed sale of Election C, line 15f).";

/*
 * The sale line 15f takes, in U.S. dollars: an actual sale, the deemed sale
 * of D or F, or the year-end deemed sale of C at the year-end value.
 */
function saleOf(
  fund: PficFundFactValue,
  holdingStart: Date,
): PficFundFactValue["disposition"] | string {
  if (!markToMarketFirstYear(fund, holdingStart))
    return fund.disposition === undefined ? undefined : saleInDollars(fund.disposition);
  const basis = fund.markToMarket?.adjustedBasisAtYearEnd;
  if (basis === undefined) return NO_YEAR_END_BASIS;
  return { date: LAST_DAY_OF_YEAR, amountRealized: yearEndValueUsd(fund), adjustedBasis: basis };
}

/* Part V of one fund, or why it cannot be figured. */
export function partVOf(fund: PficFundFactValue, holdingStart: Date): PartV | string {
  if (DEEMED_DIVIDEND_ELECTIONS(fund)) {
    const deemedDividend = fund.section1291?.deemedDividend;
    if (deemedDividend === undefined)
      return "Election E, G or H is checked, and the fund fact states no deemed dividend (line 15e(2)).";
    const empty = { dividendsUsd: 0, dividendForeignTaxUsd: 0, dividendForeignTax: 0, events: [] };
    return { line15: empty, deemedDividend, line16Gap: DEEMED_DIVIDEND_HOLDING_PERIOD };
  }
  const disposition = saleOf(fund, holdingStart);
  if (typeof disposition === "string") return disposition;
  const line15 = line15Of({
    holdingStart,
    currencyCode: currencyOf(fund),
    distributions: fund.section1291?.distributions ?? [],
    precedingDistributions: fund.section1291?.precedingDistributions,
    disposition,
  });
  if (typeof line15 === "string") return line15;
  if (line15.events.length === 0) return { line15 };
  const firstPficYear = fund.section1291?.firstPficYear ?? holdingStart.getUTCFullYear();
  const line16 = line16Of(line15.events, holdingStart, firstPficYear);
  return typeof line16 === "string" ? { line15, line16Gap: line16 } : { line15, line16 };
}
