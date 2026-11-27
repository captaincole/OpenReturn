/*
 * Part III, one row for each sale of a facility (irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b01
 * to ::b03): the same arithmetic on every row, (e) × (f) × (g) in column (h),
 * and line 25 the total. A sale that earns no credit takes no row: a fuel
 * above 50 kg of CO2e per mmBTU is not transportation fuel, a fuel produced
 * before the registration letter gets no credit, and SAF without its
 * unrelated party certification gets no credit.
 */

import type { CleanFuelFacilityFactValue, CleanFuelSale } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { centsText, LINE_25, rowCellKey, tenthsText, type Cells } from "./cells.js";
import {
  applicableAmountOf,
  certifiedOf,
  emissionsFactorOf,
  isTransportationFuel,
  line25Of,
  PART_III_ROWS,
  qualifiedGallonsOf,
  rowCreditOf,
  YEAR_SOLD,
} from "./lines.js";

const TOO_MANY_ROWS_GAP = `Part III has ${PART_III_ROWS} rows, and the instructions do not say where more fuel sales of one facility go.`;

/* One row's printed cells and its credit with cents; a gap or undefined (waiting) when not figured. */
interface PartIIIRow {
  cells: Cells;
  credit: number | Unsupported | undefined;
  provisional: boolean;
}

/*
 * A sale earns a row: transportation fuel, some of it produced while the
 * taxpayer was registered ("No clean fuel production credit can be claimed
 * for any transportation fuel unless the taxpayer is registered ... at the
 * time of production", irs-7218-inst-2025::sec::line-5b::b01), and SAF with
 * its certification (undefined while it waits).
 */
export function earnsRow(sale: CleanFuelSale, approvalDate: string): boolean | undefined {
  if (!isTransportationFuel(sale.emissionsRate)) return false;
  if (qualifiedGallonsOf(sale, approvalDate) === 0) return false;
  return certifiedOf(sale);
}

/*
 * The facility claims a credit: a sale earns a row, or waits on an answer.
 * "File a separate Form 7218 for each qualified facility for which you claim
 * the section 45Z credit" (irs-7218-inst-2025::sec::how-to-claim-the-credit::b02),
 * so a facility with no creditable fuel files no Form 7218.
 */
export const claimsCredit = (facility: CleanFuelFacilityFactValue) =>
  facility.sales.some((sale) => earnsRow(sale, facility.registration.approvalDate) !== false);

/* Column (a): "Enter the type of fuel and if it's non-SAF or SAF" (part-iii-clean-aviation-and::b01). */
const fuelText = (sale: CleanFuelSale) =>
  `${sale.fuelType} (${sale.sustainableAviationFuel ? "SAF" : "non-SAF"})`;

function rowOf(sale: CleanFuelSale, facility: CleanFuelFacilityFactValue, row: number): PartIIIRow {
  const factor = emissionsFactorOf(sale.emissionsRate);
  const amount = applicableAmountOf(
    sale.sustainableAviationFuel,
    facility.meetsWageAndApprenticeship,
  );
  const gallons = qualifiedGallonsOf(sale, facility.registration.approvalDate);
  const credit = typeof gallons === "number" ? rowCreditOf(factor, gallons, amount) : gallons;
  const cells: Cells = {
    [rowCellKey(row, "a")]: fuelText(sale),
    [rowCellKey(row, "b")]: sale.feedstock,
    [rowCellKey(row, "c")]: String(YEAR_SOLD),
    [rowCellKey(row, "d")]: String(sale.emissionsRate),
    [rowCellKey(row, "e")]: tenthsText(factor),
    [rowCellKey(row, "f")]: gallons,
    [rowCellKey(row, "g")]: centsText(amount),
    [rowCellKey(row, "h")]: typeof credit === "number" ? roundDollars(credit) : credit,
  };
  return { cells, credit, provisional: sale.provisionalEmissionsRate === true };
}

export interface PartIIIResult {
  cells: Cells;
  /* Line 25; undefined while a row waits on an answer. */
  line25: number | Unsupported | undefined;
  /* Line 6: a printed row uses a provisional emissions rate. */
  provisional: boolean;
  waiting: boolean;
}

/* The rows of one facility and line 25. */
export function partIIIOf(facility: CleanFuelFacilityFactValue): PartIIIResult {
  const approvalDate = facility.registration.approvalDate;
  const waiting = facility.sales.some((sale) => earnsRow(sale, approvalDate) === undefined);
  const printed = facility.sales.filter((sale) => earnsRow(sale, approvalDate) === true);
  const rows = printed
    .slice(0, PART_III_ROWS)
    .map((sale, index) => rowOf(sale, facility, index + 1));
  const cells: Cells = Object.assign({}, ...rows.map((row) => row.cells));
  const provisional = rows.some((row) => row.provisional);
  const credits = rows.map((row) => row.credit);
  const gap = credits.find((credit): credit is Unsupported => typeof credit === "object");
  let line25: number | Unsupported | undefined;
  if (printed.length > PART_III_ROWS) line25 = unsupported(TOO_MANY_ROWS_GAP);
  else if (gap) line25 = gap;
  else if (waiting || credits.some((credit) => credit === undefined)) line25 = undefined;
  else line25 = line25Of(credits as number[]);
  const rowWaits = credits.some((credit) => credit === undefined);
  return {
    cells: { ...cells, [LINE_25]: line25 },
    line25,
    provisional,
    waiting: waiting || rowWaits,
  };
}
