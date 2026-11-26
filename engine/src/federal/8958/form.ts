/*
 * Form 8958 as a table: for each line, its rows in the order the items were
 * recorded. Line 9 mirrors the line 10 rows and line 11 lists the withholding
 * of every item that had any (lines.ts). A line with more items than the form
 * has rows needs an attached statement, which the engine does not write.
 */

import type { CommunityPropertyItemFact } from "../../facts/index.js";
import {
  deductibleSeTaxRow,
  rowOf,
  splitOf,
  withholdingRow,
  type AllocationContext,
  type Form8958Row,
  type Split,
} from "./lines.js";
import { LINES, type LineSource, type LineSpec } from "./rows.js";

export type RowEntry =
  | { kind: "row"; row: Form8958Row }
  | { kind: "waits"; description: string }
  | { kind: "gap"; description: string; reason: string };

export type LineEntries = { kind: "rows"; rows: RowEntry[] } | { kind: "gap"; reason: string };

/* Each line's entries, by the printed line number. */
export type Form8958Table = Readonly<Record<number, LineEntries>>;

/* What the split of every item rests on: the context, an answer still missing, or a gap for the whole form. */
export type ContextState = AllocationContext | { waits: true } | { gap: string };

interface SplitItem {
  fact: CommunityPropertyItemFact;
  split: Split;
}

function splitItems(items: CommunityPropertyItemFact[], context: ContextState): SplitItem[] {
  return items.map((fact) => {
    if ("waits" in context) return { fact, split: { missing: true } };
    if ("gap" in context) return { fact, split: { gap: context.gap } };
    return { fact, split: splitOf(fact.value, context) };
  });
}

/* One entry: a row from the item's split, or blank while it waits, or the gap. */
function entryOf(item: SplitItem, makeRow: (fraction: number) => Form8958Row): RowEntry {
  const { description } = item.fact.value;
  if ("fraction" in item.split) return { kind: "row", row: makeRow(item.split.fraction) };
  if ("missing" in item.split) return { kind: "waits", description };
  return { kind: "gap", description, reason: `${item.fact.key}: ${item.split.gap}.` };
}

function entriesFor(source: LineSource, items: SplitItem[]): RowEntry[] {
  if (source === "deductible_self_employment_tax") {
    return items
      .filter((item) => item.fact.value.line === "self_employment_tax")
      .map((item) =>
        entryOf(item, (fraction) =>
          deductibleSeTaxRow({
            description: item.fact.value.description,
            amount: item.fact.value.amount,
            fraction,
          }),
        ),
      );
  }
  if (source === "taxes_withheld") {
    return items
      .filter((item) => (item.fact.value.federalWithholding ?? 0) !== 0)
      .map((item) =>
        entryOf(item, (fraction) =>
          withholdingRow(
            item.fact.value.description,
            item.fact.value.federalWithholding ?? 0,
            fraction,
          ),
        ),
      );
  }
  return items
    .filter((item) => item.fact.value.line === source)
    .map((item) =>
      entryOf(item, (fraction) =>
        rowOf(item.fact.value.description, item.fact.value.amount, fraction),
      ),
    );
}

/*
 * "If you need more room, attach a statement listing the source of the item and
 * the total plus the allocated amounts" (irs-8958-form-2025::sec::purpose-of-form::b01).
 */
function lineEntries(spec: LineSpec, items: SplitItem[]): LineEntries {
  const rows = entriesFor(spec.source, items);
  if (rows.length <= spec.rows) return { kind: "rows", rows };
  return {
    kind: "gap",
    reason: `Form 8958 line ${spec.line} has ${spec.rows} row(s) and ${rows.length} items; the rest go on an attached statement (irs-8958-form-2025::sec::purpose-of-form::b01), which the engine does not write.`,
  };
}

export function form8958Table(
  items: CommunityPropertyItemFact[],
  context: ContextState,
): Form8958Table {
  const split = splitItems(items, context);
  return Object.fromEntries(LINES.map((spec) => [spec.line, lineEntries(spec, split)]));
}

/* The items whose split still waits for an answer inside the item. */
export function itemsThatWait(items: CommunityPropertyItemFact[], context: ContextState): string[] {
  if ("waits" in context || "gap" in context) return [];
  return items.filter((fact) => "missing" in splitOf(fact.value, context)).map((fact) => fact.key);
}
