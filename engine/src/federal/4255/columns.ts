/*
 * The Part I grid of Form 4255: which column each line has (the blank form's
 * open cells, as the catalog lists them) and each cell's field id.
 */

import type { Form4255Line } from "../../facts/index.js";

export type AmountColumn =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m1"
  | "m2"
  | "m3"
  | "n1"
  | "n2"
  | "n3"
  | "o1"
  | "o2"
  | "o3"
  | "p1"
  | "p2"
  | "p3"
  | "q"
  | "r"
  | "s"
  | "t";
export type Column = AmountColumn | "g";

/* Every amount column, in form order (line 3 totals each one; column (g) has no total). */
export const AMOUNT_COLUMNS: readonly AmountColumn[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m1",
  "m2",
  "m3",
  "n1",
  "n2",
  "n3",
  "o1",
  "o2",
  "o3",
  "p1",
  "p2",
  "p3",
  "q",
  "r",
  "s",
  "t",
];

const PRIOR = ["a", "b", "c", "d", "e", "f"] as const;
const RECAPTURE = ["g", "h", "i", "j", "k", "l"] as const;
const TRANSFER = ["m1", "m2"] as const;
const PAYMENT = ["n1", "n2", "n3"] as const;
const WAGE = ["o1", "o2", "o3"] as const;
const APPRENTICE = ["p1", "p2", "p3"] as const;
const TOTALS = ["q", "r", "s", "t"] as const;
const FULL = [
  ...PRIOR,
  ...RECAPTURE,
  ...TRANSFER,
  "m3",
  ...PAYMENT,
  ...WAGE,
  ...APPRENTICE,
  ...TOTALS,
] as const;
const NO_RECAPTURE = [
  ...PRIOR,
  ...TRANSFER,
  ...PAYMENT,
  ...WAGE,
  ...APPRENTICE,
  ...TOTALS,
] as const;
const NO_TRANSFER = [...PRIOR, ...RECAPTURE, ...PAYMENT, ...TOTALS] as const;
const RECAPTURE_ONLY = ["a", "e", "f", ...RECAPTURE, "r"] as const;
const LINE_2 = [
  ...PRIOR,
  ...RECAPTURE,
  ...TRANSFER,
  ...PAYMENT,
  ...WAGE,
  ...APPRENTICE,
  ...TOTALS,
] as const;

/* The open cells of each line (the blank form, pages 1 to 3). */
export const LINE_COLUMNS: Readonly<Record<Form4255Line, readonly Column[]>> = {
  "1a": [...PRIOR, ...TRANSFER, ...PAYMENT, ...TOTALS],
  "1b": FULL,
  "1c": NO_RECAPTURE,
  "1d": NO_TRANSFER,
  "1e": NO_RECAPTURE,
  "1f": [...PRIOR, ...TRANSFER, ...PAYMENT, ...WAGE, ...TOTALS],
  "1g": FULL,
  "1h": NO_TRANSFER,
  "1i": NO_RECAPTURE,
  "1j": FULL,
  "1k": NO_RECAPTURE,
  "1l": RECAPTURE_ONLY,
  "1m": RECAPTURE_ONLY,
  "1n": ["o3", "r"],
  "1o": ["o3", "p3", "r"],
  "1z": FULL,
  "2a": LINE_2,
  "2b": LINE_2,
  "2z": FULL,
};

const ROW_NAMES: Readonly<Record<Form4255Line | "3", string>> = {
  "1a": "1a_form_7207",
  "1b": "1b_form_3468_part_iii",
  "1c": "1c_form_7210",
  "1d": "1d_form_3468_part_iv",
  "1e": "1e_form_7218",
  "1f": "1f_form_7213_part_ii",
  "1g": "1g_form_3468_part_v",
  "1h": "1h_form_8936_part_v",
  "1i": "1i_form_7211",
  "1j": "1j_form_3468_part_vi",
  "1k": "1k_form_8835",
  "1l": "1l_form_3468_part_ii",
  "1m": "1m_form_3468_part_vii",
  "1n": "1n_form_8908",
  "1o": "1o_form_7205",
  "1z": "1z_other_line_1_amount",
  "2a": "2a_form_8933",
  "2b": "2b_form_8911",
  "2z": "2z_other_line_2_amount",
  "3": "3_total",
};

/* Columns (a) to (i) are on page 1, (j) to (n)(3) on page 2, the rest on page 3. */
const PAGE_2: readonly Column[] = ["j", "k", "l", "m1", "m2", "m3", "n1", "n2", "n3"];
const pageOf = (column: Column): number => {
  if (PAGE_2.includes(column)) return 1;
  return [...WAGE, ...APPRENTICE, ...TOTALS].some((each) => each === column) ? 2 : 0;
};

/* The catalog field id (without the form id) of one Part I cell. */
export const cellFieldId = (line: Form4255Line | "3", column: Column): string =>
  `${pageOf(column)}.part1.${ROW_NAMES[line]}_col_${column}`;

/* A column as the form names it: "h" → "(h)", "o1" → "(o)(1)". */
export const columnLabel = (column: Column): string =>
  column.length === 2 ? `(${column[0]})(${column[1]})` : `(${column})`;

/* Line 3 has every amount column but (g) (the blank form). */
export const TOTAL_COLUMNS: readonly AmountColumn[] = AMOUNT_COLUMNS;
