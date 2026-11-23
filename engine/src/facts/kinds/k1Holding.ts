/*
 * The holding: the owner's answers about one K-1 entity that no K-1 prints.
 * One fact per entity, category k1, keyed by the same id as the entity's K-1
 * fact (scheduleK1.ts). The loss limits (federal/passThrough/limits.ts) read
 * it in the order the law sets: basis, at-risk, passive, excess business loss
 * (irs-1120sk1-inst-2025::sec::additional-information::b01).
 *
 * Pull request 1 reads owner, materiallyParticipated, carriedLosses and
 * disposedOfEntirely. The other fields are here so later work has one place to
 * add rules: basis (Form 7203), at-risk (Form 6198), passive (Form 8582).
 */

type FactRow = { key: string; value: unknown; category: string };

/* Losses held back from earlier years, by the limit that held them, positive amounts. */
export interface K1CarriedLosses {
  /*
   * Not allowed by the basis limit; carried forward indefinitely
   * (irs-1120sk1-inst-2025::sec::basis-limitations::b01). Form 7203 Part IV column (b).
   */
  basis?: number;
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
   * the $25,000 special allowance (::b09, ::b10). Read by Form 8582 later.
   */
  activelyParticipated?: boolean;
  /*
   * The owner, or on a joint return the spouse, was a real estate professional
   * and materially participated in the entity's rental real estate (::b02). Read later.
   */
  realEstateProfessional?: boolean;
  /* Stock basis at the start of the year (S corporation; Form 7203 line 1). Read later. */
  stockBasisAtStart?: number;
  /* Debt basis at the start of the year (S corporation loans; Form 7203 line 16). Read later. */
  debtBasisAtStart?: number;
  /* Adjusted basis of the partnership interest at the start of the year (the Partner's Basis Worksheet line 1). Read later. */
  partnershipBasisAtStart?: number;
  /* All of the investment in the activity is at risk (Form 6198 not needed). Read later. */
  allInvestmentAtRisk?: boolean;
  /* Losses held back from earlier years, by limit. */
  carriedLosses?: K1CarriedLosses;
  /*
   * The owner disposed of the entire interest this year: a sale of S corporation
   * stock or of a partnership interest, or a trust that ended. Read later
   * (irs-1120sk1-inst-2025::sec::sale-of-s-corporation-stock::b01).
   */
  disposedOfEntirely?: boolean;
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

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

const AMOUNT_FIELDS = ["stockBasisAtStart", "debtBasisAtStart", "partnershipBasisAtStart"] as const;
const BOOLEAN_FIELDS = [
  "materiallyParticipated",
  "activelyParticipated",
  "realEstateProfessional",
  "allInvestmentAtRisk",
  "disposedOfEntirely",
] as const;

function isHolding(value: unknown): value is K1HoldingFactValue {
  if (!isRecord(value)) return false;
  const carried = value.carriedLosses;
  return (
    (value.owner === undefined || value.owner === "taxpayer" || value.owner === "spouse") &&
    AMOUNT_FIELDS.every((field) => isOptionalAmount(value[field])) &&
    BOOLEAN_FIELDS.every((field) => isOptionalBoolean(value[field])) &&
    (carried === undefined || (isRecord(carried) && Object.values(carried).every(isOptionalAmount)))
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
