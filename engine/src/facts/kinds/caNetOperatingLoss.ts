/*
 * California net operating loss (NOL) and disaster loss carryovers from 2024:
 * the rows of last year's FTB 3805V, Part III, line 2 and lines 3 and 4 that
 * still had a carryover in column (h). This year's form copies each row to
 * Part III line 2 ("Column (e) – Enter the amount from your 2024 form FTB
 * 3805V, Part III, column (h)", ca-3805v-inst-2025::sec::declared-disasters::b17).
 * No 2025 document prints them: the taxpayer states them from last year's
 * return. One fact, category "other", whose value is the list of rows. An empty
 * list is an answer (no carryover). Cade records it when the taxpayer has a
 * California NOL or disaster loss carryover; the form files with it.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Column (c), "Type of NOL": General (GEN), New Business (NB), Eligible Small
 * Business (ESB), or Disaster (DIS) (the form; the NOL Carryover table,
 * ca-3805v-inst-2025::sec::nol-carryover::b02 to ::b14).
 */
export type CaNolType = "GEN" | "NB" | "ESB" | "DIS";

export interface CaNolCarryoverRow {
  /* Column (a): the taxable year the loss was incurred, four digits (2018). */
  yearOfLoss: number;
  /*
   * Column (b): the SIC code of a new or eligible small business, the
   * agricultural activity code of a farm, the FEIN or California number of a
   * pass-through entity, or the disaster code from the Declared Disasters list
   * (ca-3805v-inst-2025::sec::part-iii-limitations::b03). Absent: none applies.
   */
  code?: string;
  type: CaNolType;
  /* Column (d): the loss in the year it was incurred, a positive amount. */
  initialLoss: number;
  /* Column (e): last year's column (h), the carryover to 2025, a positive amount. */
  carryoverFrom2024: number;
}

export const CA_NOL_KEYS = {
  priorYearCarryovers: "ca_nol.prior_year_carryovers",
} as const;

export const CA_NOL_CATEGORY = "other";

const NOL_TYPES: ReadonlySet<string> = new Set(["GEN", "NB", "ESB", "DIS"]);

function isCarryoverRow(value: unknown): value is CaNolCarryoverRow {
  const row = value as Partial<CaNolCarryoverRow> | null;
  return (
    typeof row === "object" &&
    row !== null &&
    typeof row.yearOfLoss === "number" &&
    typeof row.type === "string" &&
    NOL_TYPES.has(row.type) &&
    typeof row.initialLoss === "number" &&
    typeof row.carryoverFrom2024 === "number"
  );
}

/* The stated rows in the order recorded; undefined when the answer is not recorded. */
export function getCaNolCarryoverRows(
  facts: ReadonlyArray<FactRow>,
): CaNolCarryoverRow[] | undefined {
  const row = facts.find((fact) => fact.key === CA_NOL_KEYS.priorYearCarryovers);
  if (row === undefined || !Array.isArray(row.value)) return undefined;
  return row.value.filter(isCarryoverRow);
}
