/*
 * The whole of FTB 3801-CR for one return: the worksheet rows of the
 * California passive credits, lines 1a to 17, and the allowed part of each
 * credit. The worksheets, their allocation (Worksheets 5 to 9) and lines 1a to
 * 16 are the federal Form 8582-CR's, in California amounts
 * (ca-3801cr-inst-2025::sec::specific-line-instructions::b01).
 */

import { isGap, type Cell } from "../../../federal/3800/cells.js";
import { allocate, type Allocation } from "../../../federal/8582-cr/allocation.js";
import { livedWithSpouseOf, partIAmountsOf } from "../../../federal/8582-cr/form.js";
import type { Accessor, Waiting } from "../../../federal/8582-cr/returnInputs.js";
import { passiveEntriesOf, type PassiveEntries } from "../../../federal/8582-cr/worksheets.js";
import type { Unsupported } from "../../../types.js";
import type { Form3801CRInfo } from "./filingInfo.js";
import { form3801CRLines, type Form3801CRLines } from "./lines.js";
import {
  caNetPassiveIncomeOf,
  caTaxAttributableOf,
  federalMagiOf,
  ftb3801Line9Of,
} from "./returnInputs.js";

export interface CaPassiveCreditLimit {
  entries: PassiveEntries;
  lines: Form3801CRLines;
  /* Undefined when a line is a gap (gap holds it). */
  allocation?: Allocation;
  gap?: Unsupported;
}

const waits = (value: unknown): value is Waiting => value === "waiting";

/* The California passive credits' rows, or undefined while an answer waits. */
export function caPassiveEntriesOf(info: Form3801CRInfo): PassiveEntries | undefined {
  const livedWithSpouse = livedWithSpouseOf(info);
  if (livedWithSpouse === undefined) return undefined;
  const entries = passiveEntriesOf(info.caPassiveCreditSources ?? [], livedWithSpouse);
  return entries.waiting ? undefined : entries;
}

/* The form, or undefined while an answer or a line it reads waits. */
export function caPassiveCreditLimitOf(
  form: Accessor,
  info: Form3801CRInfo,
): CaPassiveCreditLimit | undefined {
  const entries = caPassiveEntriesOf(info);
  if (entries === undefined) return undefined;
  if (entries.gap) return { entries, lines: {}, gap: entries.gap };
  const taxAttributable = caTaxAttributableOf(form, info);
  const npi = caNetPassiveIncomeOf(form, info);
  const line9 = ftb3801Line9Of(form, info);
  if (waits(taxAttributable) || waits(npi) || waits(line9)) return undefined;
  const taxOf = (amount: number): Cell =>
    isGap(taxAttributable) ? taxAttributable : taxAttributable(amount);
  const line6 = isGap(npi) ? npi : npi === 0 ? 0 : taxOf(npi as number);
  let magiWaits = false;
  const magi = (): Cell => {
    const value = federalMagiOf(form, info);
    if (waits(value)) magiWaits = true;
    return waits(value) ? undefined : value;
  };
  const livedWithSpouse = livedWithSpouseOf(info) === true;
  const lines = form3801CRLines(partIAmountsOf(entries), {
    line6,
    livedWithSpouse,
    mfsApart: info.filingStatus === "married_filing_separately" && !livedWithSpouse,
    magi,
    form8582Line9: line9,
    taxAttributable: taxOf,
  });
  if (magiWaits) return undefined;
  const gap = [lines.line17, lines.line5].find(isGap);
  if (gap) return { entries, lines, gap };
  // Worksheets 5 to 9 share line 16 among Worksheet 1 and the rest by line 5 less line 17.
  return {
    entries,
    lines,
    allocation: allocate(entries.entries, { ...lines, line37: lines.line17 }),
  };
}
