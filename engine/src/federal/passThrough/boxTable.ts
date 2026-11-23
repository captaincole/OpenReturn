/*
 * The shape of the three box tables (README.md, layer 3). A row turns one box,
 * and one code where the box has codes, into an item type. The tables are the
 * only place that knows a box number.
 */

import type { ItemType } from "./itemTypes.js";

export interface BoxRow {
  box: string;
  /* Undefined for a box that has no codes. */
  code?: string;
  type: ItemType;
  /* The code's meaning, for a type that groups codes with different destinations. */
  detail?: string;
  /* The caption the K-1 prints. */
  label: string;
}

export type BoxTable = ReadonlyArray<BoxRow>;

/* A box with no codes. */
export const plain = (box: string, type: ItemType, label: string, detail?: string): BoxRow => ({
  box,
  type,
  label,
  detail,
});

/* One code of a box that has codes. */
export const coded = (
  box: string,
  code: string,
  type: ItemType,
  label: string,
  detail?: string,
): BoxRow => ({ box, code, type, label, detail });

/*
 * The row for a box and code; a box or code the table does not list maps to
 * an explicit not_modeled row, never to nothing.
 */
export function rowFor(table: BoxTable, box: string, code: string | undefined): BoxRow {
  const found = table.find((row) => row.box === box && row.code === code);
  if (found) return found;
  const label = code === undefined ? `box ${box}` : `box ${box} code ${code}`;
  return { box, code, type: "not_modeled", label };
}

/* Where a K-1 prints its section 199A statement: the box and code the statement belongs to. */
export interface StatementBox {
  box: string;
  code: string;
}
