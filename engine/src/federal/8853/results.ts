/*
 * Form 8853 results for the forms that take them (Schedule 1 lines 8e and 23,
 * Schedule 2 lines 17e and 17f, Form 8889 line 4, Schedule CA). A receiving
 * line reads the resolver's lines, not the evaluated fields, so it can tell a
 * line that is blank (nothing applies) from one that waits or is unsupported.
 */

import { sumOrBlank } from "../../money.js";
import type { Unsupported } from "../../types.js";
import type { Form8853FilingInfo } from "./filingInfo.js";
import type { Form8853 } from "./types.js";

export const files8853 = (info: Form8853FilingInfo): boolean =>
  info.mustFile?.["form-8853"]?.value === true;

/* Part I holds only the spouse's self-only Archer MSA (Form 8889 line 4 leaves it out). */
export const archerSpouseSelfOnly = (info: Form8853FilingInfo): boolean =>
  info.form8853ArcherSpouseSelfOnly === true;

const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && (value as Unsupported).unsupported === true;

/*
 * The sum of some Form 8853 lines: unsupported when one of them is, blank
 * while one that applies waits for an answer, else the total (blank when
 * every line is blank).
 */
export function form8853Total(
  info: Form8853FilingInfo,
  fields: ReadonlyArray<keyof Form8853>,
): number | Unsupported | undefined {
  const lines = info.form8853Lines ?? {};
  const values = fields.map((field) => lines[field]);
  const gap = values.find(isUnsupported);
  if (gap !== undefined) return gap;
  const expected = info.form8853Expected ?? [];
  if (fields.some((field) => expected.includes(field) && lines[field] === undefined))
    return undefined;
  return sumOrBlank(...values);
}

/*
 * Whether Form 8853 puts an amount on a schedule: it files, and one of the
 * lines is above zero, waits for an answer, or is unsupported. A Form 8853
 * whose distributions all went to medical expenses adds nothing, so the
 * schedule does not file for it.
 */
export function form8853Reaches(
  info: Form8853FilingInfo,
  fields: ReadonlyArray<keyof Form8853>,
): boolean {
  if (!files8853(info)) return false;
  const total = form8853Total(info, fields);
  return typeof total !== "number" ? total !== undefined || waits(info, fields) : total > 0;
}

const waits = (info: Form8853FilingInfo, fields: ReadonlyArray<keyof Form8853>): boolean =>
  fields.some(
    (field) =>
      (info.form8853Expected ?? []).includes(field) && info.form8853Lines?.[field] === undefined,
  );

/* The lines Schedule 1 takes (lines 8e and 23) and Schedule 2 takes (lines 17e and 17f). */
export const SCHEDULE_1_LINES: ReadonlyArray<keyof Form8853> = [
  "0.line.5_archer_msa_deduction",
  "0.line.8_taxable_archer_msa_distributions",
  "0.line.12_taxable_medicare_advantage_distributions",
  "1.line.26_taxable_payments",
];
export const SCHEDULE_2_LINES: ReadonlyArray<keyof Form8853> = [
  "0.line.9b_additional_20_tax",
  "0.line.13b_additional_50_tax",
];
