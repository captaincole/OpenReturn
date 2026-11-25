/*
 * Every Form 6252 of the return, one per installment sale, and what they send
 * to other lines: line 26 and line 37 to Schedule D line 4 or 11, or to Form
 * 4797 line 4 or 10 (irs-6252-form-2025::sec::line-26::b01, line-37::b01);
 * lines 25 and 36 to Form 4797 line 15 (line-25::b01); and the unrecaptured
 * section 1250 gain to the Schedule D worksheet (irs-1040sd-inst-2025::sec::line-4::b01).
 */

import type { InstallmentSaleFact } from "../../facts/index.js";
import { sum } from "../../money.js";
import { unrecapturedSection1250 } from "./lines.js";
import { moneyLine, saleForm, type SaleForm } from "./sale.js";

/* What the forms send to one line of another form: an amount, a gap, or a wait. */
export interface Destination {
  /* One amount per sale that sends one, in form order. */
  amounts: number[];
  gap?: string;
  waits: boolean;
}

export interface Form6252Totals {
  forms: SaleForm[];
  /* Why no form can be figured (a malformed fact, or the decision with no fact). */
  gap?: string;
  scheduleDLine4?: Destination;
  scheduleDLine11?: Destination;
  form4797Line4?: Destination;
  form4797Line10?: Destination;
  form4797Line15?: Destination;
  /* Unrecaptured Section 1250 Gain Worksheet line 4 (trade or business property). */
  worksheetLine4?: Destination;
  /* The same worksheet's line 12 (property with no entry in Form 4797 Part I). */
  worksheetLine12?: Destination;
}

type DestinationKey = Exclude<keyof Form6252Totals, "forms" | "gap">;

const DESTINATIONS: readonly DestinationKey[] = [
  "scheduleDLine4",
  "scheduleDLine11",
  "form4797Line4",
  "form4797Line10",
  "form4797Line15",
  "worksheetLine4",
  "worksheetLine12",
];

type LineValue = number | { reason: string } | undefined;

/* Where line 26 and line 37 go (line-26::b01; Pub. 537, reporting-an-installment-sale::b03–b04). */
function gainDestination(form: SaleForm): DestinationKey {
  if (form.sale.use === "capital_asset")
    return form.longTerm ? "scheduleDLine11" : "scheduleDLine4";
  if (form.sale.use === "business" && form.longTerm) return "form4797Line4";
  return "form4797Line10";
}

/* A sale whose form sends an amount to Form 4797 (line 4, 10 or 15): it files Form 4797. */
export function sendsToForm4797(form: SaleForm): boolean {
  return gainDestination(form).startsWith("form4797") || (form.sale.remainingRecapture ?? 0) > 0;
}

/* A line's contribution: its amount, 0 when the line is not completed. */
function add(target: Destination, value: LineValue, completed: boolean): void {
  if (!completed) return;
  if (typeof value === "object") target.gap ??= value.reason;
  else if (value === undefined) target.waits = true;
  else target.amounts.push(value);
}

/* Lines 26 and 37 together, and lines 25 and 36 together, for one sale. */
function saleAmounts(form: SaleForm) {
  // Lines 30–37 count when completed, and also while they are a gap or wait (line 37's stop).
  const partIII =
    form.partIII?.completeLines30To37 === true || typeof moneyLine(form, 37, 0) !== "number";
  return {
    gain: [
      moneyLine(form, 26, form.partII?.line26),
      moneyLine(form, 37, form.partIIILines?.line37),
    ] as const,
    ordinary: [
      moneyLine(form, 25, form.partII?.line25),
      moneyLine(form, 36, form.partIIILines?.line36),
    ] as const,
    partIII,
  };
}

/*
 * One sale's income this year, as routed() sends it: lines 25 and 26 (line 24),
 * with lines 36 and 37 (line 35) when Part III counts. An amount, a gap, or
 * undefined while it waits.
 */
export function saleIncome(form: SaleForm): LineValue {
  const { gain, ordinary, partIII } = saleAmounts(form);
  const parts = partIII ? [...gain, ...ordinary] : [gain[0], ordinary[0]];
  const blocked = parts.find((value) => typeof value === "object");
  if (blocked !== undefined) return blocked;
  const amounts = parts.filter((value): value is number => typeof value === "number");
  return amounts.length === parts.length ? sum(...amounts) : undefined;
}

/* The unrecaptured section 1250 gain in this year's gain (lines.ts), or the gain's gap or wait. */
function worksheetValue(
  form: SaleForm,
  gain: readonly [LineValue, LineValue],
  partIII: boolean,
): LineValue {
  const blocked = gain.find((value) => typeof value === "object");
  if (blocked !== undefined) return blocked;
  if (moneyLine(form, 23, 0) === undefined || gain[0] === undefined) return undefined;
  if (partIII && gain[1] === undefined) return undefined;
  if (form.partI === undefined || form.line19 === undefined) return undefined;
  return unrecapturedSection1250({
    line9: form.partI.line9,
    line12: form.partI.line12,
    line14: form.partI.line14,
    line19: form.line19,
    line23: form.partII?.line23,
    gainThisYear: sum(gain[0], gain[1]),
  });
}

function worksheetDestination(form: SaleForm): DestinationKey | undefined {
  if (form.sale.section1250 !== true || !form.longTerm) return undefined;
  if (form.sale.use === "business") return "worksheetLine4";
  return form.sale.use === "capital_asset" ? "worksheetLine12" : undefined;
}

const empty = (): Destination => ({ amounts: [], waits: false });

/* The amounts the figured forms send on. */
function routed(forms: SaleForm[]): Partial<Record<DestinationKey, Destination>> {
  const out: Partial<Record<DestinationKey, Destination>> = {};
  const at = (key: DestinationKey): Destination => (out[key] ??= empty());
  for (const form of forms) {
    const { gain, ordinary, partIII } = saleAmounts(form);
    const target = at(gainDestination(form));
    add(target, gain[0], true);
    add(target, gain[1], partIII);
    // Lines 25 and 36 hold an amount only with recapture not yet reported (line-25::b01).
    if ((form.sale.remainingRecapture ?? 0) > 0) {
      add(at("form4797Line15"), ordinary[0], true);
      add(at("form4797Line15"), ordinary[1], partIII);
    }
    const worksheet = worksheetDestination(form);
    if (worksheet !== undefined) add(at(worksheet), worksheetValue(form, gain, partIII), true);
  }
  return out;
}

/* Every form of the return; with a whole-form gap, every line the forms could reach is a gap. */
export function form6252Totals(
  sales: InstallmentSaleFact[],
  joint: boolean,
  gap: string | undefined,
): Form6252Totals {
  if (gap !== undefined) {
    const blocked = Object.fromEntries(
      DESTINATIONS.map((key) => [key, { amounts: [], gap, waits: false }]),
    );
    return { forms: [], gap, ...blocked };
  }
  const forms = sales.map((sale) => saleForm(sale.key, sale.value, joint));
  return { forms, ...routed(forms) };
}

/* A destination's total: blank with nothing sent, while it waits, or with a gap (the caller reads the gap). */
export function destinationTotal(destination: Destination | undefined): number | undefined {
  if (destination === undefined || destination.waits || destination.gap !== undefined) {
    return undefined;
  }
  return destination.amounts.length === 0 ? undefined : sum(...destination.amounts);
}
