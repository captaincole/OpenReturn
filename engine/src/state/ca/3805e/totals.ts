/*
 * Every FTB 3805E of the return, one per installment sale that has a form this
 * year, and what they send on (ca-3805e-inst-2025::sec::line-26-and-line-37::b01):
 * a capital asset's line 26 and line 37 to Schedule D (540) line 1, and trade
 * or business property, an ordinary gain and lines 25 and 36 to Schedule D-1,
 * whose lines 4 and 15 do not take them yet (scheduleD1Gap).
 */

import type { InstallmentSaleFact } from "../../../facts/index.js";
import { moneyLine, type SaleForm } from "../../../federal/6252/sale.js";
import type { InstallmentRow } from "../schedule-d-ca/lines.js";
import { scheduleDGain } from "./lines.js";
import { californiaSaleForm, filesThisYear } from "./sale.js";

export interface Form3805ETotals {
  /* One form per copy, in the order the facts were recorded. */
  forms: SaleForm[];
  /* Why no form can be figured (a malformed fact, or the decision with no fact). */
  gap?: string;
  /* Schedule D (540) line 1: one row per capital asset form with a gain this year. */
  scheduleDRows: InstallmentRow[];
  /*
   * Why an amount bound for Schedule D-1 is not carried; undefined when none is
   * sent. Schedule CA (540) line 4 columns B and C are a gap with this reason
   * (schedule-ca/otherGains.ts), and Schedule D-1 lines 7 to 21 are a gap too
   * (salesForScheduleD1).
   */
  scheduleD1Gap?: string;
}

export const SCHEDULE_D1_GAP =
  "FTB 3805E line 26 or 37 of trade or business property, or an ordinary gain, goes to Schedule D-1 line 4 or line 10, and lines 25 and 36 to Schedule D-1 line 15 (ca-3805e-inst-2025::sec::line-26-and-line-37::b01). The engine does not carry FTB 3805E amounts to Schedule D-1 yet, so Schedule CA (540) line 4 columns B and C are unsupported.";

type LineValue = ReturnType<typeof moneyLine>;

/* Lines 30–37 count when completed, and also while they are a gap or wait (line 37's stop). */
const partIIICounts = (form: SaleForm): boolean =>
  form.partIII?.completeLines30To37 === true || typeof moneyLine(form, 37, 0) !== "number";

/* Line 1 (a): the property, marked as the form's amount. */
const rowDescription = (form: SaleForm): string => `${form.sale.description} (FTB 3805E)`;

/* One capital asset form's Schedule D (540) line 1 row; undefined with no gain this year. */
export function scheduleDRow(form: SaleForm): InstallmentRow | undefined {
  const parts: LineValue[] = [moneyLine(form, 26, form.partII?.line26)];
  if (partIIICounts(form)) parts.push(moneyLine(form, 37, form.partIIILines?.line37));
  const blocked = parts.find((value) => typeof value === "object");
  const description = rowDescription(form);
  if (typeof blocked === "object") return { description, gain: undefined, gap: blocked.reason };
  if (parts.some((value) => value === undefined)) {
    return { description, gain: undefined, gap: undefined };
  }
  const [line26, line37] = parts as number[];
  const gain = scheduleDGain(line26, line37);
  return gain > 0 ? { description, gain, gap: undefined } : undefined;
}

/* A form that sends an amount to Schedule D-1. */
const sendsToScheduleD1 = (form: SaleForm): boolean =>
  form.sale.use !== "capital_asset" || (form.sale.remainingRecapture ?? 0) > 0;

/*
 * The installment sales with a form this year that send an amount to Schedule
 * D-1, from the facts alone: Schedule D-1 resolves before it can know whether
 * FTB 3805E files (FTB 3805E reads Schedule D (540), which reads Schedule D-1).
 * Schedule D-1 takes none of these amounts, whether or not FTB 3805E files.
 */
export function salesForScheduleD1(sales: InstallmentSaleFact[], joint: boolean): string[] {
  return sales
    .filter((sale) => {
      const form = californiaSaleForm(sale.key, sale.value, joint);
      return filesThisYear(form) && sendsToScheduleD1(form);
    })
    .map((sale) => sale.key);
}

/* Every form of the return; with a whole-form gap, no form is figured. */
export function form3805ETotals(
  sales: InstallmentSaleFact[],
  joint: boolean,
  gap: string | undefined,
): Form3805ETotals {
  if (gap !== undefined) return { forms: [], gap, scheduleDRows: [] };
  const forms = sales
    .map((sale) => californiaSaleForm(sale.key, sale.value, joint))
    .filter(filesThisYear);
  const capital = forms.filter((form) => form.sale.use === "capital_asset");
  return {
    forms,
    scheduleDRows: capital
      .map(scheduleDRow)
      .filter((row): row is InstallmentRow => row !== undefined),
    scheduleD1Gap: forms.some(sendsToScheduleD1) ? SCHEDULE_D1_GAP : undefined,
  };
}
