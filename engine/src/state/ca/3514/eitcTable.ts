/*
 * The 2025 Earned Income Tax Credit Table in the FTB 3514 booklet, stored as
 * data by `form-engine ingest-ca-eitc-table` (src/data/ca-eitc-table-2025.json).
 * "Read down the 'At least - But not over' columns and find the line that
 * includes the amount ... Then, go to the column that includes the number of
 * qualifying children you have" (ca-3514-inst-2025::sec::primary-taxpayer-spouse-rdp-2::b09).
 */

import caEitcTable2025 from "../../../data/ca-eitc-table-2025.json" with { type: "json" };

interface CaEitcTable {
  // [at least, but not over, credit with 0, 1, 2, 3 qualifying children]
  rows: number[][];
}

const TABLE = caEitcTable2025 as CaEitcTable;
const FIRST_CREDIT_COLUMN = 2;

/*
 * The credit for a whole-dollar amount and a number of qualifying children
 * (3 or more use the last column). The table starts at $1 and ends at
 * $32,900: an amount outside it has no credit (B Differences: earned income
 * and federal AGI "must be less than $32,901").
 */
export function caEitcTableCredit(amount: number, children: number): number {
  const row = TABLE.rows.find(([atLeast, notOver]) => amount >= atLeast! && amount <= notOver!);
  return row === undefined ? 0 : row[FIRST_CREDIT_COLUMN + Math.min(children, 3)]!;
}
