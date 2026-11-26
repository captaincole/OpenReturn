/*
 * FTB 3461's reads: Part I takes each Schedule CA (540) line as column A
 * minus column B plus column C (the form); Part II sorts the same amounts
 * into business and not business as federal Form 461 does (federal/461/
 * classify.ts). Each read is a number, null for a blank line, undefined while
 * a line or an answer waits, or the reason the engine cannot fill it.
 */

import {
  line2Source,
  line3Source,
  line5Source,
  line6Source,
  nonbusinessColumns,
  type Info as Form461Info,
} from "../../../federal/461/figures.js";
import { sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { line3Column, line5Column, line6Column } from "../schedule-ca/answerLines.js";
import { scheduleDCaAdjustment } from "../schedule-ca/capitalGain.js";
import type { ScheduleCaFilingInfo } from "../schedule-ca/filingInfo.js";
import type { Form3461Figures, Form3461FilingInfo } from "./filingInfo.js";
import {
  capitalSplit,
  line17,
  line9,
  partIII,
  type CaPartIAmounts,
  type CaPartIIIAmounts,
} from "./lines.js";

export type Info = Form3461FilingInfo & ScheduleCaFilingInfo & Form461Info;
export type Read = Record<string, unknown>;
type Column = number | Unsupported | undefined;
type Amount = number | null | undefined | Unsupported;

const LINE_5_SPLIT_GAP =
  "Schedule CA line 5 has a California adjustment (column B or C) and Schedule E holds amounts not from a trade or business: the instructions do not say which part of the adjustment goes on FTB 3461 line 10 or 11.";

/* Column A less column B plus column C; a gap in any column is the line's gap. */
function caAmount(columnA: number | null | undefined, columnB: Column, columnC: Column): Amount {
  if (isUnsupportedResult(columnB)) return columnB;
  if (isUnsupportedResult(columnC)) return columnC;
  if (columnA === undefined) return undefined;
  if (columnA === null && !columnB && !columnC) return null;
  return sum(columnA ?? 0) - (columnB ?? 0) + (columnC ?? 0);
}

/* Line 2: Schedule CA line 3; columns B and C are the California employee and FTB 3885A amounts. */
function line2(form: Read, info: Info): Amount {
  if (info.businessDepreciationAdjustment?.waits) return undefined;
  return caAmount(
    line2Source(form, info),
    line3Column(info, "subtraction"),
    line3Column(info, "addition"),
  );
}

/*
 * Line 3: Schedule CA line 7a. Columns B and C come from Schedule D (540)
 * when it files. It files only with a California difference the engine
 * knows (state/ca/schedule-d-ca), so without it the columns are 0, as
 * California AGI takes them (QUESTIONS.md item 2).
 */
function line3(form: Read, info: Info): Amount {
  const scheduleD = info.mustFile?.["schedule-d-ca"]?.value === true;
  const column = (line: "12a" | "12b") =>
    scheduleD ? scheduleDCaAdjustment(form, info, line, "") : 0;
  return caAmount(line3Source(form, info), column("12a"), column("12b"));
}

/* Line 5 columns B and C: FTB 3801's or FTB 3885A's adjustment; undefined while one waits. */
function line5Columns(form: Read, info: Info): [Column, Column] | undefined {
  if (info.mustFile?.["form-3801"]?.value !== true && info.rentalDepreciationAdjustment?.waits) {
    return undefined;
  }
  return [line5Column(form, info, "subtraction"), line5Column(form, info, "addition")];
}

/* Line 5: Schedule CA line 5 (Schedule 1 line 5 in column A). */
function line5(form: Read, info: Info, figures: Form3461Figures): Amount {
  if (figures.federal.gaps.line5) return unsupported(figures.federal.gaps.line5);
  const columns = line5Columns(form, info);
  return columns && caAmount(line5Source(form, info), ...columns);
}

/* Line 4: Schedule CA line 4 comes from Form 4797, which has no rules here. */
const gapOrBlank = (gap: string | undefined): Amount => (gap ? unsupported(gap) : null);

/* MANUAL EDIT: line 6, Schedule CA line 6 (Schedule 1 line 6 in column A; columns B and C, line6Column). */
function line6(form: Read, info: Info, figures: Form3461Figures): Amount {
  if (figures.federal.gaps.line6) return unsupported(figures.federal.gaps.line6);
  return caAmount(line6Source(form, info), line6Column(info), line6Column(info));
}

/* Part I, line by line, in the form's order. */
export function partIReads(form: Read, info: Info): Record<keyof CaPartIAmounts, Amount> {
  const figures = info.form3461;
  if (figures?.gap) {
    const gap = unsupported(figures.gap);
    return { line2: gap, line3: gap, line4: gap, line5: gap, line6: gap, line8: gap };
  }
  return {
    line2: line2(form, info),
    line3: line3(form, info),
    line4: gapOrBlank(figures?.federal.gaps.line4),
    line5: figures ? line5(form, info, figures) : undefined,
    line6: figures ? line6(form, info, figures) : undefined,
    line8: figures?.federal.otherBusinessIncome ?? null,
  };
}

/* Part I as amounts; the first gap, or undefined while a line waits. */
export function partIAmounts(form: Read, info: Info): CaPartIAmounts | Unsupported | undefined {
  const reads = partIReads(form, info);
  const values = Object.values(reads);
  const gap = values.find(isUnsupportedResult);
  if (gap) return gap;
  if (values.includes(undefined)) return undefined;
  const blankless = (value: Amount) => (typeof value === "number" ? value : undefined);
  return {
    line2: blankless(reads.line2),
    line3: blankless(reads.line3),
    line4: blankless(reads.line4),
    line5: blankless(reads.line5),
    line6: blankless(reads.line6),
    line8: blankless(reads.line8),
  };
}

/* Whether Schedule CA line 5 has a column B or C amount. */
function line5Adjusted(form: Read, info: Info): boolean {
  const columns = line5Columns(form, info) ?? [undefined, undefined];
  return columns.some((column) => typeof column === "number" && column !== 0);
}

/*
 * Lines 10 and 11 as positive amounts: line 3's part not from a business
 * (lines.ts, capitalSplit), and the Schedule E columns and K-1 items not from
 * a trade or business, at their federal amounts (federal/461/classify.ts).
 */
export function partIIAmounts(
  form: Read,
  info: Info,
  partI: CaPartIAmounts,
): { line10: number; line11: number } | Unsupported | undefined {
  const figures = info.form3461?.federal;
  if (figures === undefined || figures.k1Nonbusiness === undefined) return undefined;
  const columns = nonbusinessColumns(form, figures);
  if (columns === undefined) return undefined;
  const k1 = figures.k1Nonbusiness;
  const nonbusiness = [columns.income, columns.losses, k1.income, k1.losses].some(
    (amount) => amount !== 0,
  );
  if (nonbusiness && line5Adjusted(form, info)) return unsupported(LINE_5_SPLIT_GAP);
  const capital = capitalSplit(partI.line3, figures.businessCapitalGain);
  return {
    line10: sum(capital.nonbusinessGain, columns.income, k1.income),
    line11: sum(capital.nonbusinessLoss, columns.losses, k1.losses),
  };
}

/* Every line of the form, figured. Lines 14b on wait for the carryover answer (carryoverKnown). */
export interface Form3461Lines extends CaPartIIIAmounts {
  partI: CaPartIAmounts;
  line9: number;
  line10: number;
  line11: number;
  carryoverKnown: boolean;
  line17?: number;
  /* Line 17 waits for the prior adjustments. */
  line17Waits: boolean;
}

/* The whole form; the gap, or undefined while a line or an answer waits. */
export function form3461Lines(form: Read, info: Info): Form3461Lines | Unsupported | undefined {
  const figures = info.form3461;
  const partI = partIAmounts(form, info);
  if (figures === undefined || partI === undefined) return undefined;
  if (isUnsupportedResult(partI)) return partI;
  const partII = partIIAmounts(form, info, partI);
  if (partII === undefined || isUnsupportedResult(partII)) return partII;
  const carryover = figures.carryover ?? 0;
  const lines = partIII(line9(partI), partII.line10, partII.line11, carryover, figures.threshold);
  const line17Waits = carryover > 0 && figures.priorAdjustments === undefined;
  return {
    ...lines,
    ...partII,
    partI,
    line9: line9(partI),
    carryoverKnown: figures.carryover !== undefined,
    line17: line17Waits
      ? undefined
      : line17(lines.line16, carryover, figures.priorAdjustments ?? 0),
    line17Waits,
  };
}
