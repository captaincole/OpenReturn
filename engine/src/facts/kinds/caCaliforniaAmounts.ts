/*
 * Schedule CA (540NR) column E: the California amount of each line, as the
 * taxpayer states it (issue #336). Column E holds "income earned or received
 * as a California resident and income earned or received from California
 * sources as a nonresident" (the form's column heading). The engine never
 * splits an amount itself: not wages by workdays, not stock pay by vesting,
 * not a Schedule K-1 by the entity's factors. A line with a column D amount
 * and no stated California amount is a missing answer, never 0.
 *
 * One answer per line, not per document. A line that adds documents (line 1a
 * adds every W-2, line 7a every sale) takes one total: the column is one box
 * per line, and the instructions figure it per line (the Part-Year Resident
 * Worksheet, ca-540nr-sched-ca-inst-2025::sec::section-b-additional-income-3::b07,
 * adds the resident and the nonresident part of each line). It is the smaller
 * design: one fact for each line the return uses, whatever the number of
 * documents behind it. Each value is in dollars; 0 is an answer (none of the
 * line's amount is California's).
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The Schedule CA (540NR) Part II lines whose column E the taxpayer states, as
 * the catalog names them. The totals (lines 1z, 9a, 10, 25, 26 and 27) add
 * these and are not stated.
 */
export const CA_STATED_AMOUNT_LINES = [
  "1a",
  "1b",
  "1c",
  "1d",
  "1e",
  "1f",
  "1g",
  "1h",
  "1i",
  "2b",
  "3b",
  "4b",
  "5b",
  "7a",
  "b2a",
  "b3",
  "b4",
  "b5",
  "b6",
  "b8b",
  "b8c",
  "b8e",
  "b8g",
  "b8h",
  "b8i",
  "b8j",
  "b8k",
  "b8l",
  "b8m",
  "b8p",
  "b8q",
  "b8r",
  "b8s",
  "b8t",
  "b8u",
  "b8v",
  "b8z",
  "b9b1",
  "b9b2",
  "b9b3",
  "c12",
  "c14",
  "c15",
  "c16",
  "c17",
  "c18",
  "c19a",
  "c20",
  "c21",
  "c23",
  "c24a",
  "c24b",
  "c24d",
  "c24e",
  "c24f",
  "c24g",
  "c24h",
  "c24k",
  "c24z",
] as const;

export type CaStatedAmountLine = (typeof CA_STATED_AMOUNT_LINES)[number];

const AMOUNT_CATEGORY = "state_local_tax";
const AMOUNT_PREFIX = "ca_540nr.california_amount.";

export function caCaliforniaAmountKey(line: CaStatedAmountLine): string {
  return `${AMOUNT_PREFIX}${line}`;
}

/* Every stated column E amount, by line. A value that is not a number is not an answer. */
export function readCaCaliforniaAmounts(
  facts: ReadonlyArray<FactRow>,
): Partial<Record<CaStatedAmountLine, number>> {
  const amounts: Partial<Record<CaStatedAmountLine, number>> = {};
  for (const line of CA_STATED_AMOUNT_LINES) {
    const row = facts.find(
      (fact) => fact.category === AMOUNT_CATEGORY && fact.key === caCaliforniaAmountKey(line),
    );
    if (typeof row?.value === "number" && Number.isFinite(row.value)) amounts[line] = row.value;
  }
  return amounts;
}
