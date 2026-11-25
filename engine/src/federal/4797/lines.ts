/*
 * Form 4797 for the whole return: lines 1a–18b and 30–35, from the placed
 * properties (properties.ts). Each money line is whole dollars. Lines 3, 4, 5,
 * 14, 15, 16 and 18a come from Forms 4684, 6252 and 8824, which the engine does
 * not carry here: the resolver makes the summary a gap while one files.
 */

import { section179RecaptureAmount, type Section179RecaptureFactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";
import {
  recaptureOf,
  type PartIIIColumn,
  type PlacedProperty,
  type SaleRow,
} from "./properties.js";

/* One column of Part IV (lines 33–35): section 179 (a) or section 280F(b)(2) (b). */
export interface PartIVColumn {
  line33: number;
  line34: number;
  line35: number;
}

export interface Form4797Lines {
  line1a?: number;
  line1b?: number;
  line1c?: number;
  partIRows: SaleRow[];
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  partIIRows: SaleRow[];
  line11?: number;
  line12?: number;
  line13?: number;
  line17?: number;
  line18b?: number;
  partIIIColumns: PartIIIColumn[];
  line30?: number;
  line31?: number;
  line32?: number;
  partIV: { section179?: PartIVColumn; section280f?: PartIVColumn };
  /* The long-term capital gain for Schedule D: line 7 with no line 8, or line 9 (line-7::b01, line-9::b01). */
  scheduleDGain?: number;
  /* Line 7 is a gain and the line 8 answer is not recorded: lines 8–12, 17 and 18b wait. */
  waitsForLine8: boolean;
}

export interface Form4797Inputs {
  properties: PlacedProperty[];
  /* Box 2 of each Form 1099-S the sales name, each form once. */
  reportedProceeds: number[];
  /* The answer for line 8; undefined when not recorded. */
  nonrecapturedLosses?: number;
  recaptures: Section179RecaptureFactValue[];
}

const rowsIn = (properties: PlacedProperty[], part: "part_i" | "part_ii"): SaleRow[] =>
  properties.flatMap((each) => (each.part === part ? [each.row] : []));

const columnsOf = (properties: PlacedProperty[]): PartIIIColumn[] =>
  properties.flatMap((each) => (each.part === "part_iii" ? [each.column] : []));

const positiveOrBlank = (amount: number | undefined): number | undefined =>
  amount !== undefined && amount > 0 ? amount : undefined;

/*
 * Lines 1b and 1c: the gain on lines 2, 10 and 24, and the loss on lines 2 and
 * 10, from partial dispositions of MACRS assets (irs-4797-inst-2025::sec::line-1b::b01,
 * line-1c::b01). The loss prints as a positive amount, as the line asks for "the
 * total amount of loss".
 */
function partialDispositions(properties: PlacedProperty[]): { gain: number[]; loss: number[] } {
  const partial = properties.filter((each) => each.partial !== undefined);
  const amounts = partial.map((each) =>
    each.part === "part_iii" ? each.column.line24 : each.row.gainOrLoss,
  );
  return {
    gain: amounts.filter((amount) => amount > 0),
    loss: amounts.filter((amount) => amount < 0).map((amount) => -amount),
  };
}

/* Lines 30–32 (the Summary of Part III Gains): blank with no Part III property. */
function partIIISummary(columns: PartIIIColumn[]) {
  if (columns.length === 0) return {};
  const line30 = sum(...columns.map((column) => column.line24));
  const line31 = sum(...columns.map(recaptureOf));
  return { line30, line31, line32: line30 - line31 };
}

/*
 * Lines 7–9 and 11–12 (the form's text under line 7; line-8::b01, line-9::b01).
 * Line 7 zero or a loss goes to line 11. A gain with no nonrecaptured section
 * 1231 losses goes to Schedule D, and lines 8, 9, 11 and 12 are skipped. Else
 * line 9 = line 7 − line 8 (at least 0); line 12 is line 7 when line 9 is 0,
 * else line 8, and line 9 goes to Schedule D.
 */
function section1231Netting(line7: number | undefined, nonrecapturedLosses: number | undefined) {
  if (line7 === undefined) return { waitsForLine8: false };
  if (line7 <= 0) return { line11: line7 < 0 ? -line7 : undefined, waitsForLine8: false };
  if (nonrecapturedLosses === undefined) return { waitsForLine8: true };
  const line8 = positiveOrBlank(roundDollars(nonrecapturedLosses));
  if (line8 === undefined) return { scheduleDGain: line7, waitsForLine8: false };
  const line9 = atLeast(0, line7 - line8);
  return {
    line8,
    line9,
    line12: line9 === 0 ? line7 : line8,
    scheduleDGain: positiveOrBlank(line9),
    waitsForLine8: false,
  };
}

/*
 * Part IV, one column (line-33::b01, line-34::b01, line-35::b01): the totals of
 * the properties in the column. Each property's recapture is figured on its own
 * (part-iv::b01, "figure the recapture amounts separately for each property"),
 * at least 0, and line 35 adds them.
 */
export function partIVColumn(
  recaptures: ReadonlyArray<Section179RecaptureFactValue>,
): PartIVColumn | undefined {
  if (recaptures.length === 0) return undefined;
  return {
    line33: roundDollars(sum(...recaptures.map((each) => each.priorDeductions))),
    line34: roundDollars(sum(...recaptures.map((each) => each.recomputedDepreciation))),
    line35: sum(...recaptures.map(section179RecaptureAmount)),
  };
}

/*
 * Line 17 combines lines 10 through 16 (line 11 subtracts: it holds a loss in
 * parentheses); line 18b is line 17 without the line 18a loss, which the engine
 * never has (it comes from Form 4684 Section B).
 */
function partIITotals(
  rows: SaleRow[],
  netting: ReturnType<typeof section1231Netting>,
  line13?: number,
) {
  if (netting.waitsForLine8) return {};
  const line17 = sumOrBlank(
    ...rows.map((row) => row.gainOrLoss),
    netting.line11 === undefined ? undefined : -netting.line11,
    netting.line12,
    line13,
  );
  return { line17, line18b: line17 };
}

export function form4797Lines(inputs: Form4797Inputs): Form4797Lines {
  const partIRows = rowsIn(inputs.properties, "part_i");
  const partIIRows = rowsIn(inputs.properties, "part_ii");
  const partIIIColumns = columnsOf(inputs.properties);
  const summary = partIIISummary(partIIIColumns);
  const line6 = positiveOrBlank(summary.line32);
  const line7 = sumOrBlank(...partIRows.map((row) => row.gainOrLoss), line6);
  const netting = section1231Netting(line7, inputs.nonrecapturedLosses);
  const line13 = positiveOrBlank(summary.line31);
  const partial = partialDispositions(inputs.properties);
  return {
    line1a:
      inputs.reportedProceeds.length > 0
        ? roundDollars(sum(...inputs.reportedProceeds))
        : undefined,
    line1b: partial.gain.length > 0 ? sum(...partial.gain) : undefined,
    line1c: partial.loss.length > 0 ? sum(...partial.loss) : undefined,
    partIRows,
    line6,
    line7,
    ...netting,
    partIIRows,
    line13,
    ...partIITotals(partIIRows, netting, line13),
    partIIIColumns,
    ...summary,
    partIV: {
      section179: partIVColumn(inputs.recaptures.filter((each) => each.column === "section_179")),
      section280f: partIVColumn(inputs.recaptures.filter((each) => each.column === "section_280f")),
    },
  };
}
