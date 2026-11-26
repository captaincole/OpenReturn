/*
 * The Forms 8978 of the return, from the Forms 8986 and the year facts: which
 * statements belong to 2025, the columns of each source, the copies (the AAR
 * form first, four columns to a form), and each column's lines.
 */

import {
  makePartnerAdjustmentYearFactKey,
  type Form8986Fact,
  type PartnerAdjustmentSource,
  type PartnerAdjustmentYearFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { utcDate } from "../8621/interest.js";
import {
  columnInterest,
  columnLines,
  COLUMNS_PER_FORM,
  correctedAmounts,
  formTotals,
  REPORTING_YEAR,
  type FiguredColumn,
  type FormTotals,
  type PreviousAmounts,
} from "./lines.js";
import {
  placedAttribute,
  placedRow,
  rowPlace,
  scheduleAColumn,
  type PlacedAmount,
} from "./scheduleA.js";

/* One column of a copy: its year, and its lines once every answer is in. */
export interface PlannedColumn {
  taxYear: number;
  lines?: FiguredColumn;
}

export interface Form8978Copy {
  source: PartnerAdjustmentSource;
  columns: PlannedColumn[];
  /* Lines 14, 16 and 18; undefined while a column waits. */
  totals?: FormTotals;
}

export interface Form8978Plan {
  copies: Form8978Copy[];
  /* Why the engine cannot figure the forms; every amount line is a gap. */
  gap?: string;
  /* The year facts a column waits for. */
  waitingKeys: string[];
}

/* A statement placed on the return: its source, its first affected year, and its Schedule A amounts. */
export interface PlacedStatement {
  key: string;
  source: PartnerAdjustmentSource;
  firstAffectedYear: number;
  amounts: PlacedAmount[];
  listsPenalties: boolean;
}

/*
 * The reporting year is "the partner's tax year that includes the date the
 * audited or AAR partnership furnished the Forms 8986", Part II item G
 * (irs-8978-inst-2025::sec::purpose-of-this-form::b07); a pass-through
 * partner's later date does not move it (::where-and-when-to-file::b01,
 * Example 1). A calendar-year partner: the year of the date.
 */
export function reportingYearOf(fact: Form8986Fact): number | undefined {
  return utcDate(fact.value.dateFurnished)?.getUTCFullYear();
}

/* Boxes 1 and 2 of Part I item A are an audit; 3 and 4 an AAR (::completing-form-8978-and-schedule-a::b03). */
export const sourceOf = (fact: Form8986Fact): PartnerAdjustmentSource =>
  fact.value.submitter === "aar_partnership" || fact.value.submitter === "pass_through_of_aar"
    ? "aar"
    : "bba_audit";

/*
 * The first affected year: the partner's tax year that holds the end of the
 * reviewed year (::purpose-of-this-form::b03). A statement from a
 * pass-through partner relates to its own year (Part III item C,
 * QUESTIONS.md). A calendar-year partner: the year of that date.
 */
function firstAffectedYearOf(fact: Form8986Fact): number | undefined {
  const end = fact.value.passThroughPartner?.taxYearEnded ?? fact.value.reviewYearEnded;
  return utcDate(end)?.getUTCFullYear();
}

/* A statement on the return, or the reason the engine cannot place it. */
export function placeStatement(fact: Form8986Fact): PlacedStatement | string {
  const year = firstAffectedYearOf(fact);
  const name = fact.value.partnershipName;
  if (year === undefined) return `The Form 8986 from ${name} has no valid review year date.`;
  if (year >= REPORTING_YEAR) {
    return `The Form 8986 from ${name} relates to ${year}, not to a year before the reporting year ${REPORTING_YEAR}.`;
  }
  const amounts: PlacedAmount[] = [];
  for (const row of fact.value.adjustments) {
    const place = rowPlace(fact.value.returnType, row);
    if (place === undefined) {
      return `The Form 8986 from ${name} has Part V line "${row.lineNumber}" on a Schedule K-1 the engine does not sort into Schedule A (Form ${fact.value.returnType}).`;
    }
    amounts.push(placedRow(place, row));
  }
  const listsPenalties = (fact.value.penalties ?? []).length > 0;
  return {
    key: fact.key,
    source: sourceOf(fact),
    firstAffectedYear: year,
    amounts,
    listsPenalties,
  };
}

/*
 * The applicable years of a source: each first affected year, and each year
 * whose fact has amounts or a statement for the source. "A year that is not
 * impacted does not have to be shown" (::completing-form-8978-and-schedule-a::b02).
 */
function yearsOf(
  source: PartnerAdjustmentSource,
  statements: ReadonlyArray<PlacedStatement>,
  years: ReadonlyMap<number, PartnerAdjustmentYearFactValue>,
): number[] {
  const found = new Set<number>();
  for (const statement of statements) {
    if (statement.source === source) found.add(statement.firstAffectedYear);
  }
  for (const [taxYear, value] of years) {
    const attributes = (value.attributeAdjustments ?? []).filter((each) => each.source === source);
    if (statementFor(value, source) !== undefined || attributes.length > 0) found.add(taxYear);
  }
  return [...found].sort((first, second) => first - second);
}

const statementFor = (value: PartnerAdjustmentYearFactValue, source: PartnerAdjustmentSource) =>
  source === "aar" ? value.aar : value.bbaAudit;

interface ColumnContext {
  source: PartnerAdjustmentSource;
  statements: ReadonlyArray<PlacedStatement>;
  years: ReadonlyMap<number, PartnerAdjustmentYearFactValue>;
  /* The AAR form's corrected amounts by year, for the audit form's "previously reported". */
  aarColumns: ReadonlyMap<number, PlannedColumn>;
}

/* The column's previous amounts: the AAR form's corrected ones for the audit form, else the return's. */
function previousOf(
  context: ColumnContext,
  taxYear: number,
  value: PartnerAdjustmentYearFactValue,
): PreviousAmounts | "waits" {
  const aar = context.source === "bba_audit" ? context.aarColumns.get(taxYear) : undefined;
  if (aar !== undefined) return aar.lines === undefined ? "waits" : correctedAmounts(aar.lines);
  return {
    income: value.totalIncome,
    deductions: value.totalDeductions,
    credits: value.totalCredits,
    incomeTax: value.totalIncomeTax,
  };
}

/* One column's lines, undefined while an answer waits; a string is a gap. */
function figureColumn(context: ColumnContext, taxYear: number): FiguredColumn | undefined | string {
  const value = context.years.get(taxYear);
  const statement = value === undefined ? undefined : statementFor(value, context.source);
  if (value === undefined || statement === undefined) return undefined;
  const mine = context.statements.filter(
    (each) => each.source === context.source && each.firstAffectedYear === taxYear,
  );
  // Line 15 waits for the penalty statement when a Form 8986 for the year lists a penalty.
  if (statement.penalties === undefined && mine.some((each) => each.listsPenalties))
    return undefined;
  const previous = previousOf(context, taxYear, value);
  if (previous === "waits") return undefined;
  const attributes = (value.attributeAdjustments ?? []).filter(
    (each) => each.source === context.source,
  );
  const amounts = [...mine.flatMap((each) => each.amounts), ...attributes.map(placedAttribute)];
  const lines = columnLines({
    taxYear,
    source: context.source,
    previous,
    adjustments: scheduleAColumn(amounts),
    statement,
  });
  if (lines.line15 > 0 && value.returnExtended === undefined) return undefined;
  const interest = columnInterest(lines, context.source, value.returnExtended);
  if (interest === undefined) return `Interest for ${taxYear} runs outside the rate table.`;
  return { ...lines, line17: roundDollars(interest) };
}

/* Every column of a source, in year order, with the year facts it waits for. */
function columnsOf(
  context: ColumnContext,
): { columns: PlannedColumn[]; waiting: string[] } | string {
  const columns: PlannedColumn[] = [];
  const waiting: string[] = [];
  for (const taxYear of yearsOf(context.source, context.statements, context.years)) {
    if (taxYear >= REPORTING_YEAR) {
      return `A Form 8978 column for ${taxYear} must be a year before the reporting year ${REPORTING_YEAR}.`;
    }
    const figured = figureColumn(context, taxYear);
    if (typeof figured === "string") return figured;
    if (figured === undefined) waiting.push(makePartnerAdjustmentYearFactKey(taxYear));
    columns.push({ taxYear, lines: figured });
  }
  return { columns, waiting };
}

/* Four columns to a form, more forms when a source has more years (::what-s-new::b02). */
function copiesOf(source: PartnerAdjustmentSource, columns: PlannedColumn[]): Form8978Copy[] {
  const copies: Form8978Copy[] = [];
  for (let start = 0; start < columns.length; start += COLUMNS_PER_FORM) {
    const part = columns.slice(start, start + COLUMNS_PER_FORM);
    const figured = part.map((column) => column.lines);
    const totals = figured.every((lines) => lines !== undefined)
      ? formTotals(figured as FiguredColumn[])
      : undefined;
    copies.push({ source, columns: part, totals });
  }
  return copies;
}

/* The forms of the return. The AAR form is completed first (::example-2-completing-form-8978-and-schedule-a-for::b05). */
export function planForms(
  statements: ReadonlyArray<PlacedStatement>,
  years: ReadonlyMap<number, PartnerAdjustmentYearFactValue>,
): Form8978Plan {
  const aar = columnsOf({ source: "aar", statements, years, aarColumns: new Map() });
  if (typeof aar === "string") return { copies: [], gap: aar, waitingKeys: [] };
  const aarColumns = new Map(aar.columns.map((column) => [column.taxYear, column]));
  const audit = columnsOf({ source: "bba_audit", statements, years, aarColumns });
  if (typeof audit === "string") return { copies: [], gap: audit, waitingKeys: [] };
  return {
    copies: [...copiesOf("aar", aar.columns), ...copiesOf("bba_audit", audit.columns)],
    waitingKeys: [...new Set([...aar.waiting, ...audit.waiting])],
  };
}
