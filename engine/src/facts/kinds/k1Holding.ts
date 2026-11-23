/*
 * The holding: the owner's answers about one K-1 entity that no K-1 prints.
 * One fact per entity, category k1, keyed by the same id as the entity's K-1
 * fact (scheduleK1.ts). The loss limits (federal/passThrough/limits.ts) read
 * it in the order the law sets: basis, at-risk, passive, excess business loss
 * (irs-1120sk1-inst-2025::sec::additional-information::b01).
 *
 * The limits read owner, materiallyParticipated, the Form 7203 fields (basis
 * at the start, contributions, loans, carried basis losses), the partner's
 * basis at the start, allInvestmentAtRisk, the passive answers (active
 * participation, real estate professional), carriedLosses, disposedOfEntirely
 * and gainOnDisposition. stockAcquiredAs is here for Form 7203's header.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Losses and deductions an S corporation shareholder or a partner could not
 * deduct last year because of the basis limit, by item, positive amounts: last
 * year's Form 7203 Part III column (e), this year's column (b), or the
 * Partner's Basis Worksheet line 15 columns E and B. They keep their character
 * (irs-7203-inst-2025::sec::part-iii::b01) and are carried forward indefinitely
 * (irs-7203-inst-2025::sec::basis-limitations::b01).
 */
export interface K1CarriedBasisLosses {
  /* Line 35. */
  ordinaryBusinessLoss?: number;
  /* Line 36. */
  netRentalRealEstateLoss?: number;
  /* Line 37. */
  otherNetRentalLoss?: number;
  /* Line 38, the short-term part. */
  netShortTermCapitalLoss?: number;
  /* Line 38, the long-term part. */
  netLongTermCapitalLoss?: number;
  /* Line 39. */
  netSection1231Loss?: number;
  /* Line 40. */
  otherLoss?: number;
  /* Line 41. */
  section179Deduction?: number;
  /* Line 42: cash contributions to 60% organizations (Schedule K-1 box 12 code A). */
  cashCharitableContributions?: number;
  /* Line 42: every other kind of contribution (box 12 codes B to G). */
  otherCharitableContributions?: number;
  /* Line 43. */
  investmentInterestExpense?: number;
  /* Line 44. */
  section59eExpenditures?: number;
  /* Line 45. */
  otherDeductions?: number;
  /* Line 46. */
  foreignTaxes?: number;
}

/* Losses held back from earlier years, by the limit that held them, positive amounts. */
export interface K1CarriedLosses {
  /* Not allowed by the basis limit, by item (Form 7203 Part III column (b)). */
  basis?: K1CarriedBasisLosses;
  /* Not allowed by the at-risk limit (irs-1120sk1-inst-2025::sec::at-risk-limitations::b03). Form 6198. */
  atRisk?: number;
  /* Prior-year unallowed passive loss (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b08). Form 8582. */
  passive?: number;
}

export interface K1HoldingFactValue {
  /* On a joint return, whose K-1 it is: the shareholder, partner or beneficiary it names. */
  owner?: "taxpayer" | "spouse";
  /*
   * The owner materially participated in the entity's trade or business
   * activities (the seven tests, irs-1120sk1-inst-2025::sec::passive-activity-limitations::b04
   * to ::b07). True makes them nonpassive (::b08). Asked for every K-1 with a
   * trade or business item.
   */
  materiallyParticipated?: boolean;
  /*
   * The owner actively participated in the entity's rental real estate, for
   * the $25,000 special allowance (::b09, ::b10): Form 8582 Part IV. A limited
   * partner cannot (irs-1065k1-inst-2025::sec::passive-activity-limitations::b16),
   * so a partnership K-1 that names a limited partner does not ask.
   */
  activelyParticipated?: boolean;
  /*
   * The owner, or on a joint return the spouse, was a real estate professional
   * and materially participated in the entity's rental real estate (::b02):
   * the rental is then nonpassive. Asked for a partnership K-1 with a rental item.
   */
  realEstateProfessional?: boolean;
  /*
   * S corporation stock basis at the start of the corporation's tax year (Form
   * 7203 line 1): last year's line 15. Asked when the K-1 has a loss, a
   * deduction, a distribution or a carried basis loss.
   */
  stockBasisAtStart?: number;
  /*
   * Capital contributed or stock bought during the year (Form 7203 line 2), or
   * a partnership interest bought and money or property contributed (the
   * Partner's Basis Worksheet line 2, irs-1065k1-inst-2025::sec::line-2::b01);
   * absent means none.
   */
  capitalContributions?: number;
  /*
   * The balance of the shareholder's loans to the corporation at the start of
   * the year (Form 7203 line 16, column (d)); absent means no loans.
   */
  loanBalanceAtStart?: number;
  /* New loans to the corporation during the year (Form 7203 line 17, column (d)); absent means none. */
  newLoans?: number;
  /*
   * Debt basis of those loans at the start of the year (Form 7203 line 21,
   * column (d)): below the balance when losses reduced it. Asked when the
   * shareholder has loans and stock basis does not cover the losses.
   */
  debtBasisAtStart?: number;
  /* How the stock was acquired (Form 7203 item D). */
  stockAcquiredAs?: "original_shareholder" | "purchased" | "inherited" | "gift" | "other";
  /*
   * Adjusted basis of the partnership interest at the start of the year, its
   * share of liabilities included: the Partner's Basis Worksheet line 1, last
   * year's line 18 (irs-1065k1-inst-2025::sec::line-1::b01). Asked when the
   * K-1 has a loss, a deduction, a distribution or a carried basis loss.
   */
  partnershipBasisAtStart?: number;
  /*
   * All of the investment in the activity is at risk (Form 6198 not needed). The
   * at-risk stage asks for it when the K-1 has a loss or deduction from the activity.
   */
  allInvestmentAtRisk?: boolean;
  /* Losses held back from earlier years, by limit. */
  carriedLosses?: K1CarriedLosses;
  /*
   * The qualified part (QBI) of the ordinary business loss in carriedLosses.basis,
   * a positive amount: the QBI Loss Tracking Worksheet's column I
   * (irs-8995-inst-2025::sec::specific-instructions-2::b01). Losses from before
   * 2018 are not qualified (::determining-your-qualified-business::b03). Asked
   * when a carried ordinary loss is allowed this year.
   */
  carriedQualifiedBusinessLoss?: number;
  /*
   * The owner disposed of the entire interest this year: a sale of S corporation
   * stock or of a partnership interest, or a trust that ended
   * (irs-1120sk1-inst-2025::sec::sale-of-s-corporation-stock::b01). For a
   * partnership it means a fully taxable disposition to an unrelated person,
   * which releases the carried passive losses
   * (irs-8582-inst-2025::sec::former-passive-activities::b02).
   */
  disposedOfEntirely?: boolean;
  /*
   * The gain (a loss negative) on that disposition, as the owner reports it on
   * Form 8949: it decides whether the activity has an overall gain or loss
   * (irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b01).
   * Asked for a partnership K-1 when disposedOfEntirely is true.
   */
  gainOnDisposition?: number;
}

const HOLDING_PREFIX = "k1.holding.";

/* The same id as the entity's K-1 fact (makeSCorporationK1FactKey and the others). */
export function makeK1HoldingFactKey(entityId: string): string {
  return `${HOLDING_PREFIX}${entityId}`;
}

export function isK1HoldingFactKey(key: string): boolean {
  return (
    key.startsWith(HOLDING_PREFIX) &&
    key.length > HOLDING_PREFIX.length &&
    !key.includes(".", HOLDING_PREFIX.length)
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isOptionalAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isOptionalSigned = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value));

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

const AMOUNT_FIELDS = [
  "stockBasisAtStart",
  "capitalContributions",
  "loanBalanceAtStart",
  "newLoans",
  "debtBasisAtStart",
  "partnershipBasisAtStart",
  "carriedQualifiedBusinessLoss",
] as const;

/* The items a basis loss is carried by; any other key makes the holding malformed. */
export const CARRIED_BASIS_LOSS_ITEMS = [
  "ordinaryBusinessLoss",
  "netRentalRealEstateLoss",
  "otherNetRentalLoss",
  "netShortTermCapitalLoss",
  "netLongTermCapitalLoss",
  "netSection1231Loss",
  "otherLoss",
  "section179Deduction",
  "cashCharitableContributions",
  "otherCharitableContributions",
  "investmentInterestExpense",
  "section59eExpenditures",
  "otherDeductions",
  "foreignTaxes",
] as const satisfies ReadonlyArray<keyof K1CarriedBasisLosses>;

const isAmountsByKey = (value: unknown, keys: ReadonlyArray<string>): boolean =>
  value === undefined ||
  (isRecord(value) &&
    Object.entries(value).every(([key, amount]) => keys.includes(key) && isOptionalAmount(amount)));

/* The three limits a loss can be carried under; any other key makes the holding malformed. */
function isCarriedLosses(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  const { basis, ...others } = value;
  return (
    isAmountsByKey(basis, CARRIED_BASIS_LOSS_ITEMS) && isAmountsByKey(others, ["atRisk", "passive"])
  );
}

const ACQUIRED_AS: ReadonlyArray<unknown> = [
  undefined,
  "original_shareholder",
  "purchased",
  "inherited",
  "gift",
  "other",
];

const BOOLEAN_FIELDS = [
  "materiallyParticipated",
  "activelyParticipated",
  "realEstateProfessional",
  "allInvestmentAtRisk",
  "disposedOfEntirely",
] as const;

function isHolding(value: unknown): value is K1HoldingFactValue {
  if (!isRecord(value)) return false;
  return (
    (value.owner === undefined || value.owner === "taxpayer" || value.owner === "spouse") &&
    AMOUNT_FIELDS.every((field) => isOptionalAmount(value[field])) &&
    isOptionalSigned(value.gainOnDisposition) &&
    BOOLEAN_FIELDS.every((field) => isOptionalBoolean(value[field])) &&
    ACQUIRED_AS.includes(value.stockAcquiredAs) &&
    isCarriedLosses(value.carriedLosses)
  );
}

/* Each holding fact whose fields have their types, by key; a malformed one is listed. */
export function readK1HoldingFacts(facts: ReadonlyArray<FactRow>): {
  holdings: Map<string, K1HoldingFactValue>;
  malformedKeys: string[];
} {
  const rows = facts.filter((fact) => fact.category === "k1" && isK1HoldingFactKey(fact.key));
  return {
    holdings: new Map(
      rows
        .filter((row) => isHolding(row.value))
        .map((row) => [row.key, row.value as K1HoldingFactValue]),
    ),
    malformedKeys: rows.filter((row) => !isHolding(row.value)).map((row) => row.key),
  };
}
