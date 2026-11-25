/*
 * Form 8911 and Schedule A (Form 8911): the alternative fuel vehicle refueling
 * property credit, for example a home electric vehicle charger. One fact per
 * single item of property placed in service in the tax year: "complete and file
 * a separate Schedule A (Form 8911) for each item of qualified alternative fuel
 * vehicle refueling property" (irs-8911-inst-2025::sec::specific-instructions-for-form::b01).
 * A charging port is one item (IRS Publication 6027). The installer's invoice
 * gives the cost; the other answers are the taxpayer's.
 *
 * A credit from a partnership or an S corporation (K-1 box 15 or box 13, code
 * AO) is not a fact of this kind: Form 8911 line 2 reads the K-1 fact.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface RefuelingPropertyFactValue {
  /* Schedule A line 2a: "Level 2 home charger, garage", as the taxpayer names it. */
  description: string;
  /* Line 5: the date the property was placed in service (operational), YYYY-MM-DD (line-5::b01). */
  placedInServiceDate: string;
  /*
   * Line 4: the date construction began, YYYY-MM-DD (line-4::b01). Before
   * January 29, 2023, line 13 is "Yes" with no further test. Absent: not stated.
   */
  constructionBeganDate?: string;
  /*
   * Line 6a: the property's 11-digit census tract GEOID is in the IRS list of
   * eligible tracts (line-6::b01). False: no credit for this property.
   */
  eligibleCensusTract: boolean;
  /* Line 6b: the 11-digit census tract GEOID. */
  censusTractGeoid?: string;
  /*
   * Line 8: the cost of the single item, with the cost of the associated
   * property directly attributable to it (wall mount, panel and wiring used
   * only for it) and labor (IRS Publication 6027). A cost shared by several
   * items is split among them.
   */
  cost: number;
  /* Line 9: the business/investment use percentage, 0 to 100; 0 for a charger used only at home. */
  businessUsePercent: number;
  /*
   * Line 9: the months of business/investment use when the use changed in the
   * year; line 9 is the percentage times the months, divided by 12
   * (irs-8911-inst-2025::sec::line-9::b01). Absent: the whole year.
   */
  businessUseMonths?: number;
  /* Line 11: the section 179 expense deduction taken for the property on Form 4562 Part I (line-11::b01). Absent: none. */
  section179Deduction?: number;
  /*
   * Line 13: the property is part of a project that meets the prevailing wage
   * and apprenticeship requirements (line-13::b01). Needed only when line 10 is
   * above 0 and construction did not begin before January 29, 2023.
   */
  meetsPwaRequirements?: boolean;
  /* Line 17: installed on property used as the taxpayer's main home. Needed when line 9 is below 100%. */
  mainHome?: boolean;
}

export interface RefuelingPropertyFact {
  key: string;
  value: RefuelingPropertyFactValue;
}

const PROPERTY_CATEGORY = "other";
const PROPERTY_PREFIX = "refueling_property.";

export function makeRefuelingPropertyFactKey(propertySlug: string): string {
  return `${PROPERTY_PREFIX}${propertySlug}`;
}

export function isRefuelingPropertyFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === PROPERTY_PREFIX && parts[1] !== "";
}

/* Every refueling property fact, in the order recorded: the order of the Schedules A. */
export function getRefuelingPropertyFacts(facts: ReadonlyArray<FactRow>): RefuelingPropertyFact[] {
  return facts
    .filter((row) => row.category === PROPERTY_CATEGORY && isRefuelingPropertyFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as RefuelingPropertyFactValue }));
}
