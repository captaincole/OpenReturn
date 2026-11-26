/*
 * Form 4136: the credit for federal excise tax paid on fuels used for a
 * nontaxable use (irs-4136-inst-2025::sec::general-instructions::b01). One fact
 * per business activity, holding that activity's claims: "If you have more than
 * one qualifying business or business activity ... you must use a separate
 * Schedule A (Form 4136) for each" (irs-4136-inst-2025::sec::part-i::b02). Home
 * use of undyed kerosene is not a business activity: its fact has the kind
 * "home_kerosene" (irs-4136-inst-2025::sec::specific-instructions::b01,
 * "Exemption").
 *
 * The taxpayer states each claim from their own fuel records (the gallons for
 * each nontaxable use, irs-pub-225-2025::sec::how-to-claim-a-credit-or::b01). No
 * information return reports them. A partner states the gallons on the
 * partnership's Schedule K-1 statement the same way
 * (irs-4136-inst-2025::sec::general-instructions::b02).
 */

type FactRow = { key: string; value: unknown; category: string };

/* The Part II lines that hold a claim: the rows of the 2025 form (9, 10 and 12 are reserved). */
export const FUEL_TAX_LINES = [
  "1a", "1b", "1c", "1d",
  "2a", "2b", "2c", "2d",
  "3a", "3b", "3c", "3d", "3e",
  "4a", "4b", "4c", "4d", "4e", "4f",
  "5a", "5b", "5c", "5d", "5e",
  "6a", "6b",
  "7a", "7b", "7c",
  "8a", "8b", "8c", "8d", "8e", "8f",
  "11a", "11b", "11c", "11d", "11e", "11f", "11g", "11h",
  "13a", "13b", "13c",
  "14a", "14b",
  "15a",
  "16a", "16b",
] as const; // prettier-ignore

export type FuelTaxLine = (typeof FUEL_TAX_LINES)[number];

/*
 * Line 11 column (c): "Gallons, or gasoline or diesel gallon equivalents"
 * (CNG, LPG and LNG only). The equivalents are stated, or the measure the
 * records keep: LPG in gallons or pounds, CNG in cubic feet or pounds, LNG in
 * gallons or pounds (irs-4136-inst-2025::sec::line-11::b02).
 */
export type FuelMeasure = "gallons" | "pounds" | "cubic_feet" | "gallon_equivalents";

export interface FuelTaxClaim {
  line: FuelTaxLine;
  /*
   * Column (c): the qualified gallons used (or sold) for this nontaxable use in
   * 2025. On lines 11a, 11c and 11g, the amount in `measuredIn`.
   */
  gallons: number;
  /* Lines 11a, 11c and 11g only. Absent: the amount is already in gallon equivalents. */
  measuredIn?: FuelMeasure;
  /*
   * Column (a): the number from the Type of Use Table
   * (irs-4136-inst-2025::sec::no-type-of-use::b01), on a line whose column (a)
   * is blank. A line that prints its type of use takes none (or that number).
   */
  typeOfUse?: number;
  /* Column (d): the actual cost of these gallons from the records, cents kept. */
  actualFuelCost: number;
  /* Lines 3, 4, 6 and 7: some of the fuel showed visible evidence of dye (the exception box). */
  visibleDye?: boolean;
  /* Line 13c: the kerosene was taxed at $.244, so the claim rate is $.243 (irs-4136-inst-2025::sec::line-13::b02). */
  taxedAt244?: boolean;
}

/* Part I line F (irs-4136-inst-2025::sec::specific-instructions::b01). */
export interface FuelEquipment {
  make: string;
  model: string;
  type: string;
}

export interface FuelTaxActivityFactValue {
  /* "home_kerosene": undyed kerosene used in the home for heating, lighting or cooking (line 4a, type of use 8). */
  kind: "business" | "home_kerosene";
  /*
   * The Schedule C business (`business.<id>`) or Schedule F farm (`farm.<id>`)
   * fact of this activity: Part I lines C to E come from it unless stated here.
   */
  businessKey?: string;
  /* Line C (if applicable). */
  businessName?: string;
  /* Line D: the EIN issued on Form SS-4, never an SSN; absent when there is none. */
  ein?: string;
  /* Line E: the six-digit principal business activity code. */
  principalBusinessActivityCode?: string;
  /* Line F: the equipment that used most of this activity's fuel. */
  equipment?: FuelEquipment;
  claims: FuelTaxClaim[];
}

export interface FuelTaxActivityFact {
  key: string;
  value: FuelTaxActivityFactValue;
}

/*
 * The Form 637 registration numbers, with the prefix, for the lines that need
 * one: 6 (UV or UB), 7 (UV, UP or UB), 8 (UA, or UV for type of use 14), 13
 * (CC) and 15 (M) (irs-4136-inst-2025::sec::information-for-claims-on-lines-6-8::b01).
 */
export type FuelRegistrationLine = "6" | "7" | "8" | "13" | "15";
export type FuelRegistrationNumbersValue = Partial<Record<FuelRegistrationLine, string>>;

const ACTIVITY_CATEGORY = "other";
const ACTIVITY_PREFIX = "fuel_tax_activity.";

export const FUEL_TAX_REGISTRATION_NUMBERS_KEY = "fuel_tax.registration_numbers";

export function makeFuelTaxActivityFactKey(activitySlug: string): string {
  return `${ACTIVITY_PREFIX}${activitySlug}`;
}

export function isFuelTaxActivityFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === ACTIVITY_PREFIX && parts[1] !== "";
}

/* Every activity fact, in the order recorded. */
export function getFuelTaxActivityFacts(facts: ReadonlyArray<FactRow>): FuelTaxActivityFact[] {
  return facts
    .filter((row) => row.category === ACTIVITY_CATEGORY && isFuelTaxActivityFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as FuelTaxActivityFactValue }));
}

/* The registration numbers fact; undefined when none is recorded. */
export function getFuelRegistrationNumbers(
  facts: ReadonlyArray<FactRow>,
): FuelRegistrationNumbersValue | undefined {
  const row = facts.find((each) => each.key === FUEL_TAX_REGISTRATION_NUMBERS_KEY);
  return row?.value as FuelRegistrationNumbersValue | undefined;
}
