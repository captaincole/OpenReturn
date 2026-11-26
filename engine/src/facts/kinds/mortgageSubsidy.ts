/*
 * Form 8828, Recapture of Federal Mortgage Subsidy: a home bought with a
 * federally subsidized loan (a loan from a tax-exempt qualified mortgage bond,
 * or a loan with a mortgage credit certificate) and sold or otherwise disposed
 * of in 2025 (irs-8828-inst-2025::sec::federal-mortgage-subsidy::b01,
 * ::who-must-file::b01). Two facts for each home, joined by the home's slug:
 *
 * - The notice (a document): "you should have received notification in writing
 *   from the bond issuer or the lender at the time your mortgage was provided"
 *   (::specific-instructions::b01). It names the subsidy, the issuer and the
 *   lender, the closing date, the federally subsidized amount (line 19) and the
 *   table of adjusted qualifying income and holding period percentages
 *   (lines 16 and 20).
 * - The sale (answers): the date, the price, the expenses and the basis of the
 *   filer's interest, the repayment date, the household size at the sale.
 *
 * A joint return is one filer: its interest is both spouses' interest.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Line 2: "Check the box that describes the type of federal subsidy" (irs-8828-face-2025::sec::face-part-i::b01). */
export type MortgageSubsidyType = "qualified_mortgage_bond" | "mortgage_credit_certificate";

/*
 * One line of the notice's table: "the column of the table that corresponds to
 * your family size ... on the line that corresponds to the number of full and
 * partial years that you held your home" (line-16::b01, b02); the holding period
 * percentage is "on the same line" (line-20::b01). Issuers print two family-size
 * columns, 2 or fewer and 3 or more.
 */
export interface MortgageSubsidyTableRow {
  /* The number of full and partial years held: 1 to 9. */
  yearsHeld: number;
  /* In percent: 20 for 20%. */
  holdingPeriodPercentage: number;
  adjustedQualifyingIncomeTwoOrFewer: number;
  adjustedQualifyingIncomeThreeOrMore: number;
}

export interface MortgageSubsidyNoticeFactValue {
  subsidyType: MortgageSubsidyType;
  /* Line 3: the issuer, as state, political subdivision and agency. */
  issuerState: string;
  issuerPoliticalSubdivision?: string;
  issuerAgency?: string;
  /* Line 4: the bank or other lender that provided the original mortgage. */
  originalLenderName: string;
  originalLenderAddress: string;
  /*
   * Line 5, YYYY-MM-DD: the date the loan was provided, or the later date it
   * became federally subsidized debt (line-5::b01).
   */
  loanClosingDate: string;
  /* Line 19: "6.25% of the highest amount of the loan that was federally subsidized" (line-19::b01). */
  federallySubsidizedAmount: number;
  table: MortgageSubsidyTableRow[];
}

export interface MortgageSubsidySaleFactValue {
  /* Line 1: the subsidized home's address, not the current address (line-1::b01). */
  propertyAddress: string;
  /* Line 6, YYYY-MM-DD: the date of sale, or of the gift or other disposition (line-6::b01). */
  dispositionDate: string;
  /*
   * Line 8, YYYY-MM-DD: the date the original loan was fully repaid, or a QMB
   * loan refinanced with conventional financing. Not the refinancing of an MCC
   * loan with a reissued certificate (line-8::b01). Often the sale date. Absent:
   * the loan was not fully repaid (the buyer assumed it).
   */
  fullRepaymentDate?: string;
  /*
   * Line 9: the price of the filer's interest; for a gift or other disposition
   * that is not a sale, the home's fair market value (line-9::b01).
   */
  salesPrice: number;
  /* Line 10: commissions, advertising, legal fees allocable to the interest (line-10::b01). */
  expensesOfSale: number;
  /* Line 12: the adjusted basis of the interest (line-12::b01). */
  adjustedBasis: number;
  /*
   * Line 15: "Any gain included in your gross income because of the disposition
   * of your home" (line-15::b01): the part of the gain the section 121 exclusion
   * does not cover. 0 when the whole gain is excluded or there is none.
   */
  gainIncludedInIncome: number;
  /* Line 16: "number of family members living with you at the time of the sale" (line-16::b01). */
  familySizeAtSale: number;
  /*
   * The filer's share (0 to 1) of the home when someone outside the return also
   * owns it: "figure the actual recapture tax separately for each, based on the
   * interest of each in the home" (special-rules::b02). It divides line 19.
   * Absent: the filer owns it all.
   */
  ownershipShare?: number;
  /*
   * Line 13 with a qualifying subordinate mortgage loan: the filer's share of
   * the gain after paying the QSML lender its share (line-13::b01). Absent: none.
   */
  qsmlShareOfGain?: number;
}

export interface MortgageSubsidyHome {
  slug: string;
  noticeKey: string;
  saleKey: string;
  notice?: MortgageSubsidyNoticeFactValue;
  sale?: MortgageSubsidySaleFactValue;
}

const SUBSIDY_CATEGORY = "mortgage";
const SUBSIDY_PREFIX = "mortgage_subsidy";
const NOTICE_PART = "notice";
const SALE_PART = "sale";

export function makeMortgageSubsidyNoticeKey(homeSlug: string): string {
  return `${SUBSIDY_PREFIX}.${homeSlug}.${NOTICE_PART}`;
}

export function makeMortgageSubsidySaleKey(homeSlug: string): string {
  return `${SUBSIDY_PREFIX}.${homeSlug}.${SALE_PART}`;
}

/* The home slug of a notice or sale key; undefined for any other key. */
function homeSlugOf(key: string): string | undefined {
  const parts = key.split(".");
  if (parts.length !== 3 || parts[0] !== SUBSIDY_PREFIX || parts[1] === "") return undefined;
  return parts[2] === NOTICE_PART || parts[2] === SALE_PART ? parts[1] : undefined;
}

export function isMortgageSubsidyFactKey(key: string): boolean {
  return homeSlugOf(key) !== undefined;
}

/* Every subsidized home with a notice or a sale fact, in the order first recorded. */
export function getMortgageSubsidyHomes(facts: ReadonlyArray<FactRow>): MortgageSubsidyHome[] {
  const homes = new Map<string, MortgageSubsidyHome>();
  for (const row of facts) {
    const slug = row.category === SUBSIDY_CATEGORY ? homeSlugOf(row.key) : undefined;
    if (slug === undefined) continue;
    const home = homes.get(slug) ?? {
      slug,
      noticeKey: makeMortgageSubsidyNoticeKey(slug),
      saleKey: makeMortgageSubsidySaleKey(slug),
    };
    if (row.key === home.noticeKey) home.notice = row.value as MortgageSubsidyNoticeFactValue;
    else home.sale = row.value as MortgageSubsidySaleFactValue;
    homes.set(slug, home);
  }
  return [...homes.values()];
}
