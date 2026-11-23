/*
 * Foreign tax for the foreign tax credit (Form 1116, Schedule 3 line 1).
 *
 * Form 1099-DIV box 7 and Form 1099-INT box 6 show the foreign tax a payer
 * withheld; box 8 (1099-DIV) and box 7 (1099-INT) name the country. Neither form
 * says how much of the income is from foreign sources. A fund or broker prints
 * that on its year-end foreign income statement: one fact per account, the
 * "foreign income statement" below. Form 1116 line 1a needs it; the election to
 * claim the credit without Form 1116 does not
 * (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01).
 *
 * A foreign tax that no payee statement shows (tax a foreign country took from
 * wages, for example) is a stated foreign tax: one fact per payment, with the
 * Part I and Part II amounts the taxpayer states.
 */

type FactRow = { key: string; value: unknown; category: string };

/* The categories above Form 1116 Part I (irs-1116-inst-2025::sec::categories-of-income::b01). */
export type ForeignIncomeCategory =
  | "section_951a"
  | "foreign_branch"
  | "passive"
  | "general"
  | "section_901j"
  | "treaty_resourced"
  | "lump_sum";

/* The Part II columns: (q) dividends, (r) rents and royalties, (s) interest, (t) other. */
export type ForeignIncomeKind = "dividends" | "rents_royalties" | "interest" | "other";

/*
 * An account's foreign income statement (the fund's or broker's supplement to
 * its 1099-DIV or 1099-INT). Amounts in U.S. dollars, cents kept.
 */
export interface ForeignIncomeStatementValue {
  /* Gross income from foreign sources, the qualified dividends and capital gain distributions in it included. */
  grossIncome: number;
  /* The part of grossIncome that is qualified dividends (1099-DIV box 1b). Absent: none. */
  qualifiedDividends?: number;
  /* The part of grossIncome that is capital gain distributions (1099-DIV box 2a). Absent: none. */
  capitalGainDistributions?: number;
  /*
   * Form 1116 line i: the 1099-DIV's box 8 or the 1099-INT's box 7 (the 1099-DIV
   * fact does not hold box 8). Absent on a 1099-DIV: a RIC, which leaves box 8
   * blank; absent on a 1099-INT: the 1099-INT fact's box 7.
   */
  country?: string;
}

/* One foreign tax payment that no payee statement shows. Amounts in U.S. dollars unless named. */
export interface StatedForeignTaxValue {
  /* Who paid the income or took the tax: "Northwind GmbH, Munich office". */
  payer: string;
  /* Form 1116 line i. */
  country: string;
  category: ForeignIncomeCategory;
  incomeKind: ForeignIncomeKind;
  /* The income type on the dotted line next to line 1a: "Wages". */
  description: string;
  /* Line 1a: gross income from sources in the country, of the category. */
  grossIncome: number;
  /* Line 2: expenses definitely related to that income. Absent: none. */
  definitelyRelatedExpenses?: number;
  /* Part II, columns (q) to (t): the tax converted to U.S. dollars. */
  foreignTaxPaid: number;
  /* Part II, columns (m) to (p): the tax in the foreign currency. */
  foreignTaxInForeignCurrency: number;
  /* Part II, column (l). */
  datePaid: string;
  /*
   * Line 1b: compensation sourced on an alternative basis (Pub. 514)
   * (irs-1116-inst-2025::sec::line-1b::b01). Absent: the time basis.
   */
  alternativeBasisSourcing?: boolean;
}

export interface StatedForeignTaxFact {
  key: string;
  value: StatedForeignTaxValue;
}

const INCOME_STATEMENT_CATEGORY = "investment_income";
const STATED_TAX_CATEGORY = "foreign";
const ACCOUNT_PREFIX = "account";
const INCOME_STATEMENT_SUFFIX = "foreign_income";
const STATED_TAX_PREFIX = "foreign_tax";

export const FOREIGN_TAX_CREDIT_KEYS = {
  /*
   * Part II box (k): true when the taxpayer chose, on an earlier timely return,
   * to credit foreign taxes when they accrue
   * (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b01). Absent: paid.
   */
  claimAccrued: "foreign_tax_credit.claim_accrued",
} as const;

/*
 * The statement sits next to the 1099 it explains: "account.<slug>.dividends"
 * gives "account.<slug>.dividends.foreign_income". An account with both a
 * 1099-DIV and a 1099-INT has one statement for each.
 */
export function makeForeignIncomeStatementKey(documentFactKey: string): string {
  return `${documentFactKey}.${INCOME_STATEMENT_SUFFIX}`;
}

export function isForeignIncomeStatementKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 4 &&
    parts[0] === ACCOUNT_PREFIX &&
    parts[1] !== "" &&
    (parts[2] === "dividends" || parts[2] === "interest") &&
    parts[3] === INCOME_STATEMENT_SUFFIX
  );
}

/* The statement for a 1099-DIV or 1099-INT fact, or undefined with none on file. */
export function foreignIncomeStatementOf(
  facts: ReadonlyArray<FactRow>,
  documentFactKey: string,
): ForeignIncomeStatementValue | undefined {
  const key = makeForeignIncomeStatementKey(documentFactKey);
  const row = facts.find((each) => each.category === INCOME_STATEMENT_CATEGORY && each.key === key);
  return row?.value as ForeignIncomeStatementValue | undefined;
}

export function makeStatedForeignTaxKey(slug: string): string {
  return `${STATED_TAX_PREFIX}.${slug}`;
}

export function isStatedForeignTaxKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && parts[0] === STATED_TAX_PREFIX && parts[1] !== "";
}

/* Every stated foreign tax, in the order recorded. */
export function getStatedForeignTaxFacts(facts: ReadonlyArray<FactRow>): StatedForeignTaxFact[] {
  return facts
    .filter((row) => row.category === STATED_TAX_CATEGORY && isStatedForeignTaxKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as StatedForeignTaxValue }));
}
