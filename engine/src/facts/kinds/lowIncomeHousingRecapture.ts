/*
 * Form 8611, Recapture of Low-Income Housing Credit: one fact for each building
 * whose credit is recaptured in 2025, "a separate Form 8611 for each building
 * to which recapture applies" (irs-8611-form-2025::sec::face-page-1::b01).
 * Category rental. Every amount comes from the forms the owner filed in
 * earlier years: Form 8586 (the credit each year), Form 8609 (the building),
 * Form 8609-A (the qualified basis and the Line 2 Worksheet amounts), Form
 * 3800 (the credit allowed) (::purpose-of-form::b02). Form 8586 is not in the
 * engine, so the credits of earlier years are stated here.
 *
 * Two kinds of fact:
 * - "own": the owner figures lines 1 to 7 (a building held directly, or a
 *   recapture the owner figures itself);
 * - "flow_through": the recapture comes on a Schedule K-1 (partnership box 20
 *   codes F and G, S corporation box 17 codes E and F), so lines 1 to 7 are
 *   skipped and the K-1 amount is line 8 (::specific-instructions::b01). Its
 *   key is makeK1LowIncomeHousingRecaptureFactKey of the K-1 and the code's
 *   kind; the fact holds the owner's own unused credits and the building's
 *   items C to F, which the entity gives (::purpose-of-form::b02).
 */

type FactRow = { key: string; value: unknown; category: string };

/* Items C to F (::specific-instructions::b01). */
export interface LowIncomeHousingBuilding {
  /* Item C: the address as shown on Form 8609. */
  address: string;
  /* Item D: the building identification number (BIN). */
  buildingIdentificationNumber: string;
  /* Item E: the date placed in service, from Form 8609, YYYY-MM-DD. */
  placedInServiceDate: string;
  /* Item F: only for a building financed in whole or part with tax-exempt bonds. */
  taxExemptBonds?: {
    /* The entity that issued the bond, not the one that receives the financing. */
    issuerName: string;
    /* YYYY-MM-DD: generally the first date the bonds are exchanged for the price. */
    issueDate: string;
    /* The name of the issue, or another identification of it. */
    issueName: string;
    /* The CUSIP number of the bond with the latest maturity date; absent: "None". */
    cusipNumber?: string;
  };
}

/*
 * The Form 8609-A amounts one Line 2 Worksheet reads (irs-8611-form-2025::sec::part-i::b01),
 * for a prior year in which line 7 of Form 8609-A was completed (::line-2::b01).
 */
export interface Form8609AAdditionsAmounts {
  line10: number;
  line11: number;
  /* The decimal figured in step 1 of the line 14 instructions; 0 when line 14 does not apply. */
  line14Step1Decimal: number;
  line15: number;
  line16: number;
}

/* One prior year's credit for this building. */
export interface LowIncomeHousingPriorYear {
  taxYear: number;
  /*
   * The credit on that year's Form 8586 before the tax liability limit (line 1:
   * "before reduction due to the tax liability limit"; not a previous owner's
   * credit). For a flow-through fact: the owner's share the K-1 reported.
   */
  credit: number;
  /* Own facts only: that year's Form 8609-A, when its line 7 was completed. */
  additions?: Form8609AAdditionsAmounts;
}

/*
 * Why the qualified basis is lower (line 6, irs-8611-form-2025::sec::line-6::b01):
 * - disposition: the building, or an interest in it, was disposed of and it is
 *   not reasonably expected to stay a qualified low-income building for the rest
 *   of the compliance period (::purpose-of-form::b01);
 * - below_minimum_set_aside: the decrease takes the building below the
 *   minimum set-aside of section 42(g)(1);
 * - decrease: the qualified basis, figured without the additions after the
 *   first year of the credit period, at the end of the first year, of 2024 and
 *   of 2025. A casualty loss restored within a reasonable period is not a
 *   decrease (::purpose-of-form::b03).
 */
export type LowIncomeHousingBasisChange =
  | { kind: "disposition" }
  | { kind: "below_minimum_set_aside" }
  | {
      kind: "decrease";
      firstYearQualifiedBasis: number;
      priorYearEndQualifiedBasis: number;
      yearEndQualifiedBasis: number;
    };

/* The unused credits of line 9 steps 1 and 2 and line 13. */
interface UnusedCredits {
  /*
   * Step 1: the credits for this building the owner could not use in prior
   * years. "Generally, this is the amount of credit reported on line 1 ...
   * reduced by the total low-income housing credits allowed on Form 8586 or
   * Form 3800 for each year" (::line-9::b01).
   */
  unusedCredits: number;
  /* Step 2: the part of step 1 attributable to additions to qualified basis. */
  unusedCreditsFromAdditions: number;
}

export interface OwnLowIncomeHousingRecapture extends UnusedCredits {
  kind: "own";
  building: LowIncomeHousingBuilding;
  /* The first year of the credit period: line 4 counts the years from it. */
  firstCreditYear: number;
  /* Every prior year with a credit for this building (lines 1 and 2, and line 11's years). */
  priorYears: LowIncomeHousingPriorYear[];
  basisChange: LowIncomeHousingBasisChange;
  /* Line 7: the accelerated portion already recaptured on this building in earlier years; 0 for none. */
  acceleratedPortionRecapturedEarlier: number;
}

export interface FlowThroughLowIncomeHousingRecapture extends UnusedCredits {
  kind: "flow_through";
  building: LowIncomeHousingBuilding;
  /*
   * The owner's share of the credit for this building, by prior year, from the
   * K-1s of those years: line 11 places the interest in each year. Not read for
   * a section 42(j)(5) partnership, which figures the interest itself.
   */
  priorYears: LowIncomeHousingPriorYear[];
  /*
   * The entity's line 4 and line 6 decimals, from its statement: line 9 steps 3
   * and 4 multiply by them. Needed only when step 1 less step 2 is above 0.
   */
  entityRecapturePercentage?: number;
  entityBasisDecreasePercentage?: number;
}

export type LowIncomeHousingRecaptureFactValue =
  OwnLowIncomeHousingRecapture | FlowThroughLowIncomeHousingRecapture;

export interface LowIncomeHousingRecaptureFact {
  key: string;
  value: LowIncomeHousingRecaptureFactValue;
}

/* The two kinds of K-1 recapture (irs-1065k1-inst-2025::sec::box-20-other-information::b02). */
export type K1LowIncomeHousingRecaptureKind = "section_42j5" | "other";

const RECAPTURE_CATEGORY = "rental";
const RECAPTURE_PREFIX = "low_income_housing_recapture.";

/* A building the owner figures itself; the slug is Cade's id for the building. */
export function makeLowIncomeHousingRecaptureFactKey(buildingSlug: string): string {
  return `${RECAPTURE_PREFIX}${buildingSlug}`;
}

/* The building fact one K-1 recapture asks for: the K-1's id and the kind of recapture. */
export function makeK1LowIncomeHousingRecaptureFactKey(
  k1EntityId: string,
  kind: K1LowIncomeHousingRecaptureKind,
): string {
  return `${RECAPTURE_PREFIX}k1_${k1EntityId}_${kind}`;
}

export function isLowIncomeHousingRecaptureFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === RECAPTURE_PREFIX && parts[1] !== "";
}

/* Every building fact, in the order recorded. */
export function getLowIncomeHousingRecaptureFacts(
  facts: ReadonlyArray<FactRow>,
): LowIncomeHousingRecaptureFact[] {
  return facts
    .filter(
      (row) => row.category === RECAPTURE_CATEGORY && isLowIncomeHousingRecaptureFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as LowIncomeHousingRecaptureFactValue }));
}
