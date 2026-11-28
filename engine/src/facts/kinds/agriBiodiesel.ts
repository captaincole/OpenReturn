/*
 * Form 8864: the section 40A small agri-biodiesel producer credit, the only
 * part of the credit a 2025 return can claim for its own fuel. "The credit
 * period for the section 40A, biodiesel credit, biodiesel mixture credit, and
 * renewable diesel credit, and the section 40B, sustainable aviation fuels
 * credit, expired for fuel sold or used after December 31, 2024"
 * (irs-8864-inst-2025::sec::what-s-new::b02); the producer credit runs through
 * 2026 (what-s-new::b01).
 *
 * One fact per Schedule C business that produced agri-biodiesel, holding the
 * gallons from the producer's own records. No information return reports them:
 * the producer states them. A credit from a partnership or S corporation is not
 * a fact of this kind: it is the K-1's box 15 or box 13 code AC
 * (federal/passThrough), with one answer of its own (K1BiodieselCreditAnswer).
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * A section 6418 transfer election: the producer sells part or all of the
 * credit for fuel sold or used after June 30, 2025 to an unrelated buyer
 * (irs-8864-inst-2025::sec::what-s-new::b01). Line A prints the number.
 */
export interface AgriBiodieselTransfer {
  /* The IRS-issued pre-filing registration number (irs-8864-inst-2025::sec::specific-instructions::b01). */
  registrationNumber: string;
  /* The credit transferred, in dollars: Form 3800 Part III line 1l column (f). */
  amount: number;
}

export interface AgriBiodieselProductionFactValue {
  /* The Schedule C business (`business.<id>`) that produced the fuel; line 9 is its other income. */
  businessKey: string;
  /*
   * Line 7 column (a): gallons of agri-biodiesel the business produced and sold
   * or used in 2025 before July 1, for a qualified use: sold to a blender for a
   * qualified biodiesel mixture, sold for use as a fuel in a trade or business,
   * sold at retail into a buyer's fuel tank, or used by the producer for one of
   * those (irs-8864-inst-2025::sec::qualified-agri-biodiesel-production::b01, ::b02).
   * Agri-biodiesel only: biodiesel derived solely from virgin oils or animal fats
   * (definitions-and-special-rules::b01); renewable diesel is not.
   */
  gallonsBeforeJuly: number;
  /*
   * Line 8 column (a): the same, for fuel sold or used after June 30, 2025, and
   * only the gallons exclusively derived from feedstock produced or grown in the
   * United States, Mexico, or Canada (qualified-agri-biodiesel-production::b02).
   */
  gallonsAfterJune: number;
  /*
   * The business's productive capacity for agri-biodiesel, in gallons, at its
   * highest during 2025. An eligible small producer has no more than 60 million
   * gallons at all times (qualified-agri-biodiesel-production::b02).
   */
  productiveCapacityGallons: number;
  /* The producer is registered with the IRS on Form 637 (qualified-agri-biodiesel-production::b02). */
  registeredOnForm637: boolean;
  transfer?: AgriBiodieselTransfer;
}

export interface AgriBiodieselProductionFact {
  key: string;
  value: AgriBiodieselProductionFactValue;
}

const PRODUCTION_CATEGORY = "self_employment";
const PRODUCTION_PREFIX = "agri_biodiesel.";

export function makeAgriBiodieselFactKey(businessId: string): string {
  return `${PRODUCTION_PREFIX}${businessId}`;
}

export function isAgriBiodieselFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === PRODUCTION_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isTransfer(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null) return false;
  const transfer = value as Record<string, unknown>;
  return (
    typeof transfer.registrationNumber === "string" &&
    transfer.registrationNumber !== "" &&
    isAmount(transfer.amount)
  );
}

function isProduction(value: unknown): value is AgriBiodieselProductionFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fact = value as Record<string, unknown>;
  return (
    typeof fact.businessKey === "string" &&
    isAmount(fact.gallonsBeforeJuly) &&
    isAmount(fact.gallonsAfterJune) &&
    isAmount(fact.productiveCapacityGallons) &&
    typeof fact.registeredOnForm637 === "boolean" &&
    isTransfer(fact.transfer)
  );
}

/* Every production fact, in the order recorded; a malformed one is left out and listed. */
export function readAgriBiodieselFacts(facts: ReadonlyArray<FactRow>): {
  productions: AgriBiodieselProductionFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === PRODUCTION_CATEGORY && isAgriBiodieselFactKey(row.key),
  );
  return {
    productions: rows
      .filter((row) => isProduction(row.value))
      .map((row) => ({ key: row.key, value: row.value as AgriBiodieselProductionFactValue })),
    malformedKeys: rows.filter((row) => !isProduction(row.value)).map((row) => row.key),
  };
}

/*
 * The owner's answer for a K-1's box 15 (Form 1065) or box 13 (Form 1120-S)
 * code AC, from the statement the entity attaches: "If this credit includes the
 * small agri-biodiesel producer credit, the partnership will provide additional
 * information on an attached statement" (irs-1065k1-inst-2025::sec::box-15-credits::b09),
 * "the number of gallons for which it claimed the credit and its productive
 * capacity for agri-biodiesel" (irs-8864-inst-2025::sec::line-10::b01).
 */
export interface K1BiodieselCreditAnswer {
  /*
   * The part of the code AC amount that is the sustainable aviation fuel credit,
   * which goes to Form 3800 Part III line 1ff, not 1l (irs-8864-inst-2025::sec::line-11::b01).
   * 0 when none: only an entity whose tax year began in 2024 can pass one
   * (general-instructions::b01).
   */
  safCredit: number;
  /* The statement for the small agri-biodiesel producer credit; absent when the K-1 has none. */
  agriBiodiesel?: { gallons: number; productiveCapacityGallons: number };
}

const K1_ANSWER_PREFIX = "k1_biodiesel_credit.";

/* The code AC answer of one K-1, by the K-1 fact key; category k1. */
export const makeK1BiodieselCreditKey = (k1Key: string): string => `${K1_ANSWER_PREFIX}${k1Key}`;

export function isK1BiodieselCreditAnswer(value: unknown): value is K1BiodieselCreditAnswer {
  if (typeof value !== "object" || value === null) return false;
  const answer = value as Record<string, unknown>;
  if (!isAmount(answer.safCredit)) return false;
  if (answer.agriBiodiesel === undefined) return true;
  const statement = answer.agriBiodiesel as Record<string, unknown> | null;
  return (
    typeof statement === "object" &&
    statement !== null &&
    isAmount(statement.gallons) &&
    isAmount(statement.productiveCapacityGallons)
  );
}

/* The agri-biodiesel statements of the K-1 answers recorded, by K-1 key (a malformed answer has none). */
export function k1AgriBiodieselStatements(
  facts: ReadonlyArray<FactRow>,
): Array<{ k1Key: string; gallons: number; productiveCapacityGallons: number }> {
  const k1Keys = new Set(facts.filter((row) => row.category === "k1").map((row) => row.key));
  return facts.flatMap((row) => {
    if (row.category !== "k1" || !row.key.startsWith(K1_ANSWER_PREFIX)) return [];
    const k1Key = row.key.slice(K1_ANSWER_PREFIX.length);
    if (!k1Keys.has(k1Key) || !isK1BiodieselCreditAnswer(row.value)) return [];
    const statement = row.value.agriBiodiesel;
    return statement === undefined ? [] : [{ k1Key, ...statement }];
  });
}
