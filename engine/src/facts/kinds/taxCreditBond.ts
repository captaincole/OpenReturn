/*
 * Form 8912: the credit to holders of tax credit bonds. Three kinds of input:
 *
 * - A Form 1097-BTC, the Bond Tax Credit statement, as printed: one fact per
 *   form. Part III lists each one (irs-8912-inst-2025::sec::part-iii-bond-credit-s-reported-to-you-on::b01).
 * - A bond the taxpayer held (directly or through a nominee), or a bond credit
 *   passed through by an entity, that no Form 1097-BTC reported: one fact per
 *   Part IV (irs-8912-inst-2025::sec::part-iv-bond-credits-from-bonds-held-by-you::b01).
 * - The carryforward of unused credits from earlier years (line 3), an answer
 *   from last year's return.
 */

type FactRow = { key: string; value: unknown; category: string };

const BOND_CATEGORY = "investment_income";

/* Box 2a: what box 2b holds; C a CUSIP number, A an account number, O any other identifier. */
export type BondTaxCreditIdentifierCode = "A" | "C" | "O";

/* Box 3: 101 for a clean renewable energy bond (section 54), 199 for every other bond. */
export type BondTaxCreditBondTypeCode = "101" | "199";

/*
 * The Form 1097-BTC as printed (Copy B, Rev. April 2025). Amounts in U.S.
 * dollars, cents kept. For a new CREB or a QECB, box 1 is already after the
 * 70% limit (the form's Instructions for Recipient).
 */
export interface BondTaxCreditStatementBoxes {
  /* FORM 1097-BTC ISSUER'S name: the bond's issuer or agent, or a broker, nominee or entity that passes the credit on. */
  filerName: string;
  /* FORM 1097-BTC ISSUER'S TIN (Part III column (b1)). */
  filerTin?: string;
  /* "Form 1097-BTC issuer is": true for the issuer of the bond or its agent; false for an entity or person distributing the credit. */
  filerIsBondIssuer?: boolean;
  /* Box 1, Total: the credit for the calendar year (Part III column (c)). */
  box1Total: number;
  box2aCode?: BondTaxCreditIdentifierCode;
  /* Box 2b, Unique identifier: a CUSIP, an account number or another number (Part III column (b2)). */
  box2bUniqueIdentifier?: string;
  box3BondType: BondTaxCreditBondTypeCode;
  /* Boxes 5a to 5l: the credit for each month, January to December. */
  box5Monthly?: number[];
  /* Box 6, Comments. */
  box6Comments?: string;
}

/*
 * The holder's answers the statement does not print. They matter only for a
 * clean renewable energy bond (box 3 "101"): its credit from a pass-through
 * entity is limited by the line 12 formula
 * (irs-8912-inst-2025::sec::line-12::b02).
 */
export interface BondTaxCreditStatementValue extends BondTaxCreditStatementBoxes {
  /* True when the filer is a partnership, S corporation, estate, trust, RIC or REIT the taxpayer owns an interest in; a broker or nominee is not. Not asked when filerIsBondIssuer is true. */
  fromPassThroughEntity?: boolean;
  /* The taxable income for 2025 attributable to the taxpayer's interest in that entity (the formula's numerator). */
  attributableTaxableIncome?: number;
}

/*
 * The bonds of Form 8912 (irs-8912-inst-2025::sec::general-instructions::b01).
 * A qualified zone academy bond issued before October 4, 2008 is its own type:
 * only a bank, an insurance company or a lending corporation can claim it, and
 * an S corporation shareholder through the S corporation
 * (irs-8912-inst-2025::sec::who-can-claim-the-credits::b01).
 */
export type TaxCreditBondType =
  "creb" | "ncreb" | "qecb" | "qzab" | "qzab_before_october_4_2008" | "qscb" | "bab";

/* One row of line 18: one CUSIP number (or set of principal payment dates) of the bond. */
export interface TaxCreditBondRow {
  /* Column (a): the CUSIP number, or the principal payment dates when there is none. */
  identifier: string;
  /* Column (b): the face amount less principal repaid, or for a build America bond the interest payable. */
  outstandingAmount: number;
  /*
   * Column (c): the credit rate as a decimal (0.0512 for 5.12%), the Treasury
   * rate for the day the bond was sold (line-18-column-a::b01). A build
   * America bond always has 35%, so it needs none.
   */
  creditRate?: number;
  /*
   * The 2025 credit allowance dates (YYYY-MM-DD) this row's amount covers, when
   * the outstanding principal changed during the year and the bond takes one
   * row for each amount. Absent: every credit allowance date the bond was held.
   */
  creditAllowanceDates?: string[];
}

export interface TaxCreditBondFactValue {
  /* held: the taxpayer or a nominee held the bond; pass_through: an entity passed its credit on, with no Form 1097-BTC. */
  source: "held" | "pass_through";
  bondType: TaxCreditBondType;
  /* Line 15a: the issuer's name, city or town, and state; for a pass-through, the entity's name. */
  issuerNameCityState: string;
  /* Line 15b: the issuer's EIN; for a pass-through, the entity's EIN. */
  issuerEin: string;
  /* Line 16a and 16b (held bonds): YYYY-MM-DD. */
  issueDate?: string;
  maturityDate?: string;
  /* The day the taxpayer bought the bond, when that was in 2025; absent when held since before 2025. */
  acquiredDate?: string;
  /* Line 17: the day the bond was sold, redeemed or otherwise disposed of in 2025. */
  disposedDate?: string;
  /* How it was disposed of: a redemption ends the bond (the credit is prorated); a sale passes it on. */
  disposal?: "sold" | "redeemed";
  /* Line 18 rows of a held bond. */
  rows?: TaxCreditBondRow[];
  /* Line 18 column (f) for a pass-through: the credit the entity reported. */
  passThroughCredit?: number;
  /*
   * A held bond: true when the credit is already in box 1 of a Form 1099-INT
   * the taxpayer received, so Schedule B has it; false when no information
   * return reports it as interest (irs-8912-inst-2025::sec::line-20::b01).
   */
  creditOnForm1099Int?: boolean;
  /* A pass-through clean renewable energy bond: the taxable income attributable to the interest (line-12::b02). */
  attributableTaxableIncome?: number;
}

export interface BondTaxCreditStatementFact {
  key: string;
  value: BondTaxCreditStatementValue;
}

export interface TaxCreditBondFact {
  key: string;
  value: TaxCreditBondFactValue;
}

const STATEMENT_SUFFIX = ".bond_tax_credit";
const ACCOUNT_PREFIX = "account.";
const BOND_PREFIX = "tax_credit_bond.";

/*
 * Line 3: the credit carryforward from earlier years for qualified tax credit
 * bonds and build America bonds, a number (irs-8912-inst-2025::sec::line-3::b01).
 * A clean renewable energy bond credit cannot be carried forward.
 */
export const TAX_CREDIT_BOND_CARRYFORWARD_KEY = "prior_year.tax_credit_bond_credit_carryforward";

/* A Form 1097-BTC from one filer for one account: account.<slug>.bond_tax_credit (a document). */
export function makeBondTaxCreditStatementFactKey(accountSlug: string): string {
  return `${ACCOUNT_PREFIX}${accountSlug}${STATEMENT_SUFFIX}`;
}

export function isBondTaxCreditStatementFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 3 && `${parts[0]}.` === ACCOUNT_PREFIX && `.${parts[2]}` === STATEMENT_SUFFIX
  );
}

export function makeTaxCreditBondFactKey(bondSlug: string): string {
  return `${BOND_PREFIX}${bondSlug}`;
}

export function isTaxCreditBondFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === BOND_PREFIX && parts[1] !== "";
}

/* Every Form 1097-BTC, in the order recorded: the order of Part III's rows. */
export function getBondTaxCreditStatementFacts(
  facts: ReadonlyArray<FactRow>,
): BondTaxCreditStatementFact[] {
  return facts
    .filter((row) => row.category === BOND_CATEGORY && isBondTaxCreditStatementFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as BondTaxCreditStatementValue }));
}

/* Every Part IV bond, in the order recorded: the order of the Parts IV. */
export function getTaxCreditBondFacts(facts: ReadonlyArray<FactRow>): TaxCreditBondFact[] {
  return facts
    .filter((row) => row.category === BOND_CATEGORY && isTaxCreditBondFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as TaxCreditBondFactValue }));
}
