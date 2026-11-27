/*
 * MANUAL EDIT: written by hand. Page 1 holds Part I and Part II columns (a) to
 * (f); page 2 Part II columns (g) to (k) and Part III; page 3 Part IV. Every
 * amount comes from the section 965 facts (facts/kinds/section965.ts) through
 * resolveInfo.ts; the arithmetic is in lines.ts, liabilityLines.ts and
 * sCorporations.ts.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form965AFilingInfo, Form965AInputs } from "./filingInfo.js";
import type { Form965ALine, PartILine } from "./liabilityLines.js";
import { INSTALLMENT_YEARS, REPORTING_YEAR } from "./lines.js";
import type { PartIIIRow, PartIVRow } from "./sCorporations.js";
import type { Form965A } from "./types.js";

type Fn = (form: unknown, info: Form965AFilingInfo) => unknown;
type Bindings = Partial<{ [K in keyof Form965A]: BindingFn<Form965A, Form965AFilingInfo, K> }>;

const LINES = 8;
const INCLUSION_LINES = 4;
const PART_III_YEARS = 4;
const PART_III_ROWS = 4;
const PART_IV_ROWS = 10;
/* Part II columns (b) to (i), one for each installment year. */
const PAYMENT_COLUMNS = ["b", "c", "d", "e", "f", "g", "h", "i"] as const;
const FIRST_PAGE_PAYMENT_COLUMNS = 5;

/* Any field of the form: unsupported when one form cannot hold the facts, blank before it files. */
const ofForm =
  (pick: (form: Form965AInputs) => unknown): Fn =>
  (_, info) => {
    if (info.form965AGap) return unsupported(info.form965AGap);
    return info.form965A === undefined ? undefined : pick(info.form965A);
  };

const lineOf = (form: Form965AInputs, line: number): Form965ALine | undefined =>
  form.lines[line - 1];

/* A Part I cell: printed whenever the line exists (lines-1-through-8::b07 to b09). */
const partI = (line: number, pick: (partI: PartILine) => unknown): Fn =>
  ofForm((form) => {
    const found = lineOf(form, line);
    return found === undefined ? undefined : pick(found.partI);
  });

const checked = (value: boolean) => (value ? true : undefined);

/* Part I, columns (a) to (k) of one line. Lines 1 to 4 print their year; lines 5 to 8 shade column (e). */
function partIBindings(line: number): Record<string, Fn> {
  const prefix = `0.part1.${line}_net_965_liability_col_`;
  const out: Record<string, Fn> = {
    [`${prefix}b`]: partI(line, (cells) => cells.netTaxWithAll965),
    [`${prefix}c`]: partI(line, (cells) => cells.netTaxWithout965),
    [`${prefix}d`]: partI(line, (cells) => cells.net965),
    [`${prefix}f`]: partI(line, (cells) => cells.eligible),
    [`${prefix}g_yes`]: partI(line, (cells) => checked(cells.election === true)),
    [`${prefix}g_no`]: partI(line, (cells) => checked(cells.election === false)),
    [`${prefix}h`]: partI(line, (cells) => cells.paidInFull),
    [`${prefix}i`]: partI(line, (cells) => cells.inInstallments),
    [`${prefix}j`]: partI(line, (cells) => cells.transfersAndAdjustments),
    [`${prefix}k`]: partI(line, (cells) => cells.counterpartyTin),
  };
  if (line <= INCLUSION_LINES) out[`${prefix}e`] = partI(line, (cells) => cells.deferred);
  else out[`${prefix}a`] = partI(line, (cells) => String(cells.year));
  return out;
}

/* A Part II cell: unsupported with the line's gap (line-1::b02 to b05). */
const partII = (line: number, pick: (found: Form965ALine) => unknown): Fn =>
  ofForm((form) => {
    const found = lineOf(form, line);
    if (found?.gap !== undefined) return unsupported(found.gap);
    return found?.partII === undefined ? undefined : pick(found);
  });

/* Part II, columns (a) to (k) of one line. */
function partIIBindings(line: number): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  const firstPage = `0.part2.${line}_liability_paid_col_`;
  const secondPage = `1.part2.${line}_net_965_tax_liability_col_`;
  if (line > INCLUSION_LINES) {
    out[`${firstPage}a`] = partI(line, (cells) => String(cells.year));
  }
  for (let year = 1; year <= INSTALLMENT_YEARS; year++) {
    const column = PAYMENT_COLUMNS[year - 1]!;
    const prefix = year <= FIRST_PAGE_PAYMENT_COLUMNS ? firstPage : secondPage;
    out[`${prefix}${column}`] = partII(line, (found) => found.partII?.payments[year - 1]);
  }
  out[`${secondPage}j`] = partII(line, (found) => found.partII?.remaining);
  out[`${secondPage}k`] = partII(line, (found) => found.partII?.paidThisYear);
  return out;
}

const totalOf = (value: number | string | undefined) =>
  typeof value === "string" ? unsupported(value) : value;

/* Part III, one S corporation row of one year (lines-1-through-4::b01 to b03). */
function partIIIRowBindings(yearLine: number, slot: number): Record<string, Fn> {
  const row = (pick: (row: PartIIIRow) => unknown): Fn =>
    ofForm((form) => {
      const found = form.partIII[yearLine - 1]?.rows[slot];
      return found === undefined ? undefined : pick(found);
    });
  const prefix = `1.part3.${yearLine}_row${slot + 1}_col_`;
  return {
    [`${prefix}a`]: row((found) => found.name),
    [`${prefix}b`]: row((found) => found.ein),
    [`${prefix}c`]: row((found) => found.withThisSCorporation),
    [`${prefix}d`]: row((found) => found.without),
    [`${prefix}e`]: row((found) => found.net),
    [`${prefix}f_yes`]: row((found) => checked(found.deferralElection)),
    [`${prefix}f_no`]: row((found) => checked(!found.deferralElection)),
    [`${prefix}g`]: row((found) => found.deferred),
  };
}

function partIIIBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let yearLine = 1; yearLine <= PART_III_YEARS; yearLine++) {
    for (let slot = 0; slot < PART_III_ROWS; slot++) {
      Object.assign(out, partIIIRowBindings(yearLine, slot));
    }
    out[`1.part3.${yearLine}_total_col_g`] = ofForm(
      (form) => form.partIII[yearLine - 1]?.totalDeferred,
    );
  }
  return out;
}

/* Part IV, one line (part-iv-annual-report-of-deferred::b01 to b06). */
function partIVRowBindings(slot: number): Record<string, Fn> {
  const row = (pick: (row: PartIVRow) => unknown): Fn =>
    ofForm((form) => {
      const found = form.partIV[slot];
      return found === undefined ? undefined : pick(found);
    });
  const withGap = (pick: (row: PartIVRow) => unknown) =>
    row((found) => (found.gap === undefined ? pick(found) : unsupported(found.gap)));
  const prefix = `2.part4.${slot + 1}_s_corp_liability_col_`;
  return {
    [`${prefix}a`]: row((found) => String(found.year)),
    [`${prefix}b`]: row((found) => found.name),
    [`${prefix}c`]: row((found) => found.ein),
    [`${prefix}d`]: row((found) => found.beginning),
    // Column (f): blank unless a 2025 triggering event, which is a gap (sCorporations.ts).
    [`${prefix}f`]: withGap(() => undefined),
    [`${prefix}g`]: row((found) => found.transfer),
    [`${prefix}h`]: row((found) => found.counterpartyTin),
    [`${prefix}i`]: withGap((found) => found.ending),
  };
}

function partIVBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let slot = 0; slot < PART_IV_ROWS; slot++) Object.assign(out, partIVRowBindings(slot));
  out["2.part4.total_s_corp_liability_col_i"] = ofForm((form) => totalOf(form.partIVTotal));
  return out;
}

function partsIAndIIBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let line = 1; line <= LINES; line++) {
    Object.assign(out, partIBindings(line), partIIBindings(line));
  }
  // Totals: column (j) adds the lines' unpaid amounts, column (k) this year's payments (Schedule 2 line 20).
  out["1.part2.totals_net_965_tax_liability_col_j"] = ofForm((form) =>
    totalOf(form.totals.remaining),
  );
  out["1.part2.totals_net_965_tax_liability_col_k"] = ofForm((form) =>
    totalOf(form.totals.paidThisYear),
  );
  return out;
}

export function register(): void {
  const bindings: Record<string, Fn> = {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.identifying_number": (_, info) => info.taxpayerSSN,
    "0.header.taxable_year_of_reporting": ofForm(() => String(REPORTING_YEAR)),
    /*
     * The box is for "an amended return that is filed to change any reporting
     * related to section 965" (irs-965a-inst-2025::sec::specific-instructions::b01).
     * The engine prepares the original return, so the box is blank.
     */
    "0.header.amended_report": () => undefined,
    ...partsIAndIIBindings(),
    ...partIIIBindings(),
    ...partIVBindings(),
  };
  defineForm<Form965A, Form965AFilingInfo>("form-965-a", {
    bindings: bindings as Bindings,
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as unknown as Parameters<typeof SSN.format>[0]),
    },
  });
}
