/*
 * The rows of Part II as one table (issue #175: one table in code and one rule
 * per column). A row's catalog fields are `<page>.line.<line>_<slug>_col_<column>`;
 * the columns a row has are the catalog's (a shaded or printed cell has no
 * field). Column (b), the rate, and column (f), the credit reference number,
 * print on the blank form and have no field.
 *
 * Rates: the 2025 form face, column (b) (irs-4136-face-2025). The bus rates of
 * type of use 5: irs-4136-inst-2025::sec::line-11::b02 (line 11) and
 * ::line-14::b01 (line 14a, $.124).
 */

import type {
  FuelMeasure,
  FuelRegistrationLine,
  FuelTaxLine,
} from "../../facts/kinds/fuelTaxCredit.js";

export type DyeBox = "3" | "4" | "6" | "7";

export interface FuelRow {
  line: FuelTaxLine;
  /* Column (b), dollars per gallon (or per gallon equivalent). */
  rate: number;
  /* The claim rate for type of use 5 (certain intercity and local buses), where the line has one. */
  busRate?: number;
  /* Column (a) as the form prints it. */
  printedUse?: number;
  /* Column (a) blank: the types of use the line allows. */
  allowedUses?: readonly number[];
  /*
   * The row whose (d) and (e) fields hold this row's amounts: "Enter the result
   * (or the combined result, as indicated by the brackets)"
   * (irs-4136-inst-2025::sec::part-ii-credits::b01). Lines 1a-1c, 3a-3b, 4a-4b
   * and 7a-7b are bracketed.
   */
  carrier: FuelTaxLine;
  registration?: FuelRegistrationLine;
  dyeBox?: DyeBox;
  /* Lines 11a, 11c and 11g: how many units of the stated measure make one gallon equivalent. */
  unitsPerEquivalent?: Partial<Record<FuelMeasure, number>>;
}

/* Types of use allowed on a line with a blank column (a), from each line's instructions. */
const LINE_1C_USES = [4, 5, 7, 11, 13, 14, 15]; // irs-4136-inst-2025::sec::line-1::b01
const LINE_2B_USES = [1, 2, 9, 10, 11, 13, 14, 15]; // ::line-2::b01
const LINES_3A_4A_USES = [2, 6, 7, 8, 11, 13, 14, 15]; // ::line-3::b01, ::line-4::b01
const LINES_4E_4F_USES = [2]; // ::line-4::b01
const LINES_5C_5D_USES = [1, 9, 10, 11, 13, 15, 16]; // ::line-5::b01
const LINES_8D_8E_USES = [1, 9, 10, 11, 13, 14, 15, 16]; // ::lines-8c-8d-8e-and-8f::b01
const LINE_11_USES = [1, 2, 4, 5, 6, 7, 11, 13, 14, 15]; // ::line-11::b02
const LINE_14A_USES = [1, 2, 5, 6, 7, 8, 11, 13, 14, 15]; // ::line-14::b01

/* The Type of Use Table numbers the rows print (irs-4136-inst-2025::sec::no-type-of-use::b01). */
const FARM = 1;
const OFF_HIGHWAY = 2;
const EXPORT = 3;
const FOREIGN_TRADE = 9;
export const BUS_USE = 5;
export const HOME_USE = 8;

/*
 * Gallon equivalents (irs-4136-inst-2025::sec::line-11::b02): a GGE of LPG is
 * 5.75 pounds or 1.353 gallons; a GGE of CNG is 5.66 pounds or 123.57 cubic
 * feet; a DGE of LNG is 6.06 pounds or 1.71 gallons.
 */
const LPG_UNITS = { gallons: 1.353, pounds: 5.75 };
const CNG_UNITS = { pounds: 5.66, cubic_feet: 123.57 };
const LNG_UNITS = { gallons: 1.71, pounds: 6.06 };

const row = (line: FuelTaxLine, rate: number, more: Partial<FuelRow> = {}): FuelRow => ({
  line,
  rate,
  carrier: line,
  ...more,
});

export const FUEL_ROWS: ReadonlyArray<FuelRow> = [
  // Line 1, gasoline (irs-4136-inst-2025::sec::line-1::b01).
  row("1a", 0.183, { printedUse: OFF_HIGHWAY, carrier: "1c" }),
  row("1b", 0.183, { printedUse: FARM, carrier: "1c" }),
  row("1c", 0.183, { allowedUses: LINE_1C_USES }),
  row("1d", 0.184, { printedUse: EXPORT }),
  // Line 2, aviation gasoline (::line-2::b01, b02).
  row("2a", 0.15),
  row("2b", 0.193, { allowedUses: LINE_2B_USES }),
  row("2c", 0.194, { printedUse: EXPORT }),
  row("2d", 0.001, { printedUse: FOREIGN_TRADE }),
  // Line 3, undyed diesel fuel (::line-3::b01).
  row("3a", 0.243, { allowedUses: LINES_3A_4A_USES, carrier: "3b", dyeBox: "3" }),
  row("3b", 0.243, { printedUse: FARM, dyeBox: "3" }),
  row("3c", 0.243, { dyeBox: "3" }),
  row("3d", 0.17, { dyeBox: "3" }),
  row("3e", 0.244, { printedUse: EXPORT, dyeBox: "3" }),
  /*
   * Line 4, undyed kerosene other than kerosene used in aviation (::line-4::b01).
   *
   * DECISION (2026-11-26, by the author): home kerosene's credit column. The
   * line 4 steps: "Multiply the gallons in column (c) by $.243. Enter the
   * result in column (d)", then carry "the amount from column (d)" to line 17
   * (irs-4136-inst-2025::sec::line-4::b02). The 2025 form: "Column (d) was
   * added to Part II ... Enter the actual fuel cost from your records"
   * (irs-4136-inst-2025::sec::part-i::b01), so column (e) is the credit. The
   * engine follows the form's columns: the credit in (e), joined with line 4b
   * by the bracket, and the kerosene's cost in (d). Line 17 is the same.
   */
  row("4a", 0.243, { allowedUses: LINES_3A_4A_USES, carrier: "4b", dyeBox: "4" }),
  row("4b", 0.243, { printedUse: FARM, dyeBox: "4" }),
  row("4c", 0.17, { dyeBox: "4" }),
  row("4d", 0.244, { printedUse: EXPORT, dyeBox: "4" }),
  row("4e", 0.043, { allowedUses: LINES_4E_4F_USES, dyeBox: "4" }),
  row("4f", 0.218, { allowedUses: LINES_4E_4F_USES, dyeBox: "4" }),
  // Line 5, kerosene used in aviation (::line-5::b01).
  row("5a", 0.2),
  row("5b", 0.175),
  row("5c", 0.243, { allowedUses: LINES_5C_5D_USES }),
  row("5d", 0.218, { allowedUses: LINES_5C_5D_USES }),
  row("5e", 0.001, { printedUse: FOREIGN_TRADE }),
  // Lines 6 to 8, registered ultimate vendors (::line-6a::b01 to ::lines-8c-8d-8e-and-8f::b02).
  row("6a", 0.243, { registration: "6", dyeBox: "6" }),
  row("6b", 0.17, { registration: "6", dyeBox: "6" }),
  row("7a", 0.243, { registration: "7", dyeBox: "7", carrier: "7b" }),
  row("7b", 0.243, { registration: "7", dyeBox: "7" }),
  row("7c", 0.17, { registration: "7", dyeBox: "7" }),
  row("8a", 0.175, { registration: "8" }),
  row("8b", 0.2, { registration: "8" }),
  row("8c", 0.025, { registration: "8" }),
  row("8d", 0.243, { registration: "8", allowedUses: LINES_8D_8E_USES }),
  row("8e", 0.218, { registration: "8", allowedUses: LINES_8D_8E_USES }),
  row("8f", 0.001, { registration: "8", printedUse: FOREIGN_TRADE }),
  // Line 11, alternative fuel (::line-11::b02), with the type of use 5 rates.
  row("11a", 0.183, { allowedUses: LINE_11_USES, busRate: 0.109, unitsPerEquivalent: LPG_UNITS }),
  row("11b", 0.183, { allowedUses: LINE_11_USES, busRate: 0.11 }),
  row("11c", 0.183, { allowedUses: LINE_11_USES, busRate: 0.109, unitsPerEquivalent: CNG_UNITS }),
  row("11d", 0.183, { allowedUses: LINE_11_USES, busRate: 0.11 }),
  row("11e", 0.243, { allowedUses: LINE_11_USES, busRate: 0.17 }),
  row("11f", 0.243, { allowedUses: LINE_11_USES, busRate: 0.17 }),
  row("11g", 0.243, { allowedUses: LINE_11_USES, busRate: 0.169, unitsPerEquivalent: LNG_UNITS }),
  row("11h", 0.183, { allowedUses: LINE_11_USES, busRate: 0.11 }),
  // Line 13, registered credit card issuers (::line-13::b01, b02).
  row("13a", 0.243, { registration: "13" }),
  row("13b", 0.243, { registration: "13" }),
  row("13c", 0.218, { registration: "13" }),
  // Line 14, diesel-water fuel emulsion (::line-14::b01).
  row("14a", 0.197, { allowedUses: LINE_14A_USES, busRate: 0.124 }),
  row("14b", 0.198, { printedUse: EXPORT }),
  // Line 15, blending (::line-15::b01); line 16, exported dyed fuels (::line-16::b01).
  row("15a", 0.046, { registration: "15" }),
  row("16a", 0.001),
  row("16b", 0.001),
];

/* Line 13c, kerosene taxed at $.244: "the claim rate is $.243" (irs-4136-inst-2025::sec::line-13::b02). */
export const LINE_13C_RATE_TAXED_AT_244 = 0.243;

export function fuelRowOf(line: string): FuelRow | undefined {
  return FUEL_ROWS.find((each) => each.line === line);
}

/* The rows whose amounts one carrier's (d) and (e) fields hold. */
export function rowsCarriedBy(carrier: FuelTaxLine): FuelRow[] {
  return FUEL_ROWS.filter((each) => each.carrier === carrier);
}
