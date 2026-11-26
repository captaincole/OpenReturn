/*
 * The current-year credits of Part III as the form enters them: the sources of
 * the resolver (sources.ts) with the lines the engine figures from its own
 * forms (Form 8911 line 3, Form 8936 lines 8 and 21), the research credit
 * limitation and the caps of lines 1e and 1k applied.
 */

import { numberOrBlank, prorateDollars, roundDollars, sum } from "../../money.js";
import { line3Of } from "../8911/credit.js";
import { gap, isGap, type Cell } from "./cells.js";
import type { CurrentCredit } from "./credits.js";
import type { CreditSource } from "./filingInfo.js";
import { RESEARCH_LINES } from "./rows.js";
import type { Accessor, Form3800Info } from "./tax.js";

/* "don't enter more than $5,000" (line-1e::b01); "don't enter more than $150,000" (line-1k::b01). */
export const DISABLED_ACCESS_CAP = 5_000;
export const CHILDCARE_CAP = 150_000;
const CAPS: ReadonlyArray<[line: string, cap: number]> = [
  ["1e", DISABLED_ACCESS_CAP],
  ["1k", CHILDCARE_CAP],
];

/* The cross-form lines that stand in for a K-1 credit (the K-1 detail and the source form's line). */
const FORM_8936_LINES = {
  new_clean_vehicle: {
    line: "1y",
    fieldId: "form-8936.0.line.8_business_investment_use_credit",
    k1: "newVehicleCodeAY",
  },
  commercial_clean_vehicle: {
    line: "1aa",
    fieldId: "form-8936.0.line.21_commercial_vehicle_credit_total",
    k1: "commercialCodeAZ",
  },
} as const;
const MAGI_GAP =
  "A new clean vehicle credit from a K-1 is limited by the modified AGI test of Form 8936 Part I (irs-3800-inst-2025::sec::line-1k::b01, lines 1y and 1aa), and Form 8936 does not file.";
const MISMATCH_GAP =
  "The K-1 clean vehicle credits differ from the amount Form 8936 takes from partnerships and S corporations (clean_vehicle_credit.k1_credits).";

const files = (info: Form3800Info, formId: string) => info.mustFile?.[formId]?.value === true;
const fromDetail = (source: CreditSource, detail: string) => source.fromK1?.detail === detail;

/* Line 1s: Form 8911 line 3, which already holds the K-1 code AO credits (its line 2). */
function refuelingLine(
  form: Accessor,
  info: Form3800Info,
  sources: CreditSource[],
): CreditSource[] | undefined {
  if (!files(info, "form-8911")) return sources;
  const kept = sources.filter((source) => !fromDetail(source, "refueling_property"));
  const value = line3Of(form, info);
  if (value === undefined) return undefined;
  if (isGap(value) || value > 0) {
    return [...kept, { credit: { line: "1s", key: "form-8911", amount: value, passive: false } }];
  }
  return kept;
}
/* Lines 1y and 1aa: Form 8936 lines 8 and 21, which hold the K-1 credits Form 8936 states. */
function cleanVehicleLine(
  form: Accessor,
  info: Form3800Info,
  sources: CreditSource[],
  detail: keyof typeof FORM_8936_LINES,
): CreditSource[] {
  const { line, fieldId, k1 } = FORM_8936_LINES[detail];
  const fromK1 = sources.filter((source) => fromDetail(source, detail));
  const value = files(info, "form-8936") ? numberOrBlank(form[fieldId]) : undefined;
  if (value === undefined || value <= 0) {
    if (detail === "commercial_clean_vehicle") return sources;
    return sources.map((source) =>
      fromDetail(source, detail) ? { credit: { ...source.credit, amount: gap(MAGI_GAP) } } : source,
    );
  }
  const stated = info.cleanVehicleAnswers?.k1Credits?.[k1] ?? 0;
  const onK1s = sum(...fromK1.map((source) => source.credit.amount));
  const amount: Cell =
    fromK1.length > 0 && roundDollars(stated) !== onK1s ? gap(MISMATCH_GAP) : value;
  const kept = sources.filter((source) => !fromDetail(source, detail));
  return [...kept, { credit: { line, key: "form-8936", amount, passive: false } }];
}

/*
 * The research credit limitation for an individual: Part II line 11 times the
 * taxable income attributable to the source over the taxable income, figured
 * for each source; "The sum of the fractions used for determining the limits
 * can't exceed 1" (irs-3800-inst-2025::sec::lines-1c-and-4i::b01, ::b02).
 */
export function researchLimits(
  line11: number,
  taxableIncome: number,
  attributable: number[],
): number[] {
  if (taxableIncome <= 0) return attributable.map(() => 0);
  const fractions = attributable.map((income) => Math.max(0, income) / taxableIncome);
  const total = sum(...fractions);
  const scale = total > 1 ? 1 / total : 1;
  return fractions.map((fraction) => roundDollars(line11 * fraction * scale));
}
const isResearch = (source: CreditSource) =>
  RESEARCH_LINES.includes(source.credit.line) && typeof source.credit.amount === "number";

function withResearchLimit(
  sources: CreditSource[],
  line11: Cell,
  taxableIncome: number,
): CreditSource[] {
  const research = sources.filter(isResearch);
  if (research.length === 0) return sources;
  if (isGap(line11))
    return sources.map((source) =>
      isResearch(source) ? { credit: { ...source.credit, amount: line11 } } : source,
    );
  const limits = researchLimits(
    line11 ?? 0,
    taxableIncome,
    research.map((source) => source.attributableTaxableIncome ?? 0),
  );
  return sources.map((source) => {
    const index = research.indexOf(source);
    if (index < 0) return source;
    const amount = Math.min(source.credit.amount as number, limits[index]);
    return { ...source, credit: { ...source.credit, amount } };
  });
}

/* Lines 1e and 1k: above the cap, "the limited amount allowed is allocated pro rata" (limitation-on-certain-credits-reported-in-part-iii::b01). */
export function capped(credits: CurrentCredit[]): CurrentCredit[] {
  return CAPS.reduce((all, [line, cap]) => {
    const onLine = all.filter((credit) => credit.line === line);
    const amounts = onLine.map((credit) => credit.amount);
    if (amounts.some(isGap) || sum(...amounts) <= cap) return all;
    const shares = prorateDollars(cap, amounts as number[]);
    return all.map((credit) => {
      const index = onLine.indexOf(credit);
      return index < 0 ? credit : { ...credit, amount: shares[index] };
    });
  }, credits);
}

/* The Part III credits, or undefined while Form 8911 waits. Line 11 and the taxable income serve the research limitation. */
export function currentCreditsOf(
  form: Accessor,
  info: Form3800Info,
  line11: Cell,
): CurrentCredit[] | undefined {
  const sources = info.form3800Sources?.current ?? [];
  const refueling = refuelingLine(form, info, sources);
  if (refueling === undefined) return undefined;
  const vehicles = cleanVehicleLine(
    form,
    info,
    cleanVehicleLine(form, info, refueling, "new_clean_vehicle"),
    "commercial_clean_vehicle",
  );
  const taxableIncome = numberOrBlank(form["form-1040.line.15"]);
  if (vehicles.some(isResearch) && (taxableIncome === undefined || line11 === undefined))
    return undefined;
  return capped(
    withResearchLimit(vehicles, line11, taxableIncome ?? 0).map((source) => source.credit),
  );
}
