/*
 * Form 8615 from the child's return and the answers. Every read is by full
 * field id, so Form 1040 line 16 can call childTaxOnLine16 with its own accessor.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import { netLongTermGain, qdcgInputsFromReturn } from "../1040/qdcgInputs.js";
import type { Form8615Answers, Form8615FilingInfo } from "./filingInfo.js";
import {
  addParts,
  line1,
  line14Parts,
  line2,
  line5Parts,
  line6,
  lines12And13,
  type PreferentialParts,
} from "./lines.js";
import { taxOnAmount, type TaxOnAmount } from "./tax.js";

/* Any form's accessor: these functions read fields by their full id only. */
export type Accessor = { readonly [fieldId: string]: unknown };

export type Line = number | Unsupported;
export type TaxLine = TaxOnAmount | Unsupported;

export interface PartII {
  line6: Line;
  line7?: number;
  line8: Line;
  line9: TaxLine;
  line10: TaxLine;
  line11: Line;
  line12a?: number;
  line12b?: number;
  line13: Line;
}

export interface PartIII {
  line14: number;
  line15: TaxLine;
  line16: Line;
  line17: TaxLine;
  line18: Line;
}

export interface Form8615Lines {
  line1: number;
  line2: number;
  line3: number;
  /* Absent when line 3 is zero or less: "stop" (irs-8615-inst-2025::sec::line-3::b01). */
  line4?: number;
  line5?: number;
  /* Absent when line 5 is zero: "stop" (::line-5::b01). */
  partII?: PartII;
  partIII?: PartIII;
}

const CHILD_FORM_2555 =
  "The child files Form 2555: line 1 uses the Alternate Worksheet with the foreign exclusions and line 4 the Foreign Earned Income Tax Worksheet (::line-1::b01, ::line-4::b01), which the engine does not model.";
const CHILD_ELECTION =
  "The child's Form 4952 line 4g election puts the tax on the Schedule D Tax Worksheet (::using-the-qualified-dividends-and-capital-gain-tax-worksheet::b03, irs-1040sd-inst-2025::sec::schedule-d-tax-worksheet::b01), which the engine models only for Form 1040 line 16.";

const amount = (form: Accessor, id: string) => numberOrBlank(form[id]) ?? 0;

/* The child's return as the form reads it; undefined while a line it needs is blank. */
function childReturn(form: Accessor) {
  const totalIncome = numberOrBlank(form["form-1040.line.9"]);
  const agi = numberOrBlank(form["form-1040.line.11b"]);
  const taxableIncome = numberOrBlank(form["form-1040.line.15"]);
  const deductions = numberOrBlank(form["form-1040.line.12e"]);
  if ([totalIncome, agi, taxableIncome, deductions].includes(undefined)) return undefined;
  const business = amount(form, "schedule-1.0.line.3");
  const farm = amount(form, "schedule-1.0.line.6");
  return {
    totalIncome: totalIncome!,
    adjustedGrossIncome: agi!,
    taxableIncome: taxableIncome!,
    deductions: deductions!,
    // ::alternate-worksheet-for-form-8615-line-1::b01, line D: a business loss counts as zero.
    earnedIncome: amount(form, "form-1040.line.1z") + Math.max(0, business) + Math.max(0, farm),
    earlyWithdrawalPenalty: amount(form, "schedule-1.1.line.18"),
    // Line B: each self-employment loss and the net operating loss deduction (Schedule 1 line 8a, entered as a negative).
    alternateWorksheetLosses:
      Math.max(0, -business) +
      Math.max(0, -farm) +
      Math.max(0, -amount(form, "schedule-1.0.line.8a")),
    parts: {
      qualifiedDividends: amount(form, "form-1040.line.3a"),
      netCapitalGain: netLongTermGain(form),
    } satisfies PreferentialParts,
    elected: amount(form, "form-4952.0.line.4g_elected_investment_income") > 0,
  };
}

type Child = NonNullable<ReturnType<typeof childReturn>>;

const firstGap = (...lines: unknown[]) =>
  lines.find(
    (line): line is Unsupported =>
      typeof line === "object" && line !== null && "unsupported" in line,
  );

/* Lines 6 through 13 (::line-6::b01 through ::line-13::b01). */
function partII(
  line5: number,
  onLine5: PreferentialParts,
  answers: Form8615Answers,
  info: Form8615FilingInfo,
  child: Child,
): PartII {
  const { parent, otherChildren } = answers;
  const parentGap = info.form8615ParentIncomeGap
    ? unsupported(info.form8615ParentIncomeGap)
    : undefined;
  const line7 = otherChildren?.netUnearnedIncome;
  const line6Value: Line = parentGap ?? line6(parent.taxableIncome);
  const line8: Line =
    typeof line6Value === "number" ? line5 + line6Value + (line7 ?? 0) : line6Value;
  const parentParts = {
    qualifiedDividends: parent.qualifiedDividends ?? 0,
    netCapitalGain: parent.netCapitalGain ?? 0,
  };
  const line9Gap =
    info.form8615Line9Gap ?? (child.elected ? `Line 9: ${CHILD_ELECTION}` : undefined);
  const line9: TaxLine =
    firstGap(line8) ??
    (line9Gap
      ? unsupported(line9Gap)
      : taxOnAmount(
          line8 as number,
          addParts(onLine5, parentParts, otherChildren ?? addParts()),
          parent.filingStatus,
        ));
  const line10: TaxLine = parentGap ?? {
    tax: parent.tax,
    worksheetUsed:
      parentParts.qualifiedDividends + parentParts.netCapitalGain > 0 ||
      parent.usedScheduleJ === true ||
      parent.hasRate28OrSection1250Gain === true,
  };
  const gap = firstGap(line9, line10);
  if (gap) {
    // Lines 12a and 12b read only lines 5 and 7.
    const { line12a, line12b } = lines12And13(line5, line7, 0);
    return {
      line6: line6Value,
      line7,
      line8,
      line9,
      line10,
      line11: gap,
      line12a,
      line12b,
      line13: gap,
    };
  }
  const line11 = (line9 as TaxOnAmount).tax - (line10 as TaxOnAmount).tax;
  return {
    line6: line6Value,
    line7,
    line8,
    line9,
    line10,
    line11,
    ...lines12And13(line5, line7, line11),
  };
}

/* Lines 14 through 18 (::line-14::b01 through ::line-18::b01). */
function partIII(
  form: Accessor,
  info: Form8615FilingInfo,
  child: Child,
  line5: number,
  onLine5: PreferentialParts,
  line13: Line,
): PartIII {
  const childGap = info.form8615ChildTaxGap ? unsupported(info.form8615ChildTaxGap) : undefined;
  const line14 = child.taxableIncome - line5;
  const line15: TaxLine =
    line14 === 0
      ? { tax: 0, worksheetUsed: false }
      : (childGap ??
        (child.elected
          ? unsupported(`Line 15: ${CHILD_ELECTION}`)
          : taxOnAmount(line14, line14Parts(child.parts, onLine5), info.filingStatus!)));
  const line16: Line = firstGap(line13, line15) ?? (line13 as number) + (line15 as TaxOnAmount).tax;
  // Line 17: the child's tax as Form 1040 line 16 figures it, the same worksheet inputs.
  const line17: TaxLine = childGap ?? {
    tax: computeQdcg(
      qdcgInputsFromReturn(
        form,
        child.taxableIncome,
        child.parts.qualifiedDividends,
        info.filingStatus!,
      ),
    ).tax,
    worksheetUsed: child.parts.qualifiedDividends + child.parts.netCapitalGain > 0,
  };
  const line18: Line =
    firstGap(line16, line17) ?? Math.max(line16 as number, (line17 as TaxOnAmount).tax);
  return { line14, line15, line16, line17, line18 };
}

/*
 * The form's lines; undefined while the form does not file or an input is
 * blank; unsupported when the child files Form 2555.
 */
export function form8615Lines(
  form: Accessor,
  info: Form8615FilingInfo,
): Form8615Lines | Unsupported | undefined {
  if (info.mustFile?.["form-8615"]?.value !== true) return undefined;
  if (info.mustFile?.["form-2555"]?.value === true) return unsupported(CHILD_FORM_2555);
  const answers = info.form8615Answers;
  const child = childReturn(form);
  if (answers === undefined || child === undefined || info.filingStatus === undefined)
    return undefined;
  const itemizes = info.useItemizedDeductions === true;
  const first = line1(child);
  const second = line2(itemizes, answers.itemizedForUnearnedIncome);
  const line3 = first - second;
  const partI = { line1: first, line2: second, line3 };
  if (line3 <= 0) return partI;
  const line4 = child.taxableIncome;
  const line5 = Math.min(line3, line4);
  if (line5 <= 0) return { ...partI, line4, line5 };
  const onLine5 = line5Parts({
    ...child.parts,
    form8615Line1: first,
    form8615Line2: second,
    form8615Line3: line3,
    form8615Line5: line5,
    itemizes,
    itemizedForDividendsAndGains: answers.itemizedForDividendsAndGains,
    deductions: child.deductions,
    adjustedGrossIncome: child.adjustedGrossIncome,
  });
  const tentativeTax = partII(line5, onLine5, answers, info, child);
  return {
    ...partI,
    line4,
    line5,
    partII: tentativeTax,
    partIII: partIII(form, info, child, line5, onLine5, tentativeTax.line13),
  };
}

/*
 * Form 1040 line 16's tax on taxable income: Form 8615 line 18 when the form
 * figures the tax (::line-18::b01), else the regular tax ("regular": the form
 * does not file, or line 3 or 5 stops it: "Figure the tax on your child's
 * taxable income in the normal manner", ::line-3::b01, ::line-5::b01).
 * Undefined while the form waits; unsupported with the gap.
 */
export function childTaxOnLine16(
  form: Accessor,
  info: Form8615FilingInfo,
): "regular" | number | Unsupported | undefined {
  if (info.mustFile?.["form-8615"]?.value !== true) return "regular";
  const lines = form8615Lines(form, info);
  if (lines === undefined || "unsupported" in lines) return lines;
  return lines.partIII === undefined ? "regular" : lines.partIII.line18;
}
