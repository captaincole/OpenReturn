/*
 * Form 8938: specified foreign financial assets (irs-8938-inst-2025::sec::specified-foreign::b01).
 * One fact per account or asset, keyed by the same account slug as the
 * account's income facts ("account.<slug>.interest", ".dividends",
 * ".trades.<id>", ".misc"), so Part III ties each tax item to its asset.
 * The values come from the institution's statements (valuing-financial-accounts::b01)
 * and the taxpayer's answers (owner, dates).
 *
 * Return-level answers sit under FOREIGN_ASSET_KEYS.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Which part of the form reports it: a foreign deposit or custodial account
 * (Part V), or any other specified foreign financial asset, a financial
 * account other than a deposit or custodial one included (Part VI)
 * (irs-8938-inst-2025::sec::part-v::b01, part-vi::b01).
 */
export type ForeignAssetPart = "deposit_account" | "custodial_account" | "other_asset";

/*
 * Who owns it. On a joint return every owner is on the form; on any other
 * return a spouse's own asset is not (joint-interest-valuation::b01).
 * "joint_with_other": owned with someone who is not the spouse.
 */
export type ForeignAssetOwner = "taxpayer" | "spouse" | "joint_with_spouse" | "joint_with_other";

export type ForeignEntityType = "partnership" | "corporation" | "trust" | "estate";
export type ForeignPartyType = "individual" | ForeignEntityType;

export interface ForeignAddress {
  street: string;
  city: string;
  stateOrProvince?: string;
  country: string;
  postalCode?: string;
}

/*
 * Lines 24–25 and 33–34: the value is in a foreign currency. The engine
 * converts it with the Treasury rate on the last day of the tax year
 * (irs-8938-inst-2025::sec::foreign-currency-conversion::b01,
 * currency-determination-date::b01), from its table (currency/rates.ts
 * yearEndRate). The fact holds no rate.
 */
export interface AssetInForeignCurrency {
  /* ISO 4217: the currency the account is kept in, or the asset is denominated in. */
  code: string;
}

/* Line 35: the asset is stock of, or an interest in, a foreign entity. */
export interface ForeignEntity {
  name: string;
  /* The 19-character GIIN with its dots: "A1B2C3.12345.LE.756". Optional on the form. */
  giin?: string;
  type: ForeignEntityType;
  address: ForeignAddress;
}

/* Line 36: an issuer or counterparty of an asset that is not stock of, or an interest in, a foreign entity. */
export interface ForeignIssuer {
  name: string;
  role: "issuer" | "counterparty";
  type: ForeignPartyType;
  usPerson: boolean;
  address: ForeignAddress;
}

/* Lines 26–28: the foreign financial institution that keeps the account. */
export interface ForeignInstitution {
  name: string;
  giin?: string;
  address: ForeignAddress;
}

export interface ForeignFinancialAssetFactValue {
  part: ForeignAssetPart;
  owner: ForeignAssetOwner;
  /* Line 21 or 30: the account number, or another designation when there is none. */
  accountNumber: string;
  /* Line 29 (Part VI): with the class or issue of stock or securities. */
  description?: string;
  /*
   * The highest fair market value during the tax year, in the currency of
   * `foreignCurrency` (U.S. dollars without one). A value below zero counts as zero
   * (irs-8938-inst-2025::sec::assets-with-no-positive-value::b01).
   */
  maximumValue: number;
  /* The value on the last day of the tax year, in the same currency: 0 for an account closed or an asset disposed of. */
  yearEndValue: number;
  foreignCurrency?: AssetInForeignCurrency;
  /* "MM/DD/YYYY" or "Various": opened or acquired during the tax year. Absent: held before it began. */
  openedOrAcquired?: string;
  /* "MM/DD/YYYY" or "Various": closed or disposed of during the tax year. Absent: still held at its end. */
  closedOrDisposed?: string;
  /* Part V, and a Part VI financial account. */
  institution?: ForeignInstitution;
  /* Part VI stock of, or an interest in, a foreign entity. */
  entity?: ForeignEntity;
  /* Part VI any other asset: one or more issuers or counterparties. */
  issuers?: ForeignIssuer[];
  /*
   * Reported on a timely Form 3520, 3520-A, 5471, 8621 or 8865 instead: left
   * out of Parts V and VI, but counted for the threshold
   * (irs-8938-inst-2025::sec::exceptions-to-reporting::b01, foreign-grantor-trusts::b01).
   */
  reportedOnOtherForm?: boolean;
  /*
   * Part VI only: the person's answer whether the asset is a financial account
   * for Schedule B line 7a and FinCEN Form 114. true: shares in a mutual fund or
   * similar pooled fund, or an insurance or annuity policy with a cash value
   * (irs-1040sb-inst-2025::sec::line-7a-question-1-check-the-yes-box-if-at-any-time::b01).
   * false: not an account, such as stock held on a company's share register or
   * a bond held directly. Absent on a Part VI asset: Schedule B asks for it.
   * A Part V account is a financial account; the field is not read there.
   */
  financialAccount?: boolean;
}

export interface ForeignFinancialAssetFact {
  key: string;
  accountSlug: string;
  value: ForeignFinancialAssetFactValue;
}

/* Part IV: the number of each form filed that reports a specified foreign financial asset. */
export interface ExceptedFormsFactValue {
  form3520?: number;
  form3520A?: number;
  form5471?: number;
  form8621?: number;
  form8865?: number;
}

const ASSET_CATEGORY = "foreign";
const ACCOUNT_PREFIX = "account";
const ASSET_SUFFIX = "foreign_asset";

export const FOREIGN_ASSET_KEYS = {
  /*
   * true: the tax home is in a foreign country and a presence abroad test is
   * met, so the higher thresholds apply
   * (irs-8938-inst-2025::sec::types-of-reporting-thresholds::b02, b03).
   */
  livesAbroad: "foreign_assets.lives_abroad",
  /*
   * The highest total value of all the assets on any one day of the tax year,
   * in U.S. dollars. Asked only when the assets' own values do not settle the
   * "at any time during the tax year" test.
   */
  highestTotalValue: "foreign_assets.highest_total_value",
  /* false: the spouse is not a specified individual, so a joint asset counts in full on a separate return (joint-interest-valuation::b02). */
  spouseIsSpecifiedIndividual: "foreign_assets.spouse_is_specified_individual",
  /* Part IV counts (ExceptedFormsFactValue). */
  exceptedForms: "foreign_assets.excepted_forms",
} as const;

export function makeForeignFinancialAssetFactKey(accountSlug: string): string {
  return `${ACCOUNT_PREFIX}.${accountSlug}.${ASSET_SUFFIX}`;
}

export function isForeignFinancialAssetFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 3 &&
    parts[0] === ACCOUNT_PREFIX &&
    parts[1] !== "" &&
    parts[2] === ASSET_SUFFIX
  );
}

/* Every foreign asset fact, in the order recorded: the order of the rows in Parts V and VI. */
export function getForeignFinancialAssetFacts(
  facts: ReadonlyArray<FactRow>,
): ForeignFinancialAssetFact[] {
  return facts
    .filter((row) => row.category === ASSET_CATEGORY && isForeignFinancialAssetFactKey(row.key))
    .map((row) => ({
      key: row.key,
      accountSlug: row.key.split(".")[1],
      value: row.value as ForeignFinancialAssetFactValue,
    }));
}
