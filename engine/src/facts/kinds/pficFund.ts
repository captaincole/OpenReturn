/*
 * Form 8621: one fact per passive foreign investment company (PFIC) the
 * taxpayer holds directly: "A separate Form 8621 must be filed for each PFIC"
 * (irs-8621-inst-2025::sec::passive-foreign-investment-corporation-pfic::b01).
 * The common case is a foreign mutual fund or ETF held in a foreign or U.S.
 * account. A fund held in an IRA or another tax-exempt account is not a fact
 * here: its owner "is not treated as a shareholder of the PFIC" (::b03).
 *
 * A fund's distributions are stated only here, never also as a Form 1099-DIV
 * fact: the engine sends the part that is a dividend to Form 1040 line 3b
 * and Schedule B line 5 itself. The fund's statement (the PFIC Annual
 * Information Statement for a QEF; account statements otherwise) gives the
 * amounts.
 *
 * One fact holds one block of shares with one holding period. Part V is
 * figured "separately for each block of shares that has the same holding
 * period" (irs-8621-inst-2025::sec::part-v::b01): a fund bought in several
 * lots with distributions or a sale is two or more blocks, which this fact
 * cannot state.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The fund's regime for the year: a section 1291 fund (no QEF or
 * mark-to-market election), a QEF (Election A, this year or before), or
 * marked to market (Election C, this year or before).
 */
export type PficRegime = "section_1291" | "qef" | "mark_to_market";

/* The Part II boxes checked on this year's form: the elections made this year. */
export interface PficElections {
  /* A: treat the PFIC as a QEF. */
  qef?: boolean;
  /* B: extend the time to pay the tax on the undistributed QEF earnings. */
  extendTime?: boolean;
  /* C: mark the stock to market. */
  markToMarket?: boolean;
  /* D: deemed sale on the first day of the fund's first QEF year. */
  deemedSale?: boolean;
  /* E: deemed dividend in connection with a QEF election (a CFC). */
  deemedDividend?: boolean;
  /* F: deemed sale of a former PFIC or a section 1297(e) PFIC. */
  formerPficDeemedSale?: boolean;
  /* G: deemed dividend of a section 1297(e) PFIC. */
  section1297eDeemedDividend?: boolean;
  /* H: deemed dividend of a former PFIC. */
  formerPficDeemedDividend?: boolean;
}

/* One distribution of the year, in the fund's currency (currencyCode). */
export interface PficDistribution {
  date: string;
  amount: number;
  /* U.S. dollars for one unit of the currency on the distribution date. Absent: 1 (U.S. dollars). */
  usdPerUnit?: number;
  /* Foreign tax withheld from this distribution, in the fund's currency. Absent: none. */
  foreignTaxWithheld?: number;
}

/* A sale or other disposition (or a deemed sale) of the block, in U.S. dollars. */
export interface PficDisposition {
  date: string;
  amountRealized: number;
  adjustedBasis: number;
  /* Mark-to-market stock: the unreversed inclusions for the shares sold (line 14a). */
  unreversedInclusions?: number;
}

/* Part III: the QEF's PFIC Annual Information Statement, in U.S. dollars. */
export interface PficQefAmounts {
  /* Line 6a: the pro rata share of the ordinary earnings. */
  ordinaryEarnings: number;
  /* Line 7a: the pro rata share of the net capital gain. */
  netCapitalGain: number;
  /* Lines 6b and 7b: the parts included under section 951 or excluded under section 1293(g). Absent: none. */
  ordinaryEarningsExcluded?: number;
  netCapitalGainExcluded?: number;
  /* Line 8b: cash and the fair market value of property distributed during the QEF's year. */
  distributions?: number;
  /* Line 8c: the part of line 8a for shares disposed of, pledged or transferred. */
  disposedSharesIncome?: number;
  /* A section 1.1411-10(g) election in effect for the QEF (Form 8960). Absent: none. */
  section1411gElection?: boolean;
}

/* Part IV: mark-to-market stock held at the end of the year, in U.S. dollars. */
export interface PficMarkToMarketAmounts {
  /* Line 10b: the adjusted basis at the end of the year (line 10a is valueAtYearEnd). */
  adjustedBasisAtYearEnd?: number;
  /* Line 11: the unreversed inclusions (section 1296(d)) before this year. Absent: none. */
  unreversedInclusions?: number;
}

/* Part V: a section 1291 fund's distributions and disposition. */
export interface PficSection1291Amounts {
  /* The three-letter currency code of lines 15a to 15e(1). Absent: USD. */
  currencyCode?: string;
  distributions?: PficDistribution[];
  /* Line 15b, as reduced: the distributions of the 3 years before 2025 (or the shorter holding period). */
  precedingDistributions?: number;
  /* The first tax year the fund was a PFIC in the holding period. Absent: the year of acquiredDate. */
  firstPficYear?: number;
  /* Elections E, G and H: the deemed dividend that line 15e(2) takes, in U.S. dollars. */
  deemedDividend?: number;
}

/* A section 1294 election made in an earlier year and still outstanding (Part VI). */
export interface PficPrior1294Election {
  /* The tax year the election was made for (line 17 prints its last day). */
  taxYear: number;
  /* Line 18: the undistributed earnings the election still covers. */
  undistributedEarnings: number;
  /* Line 19: the tax still deferred (last year's line 25 after a partial termination). */
  deferredTax: number;
  /* Line 21: the event of 2025 that ended the election, in words. Absent: none. */
  terminatingEvent?: string;
  /* Line 22: the earnings distributed or deemed distributed by that event. */
  earningsDistributed?: number;
}

export interface PficFundFactValue {
  fundName: string;
  /* Number, street, city and country, as one line. */
  fundAddress: string;
  /* The fund's country, for the foreign tax credit (Form 1116 line i). */
  country?: string;
  fundEin?: string;
  /* The taxpayer's own reference ID for the fund (alphanumeric, up to 50). */
  referenceId?: string;
  /* The fund's tax year when it is not the calendar year: ISO dates. */
  fundTaxYearBegin?: string;
  fundTaxYearEnd?: string;
  /* Line 1. */
  shareClass: string;
  jointlyOwnedWithSpouse?: boolean;
  /* The date the block was acquired (line 2 when in 2025; the holding period starts the next day). */
  acquiredDate: string;
  /* Line 3. */
  sharesAtYearEnd: number;
  /* Line 4, and line 10a for marked stock: the value at the end of 2025, in U.S. dollars. */
  valueAtYearEnd: number;
  regime: PficRegime;
  elections?: PficElections;
  /* The page 1 election under section 1297(f)(2): then the form carries only the names and numbers. */
  qualifyingInsuranceElection?: boolean;
  qef?: PficQefAmounts;
  markToMarket?: PficMarkToMarketAmounts;
  section1291?: PficSection1291Amounts;
  /* A sale of the block in 2025 (line 13 or 15f), or the deemed sale of Election C, D or F. */
  disposition?: PficDisposition;
  prior1294Elections?: PficPrior1294Election[];
}

export interface PficFundFact {
  key: string;
  value: PficFundFactValue;
}

const PFIC_CATEGORY = "foreign";
const PFIC_PREFIX = "pfic_fund";

export function makePficFundFactKey(fundSlug: string): string {
  return `${PFIC_PREFIX}.${fundSlug}`;
}

export function isPficFundFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && parts[0] === PFIC_PREFIX && parts[1] !== "";
}

/* Every fund fact, in the order recorded: the order of the Forms 8621. */
export function getPficFundFacts(facts: ReadonlyArray<FactRow>): PficFundFact[] {
  return facts
    .filter((row) => row.category === PFIC_CATEGORY && isPficFundFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as PficFundFactValue }));
}
