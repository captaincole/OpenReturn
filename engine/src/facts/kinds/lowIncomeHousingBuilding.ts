/*
 * Form 8609-A, Annual Statement for Low-Income Housing Credit: one fact for each
 * building the taxpayer owns directly, and one more for its section 42(e)
 * rehabilitation expenditures, which "are treated as creating a new building"
 * (irs-8609a-inst-2025::sec::specific-instructions::b01). Category rental.
 * The owner files a Form 8609-A "for each year of the 15-year compliance
 * period" (::general-instructions::b01).
 *
 * The amounts of Form 8609 (Part I from the housing credit agency, Part II the
 * owner's first-year certification) are a document: `form8609`. The rest are
 * the owner's answers about 2025, from the building's records.
 *
 * A partner, shareholder or beneficiary of an entity that owns the building
 * files only Form 8586 (::general-instructions::b01): no fact of this kind.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * One count of the building's residential rental units and their floor space.
 * Line 2 is "the smaller of the fractional amount of low-income units to all
 * residential rental units (the 'unit fraction') or the fractional amount of
 * floor space" (::line-2::b01). Residential rental units are all units,
 * whether or not occupied.
 */
export interface LowIncomeFractions {
  lowIncomeUnits: number;
  residentialUnits: number;
  /* Square feet. */
  lowIncomeFloorSpace: number;
  residentialFloorSpace: number;
}

/* The building's Form 8609, as the agency issued it and the owner completed Part II. */
export interface Form8609Amounts {
  /* Part I, item E: the building identification number (Form 8609-A item A). */
  buildingIdentificationNumber: string;
  /* Part I, line 1b: the maximum housing credit dollar amount (Form 8609-A line 15's limit). */
  maximumCreditAmount: number;
  /* Part I, line 2: the maximum applicable credit percentage, as a decimal (9% is 0.09). */
  creditPercentage: number;
  /* Part I, line 3a: the maximum qualified basis. */
  maximumQualifiedBasis: number;
  /*
   * Part I, line 3b: the percentage to which a high-cost area raised the eligible
   * basis, as a decimal (130% is 1.3); absent when the box is not checked.
   */
  highCostBasisPercentage?: number;
  /* Part II, line 7: the eligible basis of the building (Form 8609-A line 1, ::line-1::b01). */
  eligibleBasis: number;
  /* Part II, line 8a: the original qualified basis at the close of the first year of the credit period. */
  originalQualifiedBasis: number;
  /* Part II: the first year of the credit period. */
  firstCreditYear: number;
}

/*
 * The owner's interest in 2025. Dates are YYYY-MM-DD; the date of a sale is the
 * seller's last day. The month rule of line 4 (::line-4::b01) turns the dates
 * into days owned.
 */
export interface LowIncomeHousingOwnership {
  /* The share of the building the owner holds (1 for the whole building, 0.6 for 60%). */
  share: number;
  /* The owner had no interest before and acquired the building, or the share, on this date. */
  acquiredOn?: string;
  /* The owner disposed of the building, or the entire interest, on this date. */
  disposedOn?: string;
  /*
   * With a disposition: the owner followed the procedures that prevent recapture
   * (a disposition after July 30, 2008: it is reasonably expected that the
   * building stays a qualified low-income building for the rest of the
   * compliance period; before: a bond or Treasury securities)
   * (::recapture-of-credit::b02). Without them, line 3 is zero (::line-3-2::b03).
   */
  recaptureAvoided?: boolean;
  /*
   * Part of the interest changed hands and the owner kept some: the last day at
   * `share`, then `shareAfter` to the end of the year (::line-16::b01–b04).
   * For a decrease, recaptureAvoided says whether the procedures were followed.
   */
  interestChange?: { on: string; shareAfter: number; recaptureAvoided?: boolean };
}

/*
 * The Line 11 Worksheet's inputs, for a year whose qualified basis rose over the
 * previous year's (::line-11::b01; the worksheet is printed in ::line-14::b02–b04).
 */
export interface LowIncomeHousingIncrease {
  /* The previous year's Form 8609-A, line 1 and line 2 as printed (worksheet line 2). */
  priorYearEligibleBasis: number;
  priorYearLowIncomePortion: number;
  /* The building at the end of each month of 2025, January first (worksheet line 4). */
  monthEnds: LowIncomeFractions[];
}

/* The first year of the credit period, for line 17 in the 11th year and the worksheet in year 2. */
export interface LowIncomeHousingFirstYear {
  /* That year's Form 8609-A line 2: the first-year modified percentage. */
  modifiedPortion: number;
  /* The low-income portion at the close of that year, before the modified percentage. */
  yearEndPortion: number;
}

export interface LowIncomeHousingBuildingFactValue {
  form8609: Form8609Amounts;
  /* Item B: the building (new or existing), or its section 42(e) rehabilitation expenditures. */
  allocation: "building" | "rehabilitation";
  /* Item C: the original Form 8609 (or a copy) signed by the agency is in the owner's records. */
  hasSignedForm8609: boolean;
  /* Item D: the building was part of a qualified low-income housing project and met section 42 at the end of 2025. */
  qualifiedAtYearEnd: boolean;
  /* Item E: the qualified basis decreased in 2025. */
  qualifiedBasisDecreased: boolean;
  /*
   * Line 2: the building at the close of 2025, or on the disposal date when the
   * owner disposed of the building or the entire interest
   * (::proc-2014-49-2014-37-i-r-b-535-at-irs-gov-pub-irs-drop::b01).
   */
  yearEnd: LowIncomeFractions;
  /* The first year of the credit period only: the building at the end of each full month in service. */
  firstYearMonthEnds?: LowIncomeFractions[];
  /*
   * The agency figured Form 8609 line 3a with only the eligible basis needed for
   * the line 1b credit, so line 3 is limited to line 3a (::line-3-2::b01).
   */
  limitedToMaximumQualifiedBasis: boolean;
  /* The deep rent skewed (15-40) election of Form 8609 line 10d, and whether it was violated (::line-3-2::b01). */
  deepRentSkewed: "not_elected" | "met" | "violated";
  /*
   * The owner borrowed against the building and is protected against loss, or
   * borrowed from a person with an interest other than as a creditor: the
   * at-risk limit of section 42(k) (::line-3-2::b04).
   */
  atRiskFinancing: boolean;
  ownership: LowIncomeHousingOwnership;
  /*
   * Line 5: a building allocated a 70% present value percentage that later got a
   * federal subsidy uses the 30% present value percentage from then on
   * (::line-5::b01, b02): that percentage as a decimal. Absent: Form 8609 line 2.
   */
  subsidizedCreditPercentage?: number;
  /*
   * Line 5: the minimum percentage that applies (::line-5::b02, b03): 4% for a
   * new federally subsidized or an existing building placed in service after
   * 2020 with an allocation or bonds after 2020 (and none of the exceptions of
   * Rev. Rul. 2021-20), 9% for a new building not federally subsidized placed
   * in service after July 30, 2008. Absent: none.
   */
  minimumCreditPercentage?: "four_percent" | "nine_percent";
  /*
   * Line 14, step 1: the federal grants for the building in the compliance
   * period that did not already reduce line 1 (before July 31, 2008: grants
   * received; after July 30, 2008: costs financed by a grant) (::line-14::b01).
   * Absent: none.
   */
  federalGrants?: number;
  /* The Line 11 Worksheet, needed when the qualified basis rose over the previous year's. */
  increase?: LowIncomeHousingIncrease;
  /* Needed in the 11th year (line 17) and for the worksheet in the second year. */
  firstYear?: LowIncomeHousingFirstYear;
}

export interface LowIncomeHousingBuildingFact {
  key: string;
  value: LowIncomeHousingBuildingFactValue;
}

const BUILDING_CATEGORY = "rental";
const BUILDING_PREFIX = "low_income_housing_building.";

/* One building (or its rehabilitation allocation); the slug is Cade's id for it. */
export function makeLowIncomeHousingBuildingFactKey(buildingSlug: string): string {
  return `${BUILDING_PREFIX}${buildingSlug}`;
}

export function isLowIncomeHousingBuildingFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === BUILDING_PREFIX && parts[1] !== "";
}

/* Every building fact, in the order recorded: the order of the Forms 8609-A. */
export function getLowIncomeHousingBuildingFacts(
  facts: ReadonlyArray<FactRow>,
): LowIncomeHousingBuildingFact[] {
  return facts
    .filter(
      (row) => row.category === BUILDING_CATEGORY && isLowIncomeHousingBuildingFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as LowIncomeHousingBuildingFactValue }));
}
