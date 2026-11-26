/*
 * The whole of Form 8582-CR for one return, from Form 3800's passive sources:
 * the worksheet rows, lines 1a to 37, and the allowed part of each credit.
 * Form 3800 takes the allowed parts (its Part III column (g), Part IV column
 * (e), Part V column (d)(4), Part I line 3, Part II lines 24 and 33); this
 * form's bindings print the lines. The sources come in as an argument, so this
 * module does not import Form 3800's form.ts (no import circle).
 */

import { sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { isGap, type Cell } from "../3800/cells.js";
import { allocate, type Allocation } from "./allocation.js";
import type { PassiveLimitInfo } from "./filingInfo.js";
import { form8582CRLines, type Form8582CRLines, type PartIAmounts } from "./lines.js";
import {
  form8582Line9Of,
  magiOf,
  netPassiveIncomeOf,
  taxAttributableOf,
  type Accessor,
  type Waiting,
} from "./returnInputs.js";
import {
  passiveEntriesOf,
  type PassiveEntries,
  type PassiveSource,
  type Worksheet,
} from "./worksheets.js";

export const PUBLICLY_TRADED_GAP =
  "A credit from a publicly traded partnership is allowed by the PTP steps outside the form (irs-8582cr-inst-2025::sec::computation-of-allowed-passive-activity-credits::b01 to ::b05), which the engine does not figure.";

export interface PassiveCreditLimit {
  entries: PassiveEntries;
  lines: Form8582CRLines;
  /* Undefined when a line is a gap (gap holds it). */
  allocation?: Allocation;
  gap?: Unsupported;
}

/* The MFS caution: a separate return that lived with the spouse at any time; undefined while not answered. */
export function livedWithSpouseOf(info: PassiveLimitInfo): boolean | undefined {
  if (info.filingStatus !== "married_filing_separately") return false;
  const apart = info.livedApartFromSpouseAllYear;
  return apart === undefined ? undefined : !apart;
}

/* Lines 1a to 4b: the worksheets' column totals; blank when the column has no row. */
function partIAmountsOf(entries: PassiveEntries): PartIAmounts {
  const column = (worksheet: Worksheet, pick: "current" | "prior") => {
    const rows = entries.entries.filter((entry) => entry.worksheet === worksheet);
    const amounts = rows.map((entry) => entry[pick]).filter((amount) => amount !== 0);
    return sumOrBlank(...amounts);
  };
  return {
    line1a: column(1, "current"),
    line1b: column(1, "prior"),
    line2a: column(2, "current"),
    line2b: column(2, "prior"),
    line3a: column(3, "current"),
    line3b: column(3, "prior"),
    line4a: column(4, "current"),
    line4b: column(4, "prior"),
  };
}

const waits = (value: unknown): value is Waiting => value === "waiting";

/* The form, or undefined while an answer or a line it reads waits. */
export function passiveCreditLimitOf(
  sources: ReadonlyArray<PassiveSource>,
  form: Accessor,
  info: PassiveLimitInfo,
): PassiveCreditLimit | undefined {
  const livedWithSpouse = livedWithSpouseOf(info);
  if (livedWithSpouse === undefined) return undefined;
  const entries = passiveEntriesOf(sources, livedWithSpouse);
  if (entries.waiting) return undefined;
  if (entries.gap) return { entries, lines: {}, gap: entries.gap };
  const taxAttributable = taxAttributableOf(form, info);
  const npi = netPassiveIncomeOf(form, info);
  const line9 = form8582Line9Of(form, info);
  if (waits(taxAttributable) || waits(npi) || waits(line9)) return undefined;
  const taxOf = (amount: number): Cell =>
    isGap(taxAttributable) ? taxAttributable : taxAttributable(amount);
  const line6 = isGap(npi) ? npi : npi === 0 ? 0 : taxOf(npi as number);
  let magiWaits = false;
  const magi = (): Cell => {
    const value = magiOf(form, info);
    if (waits(value)) magiWaits = true;
    return waits(value) ? undefined : value;
  };
  const lines = form8582CRLines(partIAmountsOf(entries), {
    line6,
    livedWithSpouse,
    mfsApart: info.filingStatus === "married_filing_separately" && !livedWithSpouse,
    magi,
    form8582Line9: line9,
    taxAttributable: taxOf,
  });
  if (magiWaits) return undefined;
  const gap = [lines.line37, lines.line5].find(isGap);
  if (gap) return { entries, lines, gap };
  return { entries, lines, allocation: allocate(entries.entries, lines) };
}

/* What Form 8582-CR allows of one passive source of Form 3800: a number, or the gap that stops it. */
export function allowedForSource(limit: PassiveCreditLimit, source: PassiveSource): Cell {
  if (limit.entries.publiclyTraded.includes(source)) return unsupported(PUBLICLY_TRADED_GAP);
  if (limit.gap) return limit.gap;
  return limit.allocation?.allowed.get(source) ?? 0;
}
