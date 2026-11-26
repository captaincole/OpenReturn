/* Form 1040 Tax and Credits: lines 16 to 24. */

import { lookupTax } from "../../data/taxTable.js";
import type { FormAccessor } from "../../defineForm.js";
import { atLeast, formatDollars, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import { amtGap } from "../6251/foreignTaxCredit.js";
import { childTaxOnLine16 } from "../8615/form.js";
import { form8621Amount, withForm8621 } from "../8621/totals.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import { foreignTaxOnLine16 } from "./foreignEarnedIncomeTax.js";
import { line16WithForm8814, line3a } from "./form8814Lines.js";
import { qdcgInputsFromReturn, scheduleDWorksheetTax } from "./qdcgInputs.js";
import type { Form1040 } from "./types.js";

type Form = FormAccessor<Form1040>;

/*
 * MANUAL EDIT: line 16 uses the QDCG worksheet, or the Schedule D Tax
 * Worksheet when Schedule D line 19 has an amount (qdcgInputs.ts). With no
 * preferential income the QDCG worksheet gives the tax-table answer.
 * A child who files Form 8615 enters its line 18 instead
 * (irs-8615-inst-2025::sec::line-18::b01).
 */
export function line16(form: Form, info: Form1040FilingInfo) {
  if (!info.filingStatus) return undefined;
  const taxable = form["line.15"];
  if (typeof taxable !== "number") return undefined;
  const childTax = childTaxOnLine16(form, info);
  if (childTax !== "regular") {
    return typeof childTax === "number"
      ? otherLine16Taxes(info, line16WithForm8814(info, childTax))
      : childTax;
  }

  // MANUAL EDIT: worksheet line 2 = 1040 line 3a as entered (a rounded document sum).
  const qualifiedDividends = numberOrBlank(line3a(info)) ?? 0;
  // MANUAL EDIT: with Form 2555, the Foreign Earned Income Tax Worksheet (foreignEarnedIncomeTax.ts).
  const foreign = foreignTaxOnLine16(form, info, taxable, qualifiedDividends);
  if (foreign.kind === "waiting") return undefined;
  if (foreign.kind === "gap") return foreign.gap;
  if (foreign.kind === "tax") return otherLine16Taxes(info, line16WithForm8814(info, foreign.tax));
  try {
    const qdcg = computeQdcg(
      qdcgInputsFromReturn(form, taxable, qualifiedDividends, info.filingStatus),
    );
    // MANUAL EDIT: the Schedule D Tax Worksheet when Schedule D line 19 has an amount (qdcgInputs.ts).
    const tax =
      scheduleDWorksheetTax(form, taxable, qualifiedDividends, info.filingStatus) ?? qdcg.tax;
    // Box 1 (Form 8814), then box 2 (Form 4972) and box 3 (Form 8621), each once.
    return otherLine16Taxes(info, line16WithForm8814(info, tax));
  } catch {
    // Unknown filing status or missing table data: use the plain tax table.
    const lookup = lookupTax("federal-2025", taxable, info.filingStatus);
    return otherLine16Taxes(info, line16WithForm8814(info, lookup.ok ? lookup.tax : undefined));
  }
}

const form4972Files = (info: Form1040FilingInfo) => info.mustFile?.["form-4972"]?.value === true;

/*
 * MANUAL EDIT: line 16 adds the tax from Form 4972 and checks box 2
 * (irs-1040-inst-2025::sec::line-16::b01). Each spouse's form adds: "combine the
 * tax, and include the combined tax in the total on Form 1040 ... line 16"
 * (irs-4972-form-2025::sec::specific-instructions::b01). With no Form 4972 the
 * line is what it was.
 */
function withForm4972(
  info: Form1040FilingInfo,
  tax: number | Unsupported | undefined,
): number | Unsupported | undefined {
  if (!form4972Files(info) || typeof tax !== "number") return tax;
  if (info.form4972TaxGap) return unsupported(info.form4972TaxGap);
  return info.form4972Tax === undefined ? undefined : sum(tax, info.form4972Tax);
}

// MANUAL EDIT: line 16 box 2, "Tax from Form 4972 ... Check the appropriate box" (::line-16::b01).
export const line16FromForm4972 = (_: unknown, info: Form1040FilingInfo) =>
  form4972Files(info) && (info.form4972Tax ?? 0) > 0 ? true : undefined;

/*
 * MANUAL EDIT: line 16 also takes "Any tax from Form 8621, line 16e, relating
 * to a section 1291 fund" (irs-1040-inst-2025::sec::line-16::b01), every
 * fund's. With no fund the line is what it was.
 */
function otherLine16Taxes(
  info: Form1040FilingInfo,
  tax: number | Unsupported | undefined,
): number | Unsupported | undefined {
  const withLumpSum = withForm4972(info, tax);
  if (typeof withLumpSum !== "number") return withLumpSum;
  return withForm8621(info.form8621Totals, withLumpSum, (amounts) => amounts.section1291Tax);
}

const OTHER_FORM_BOX =
  "Checkbox indicating tax includes amounts from a third special form (e.g. section 962 election, recapture). No ingestion scenario built for these edge cases.";
const OTHER_FORM_TEXT =
  "Free-text entry for the form number associated with the third checkbox on line 16. Tied to special-form tax scenarios not yet ingested.";
const SECTION_1291_TAX = "1291TAX";

/* The section 1291 tax on line 16, or why box 3 is not known: the other box 3 taxes are not modeled. */
function section1291Tax(info: Form1040FilingInfo, without: string): number | Unsupported {
  const gap = info.form8621Totals?.gap;
  if (gap !== undefined) return unsupported(gap);
  return (
    form8621Amount(info.form8621Totals, (amounts) => amounts.section1291Tax) ?? unsupported(without)
  );
}

/*
 * MANUAL EDIT: line 16 box 3 for the Form 8621 tax: "Check box 3 and enter the
 * amount of the tax and '1291TAX' in the space next to that box"
 * (irs-1040-inst-2025::sec::line-16::b02).
 */
export const line16FromOtherForm = (_: unknown, info: Form1040FilingInfo) => {
  const tax = section1291Tax(info, OTHER_FORM_BOX);
  return typeof tax === "number" ? true : tax;
};

export const line16OtherFormNumber = (_: unknown, info: Form1040FilingInfo) => {
  const tax = section1291Tax(info, OTHER_FORM_TEXT);
  return typeof tax === "number" ? `${SECTION_1291_TAX} ${formatDollars(tax)}` : tax;
};

/*
 * MANUAL EDIT: line 17 = Schedule 2 line 3 (AMT + excess APTC); blank when Schedule 2 is not filed.
 * A gap in the AMT (Form 6251 line 11) is a gap here and on line 18, so the
 * total tax never prints without it.
 */
export function line17(form: Form, info: Form1040FilingInfo) {
  const value = form["schedule-2.0.line.3_total_lines_1z_and_2"];
  return typeof value === "number" ? value : amtGap(form, info);
}

export const line18 = (form: Form, info: Form1040FilingInfo) =>
  form["line.16"] === undefined
    ? undefined
    : (amtGap(form, info) ?? sum(form["line.16"], form["line.17"]));

// MANUAL EDIT: line 19 = Schedule 8812 line 14; blank when Schedule 8812 is not filed.
export function line19(form: Form) {
  const value = form["schedule-8812.0.line.14_child_tax_credit_and_other_dependents"];
  return typeof value === "number" ? value : undefined;
}

export function line20(form: Form) {
  const value = form["schedule-3.0.line.8"];
  return typeof value === "number" ? value : undefined;
}

export const line21 = (form: Form) =>
  form["line.19"] === undefined && form["line.20"] === undefined
    ? undefined
    : sum(form["line.19"], form["line.20"]);

export const line22 = (form: Form) =>
  form["line.18"] === undefined
    ? undefined
    : atLeast(0, sum(form["line.18"], form["line.21"] === undefined ? 0 : -form["line.21"]));

// MANUAL EDIT: line 23 = Schedule 2 line 21 (other taxes); blank when Schedule 2 is not filed.
export function line23(form: Form) {
  const value = form["schedule-2.1.line.21_total_other_taxes"];
  return typeof value === "number" ? value : undefined;
}

/*
 * Blank when Schedule H line 9 is Yes: Schedule 2 line 21 is blank then
 * (FUTA tax not modeled), and sum() would count it as 0.
 */
export const line24 = (form: Form) =>
  form["line.22"] === undefined || form["schedule-h.0.line.9_yes"] === true
    ? undefined
    : sum(form["line.22"], form["line.23"]);
