/*
 * Part III, the child tax credit, additional child tax credit and credit for
 * other dependents (irs-8862-inst-2025, lines 12–17). Filled only when line
 * 2's box for these credits is checked. Every answer comes from the
 * dependents Schedule 8812 counts: line 12 lists the children whose row (7)
 * box is the child tax credit, line 13 the other dependents. A dependent fact
 * is a person the taxpayer claims, so line 16 is "Yes" for each.
 */

import { unsupported } from "../../types.js";
import type { DependentRow } from "../schedule-8812/filingInfo.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import { CTC_CHILD_COLUMNS, line14LivedWithYou, OTHER_DEPENDENT_COLUMNS } from "./lines.js";
import { columns, yesNo, type Binding, type Bindings, type Form } from "./pairs.js";

const MORE_CHILDREN_GAP =
  "Line 12: more than four children for the child tax credit need an attached statement answering lines 12 and 14–17 for the others, and the engine writes no statements.";
const MORE_DEPENDENTS_GAP =
  "Line 13: more than four other dependents need an attached statement answering lines 13, 16 and 17 for the others, and the engine writes no statements.";

const LETTERS = ["a", "b", "c", "d"];

type Group = "child_tax_credit" | "other_dependents";

/* The dependents of one group, when line 2 claims these credits. */
function rows(form: Form, info: Form8862FilingInfo, group: Group): DependentRow[] | undefined {
  if (form["0.line.2_claiming_ctc_actc_odc"] !== true) return undefined;
  return (info.dependents ?? []).filter((row) => row.credit === group);
}

const nameOf = (row: DependentRow) => `${row.dependent.firstName} ${row.dependent.lastName}`;

/* The name in one column; the last column is a gap when a statement would list more. */
function nameBinding(group: Group, column: number, last: number, gap: string): Binding {
  return (form, info) => {
    const listed = rows(form, info, group);
    if (listed === undefined) return undefined;
    if (column === last && listed.length > last) return unsupported(gap);
    const row = listed[column - 1];
    return row === undefined ? undefined : nameOf(row);
  };
}

/* A Yes/No pair for one person of a group. */
function personPair(
  yesField: string,
  noField: string,
  group: Group,
  column: number,
  read: (row: DependentRow) => boolean | undefined,
): Record<string, Binding> {
  return yesNo(yesField, noField, (form, info) => {
    const row = rows(form, info, group)?.[column - 1];
    return row === undefined ? undefined : read(row);
  });
}

/* Lines 12, 14, 15, 16 and 17 for one child. */
function childBindings(column: number): Record<string, Binding> {
  const pair = (line: string, suffix: string, read: (row: DependentRow) => boolean | undefined) =>
    personPair(
      `1.line.${line}_child_${column}_${suffix}_yes`,
      `1.line.${line}_child_${column}_${suffix}_no`,
      "child_tax_credit",
      column,
      read,
    );
  return {
    [`1.line.12${LETTERS[column - 1]}_ctc_child_${column}_name`]: nameBinding(
      "child_tax_credit",
      column,
      CTC_CHILD_COLUMNS,
      MORE_CHILDREN_GAP,
    ),
    // Line 14 (line-14::b01): more than half the year, or the divorced-parents exception.
    ...pair("14", "lived_with_you", (row) =>
      line14LivedWithYou(row.livedWithYouOverHalfYear, row.dependent),
    ),
    // Line 15 (line-15::b01): Schedule 8812 counts only a qualifying child for the CTC.
    ...pair("15", "qualifying_child", (row) => row.credit === "child_tax_credit"),
    // Line 16 (line-16::b01): a dependent fact is a person claimed as a dependent.
    ...pair("16", "your_dependent", () => true),
    ...pair("17", "us_citizen_resident", (row) => row.dependent.usCitizenOrResident),
  };
}

/* Lines 13, 16 and 17 for one other dependent. */
function otherDependentBindings(column: number): Record<string, Binding> {
  const pair = (line: string, suffix: string, read: (row: DependentRow) => boolean | undefined) =>
    personPair(
      `1.line.${line}_other_dependent_${column}_${suffix}_yes`,
      `1.line.${line}_other_dependent_${column}_${suffix}_no`,
      "other_dependents",
      column,
      read,
    );
  return {
    [`1.line.13${LETTERS[column - 1]}_odc_dependent_${column}_name`]: nameBinding(
      "other_dependents",
      column,
      OTHER_DEPENDENT_COLUMNS,
      MORE_DEPENDENTS_GAP,
    ),
    ...pair("16", "your_dependent", () => true),
    ...pair("17", "us_citizen_resident", (row) => row.dependent.usCitizenOrResident),
  };
}

export function partIIIBindings(): Bindings {
  return Object.assign(
    {},
    ...columns(CTC_CHILD_COLUMNS).map(childBindings),
    ...columns(OTHER_DEPENDENT_COLUMNS).map(otherDependentBindings),
  ) as Bindings;
}
