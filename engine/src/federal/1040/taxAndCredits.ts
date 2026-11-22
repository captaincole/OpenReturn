/* Form 1040 Tax and Credits: lines 16 to 24. */

import { lookupTax } from "../../data/taxTable.js";
import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import { line16WithForm8814, line3a } from "./form8814Lines.js";
import { qdcgInputsFromReturn } from "./qdcgInputs.js";
import type { Form1040 } from "./types.js";

type Form = FormAccessor<Form1040>;

/*
 * MANUAL EDIT: line 16 always uses the QDCG worksheet. With no
 * preferential income it gives the tax-table answer; one code path.
 */
export function line16(form: Form, info: Form1040FilingInfo) {
  if (!info.filingStatus) return undefined;
  const taxable = form["line.15"];
  if (typeof taxable !== "number") return undefined;

  try {
    const qdcg = computeQdcg(
      qdcgInputsFromReturn(
        form,
        taxable,
        // MANUAL EDIT: worksheet line 2 = 1040 line 3a as entered (a rounded document sum).
        numberOrBlank(line3a(info)) ?? 0,
        info.filingStatus,
      ),
    );
    return withForm4972(info, line16WithForm8814(info, qdcg.tax));
  } catch {
    // Unknown filing status or missing table data: use the plain tax table.
    const lookup = lookupTax("federal-2025", taxable, info.filingStatus);
    return withForm4972(info, line16WithForm8814(info, lookup.ok ? lookup.tax : undefined));
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

// MANUAL EDIT: line 17 = Schedule 2 line 3 (AMT + excess APTC); blank when Schedule 2 is not filed.
export function line17(form: Form) {
  const value = form["schedule-2.0.line.3_total_lines_1z_and_2"];
  return typeof value === "number" ? value : undefined;
}

export const line18 = (form: Form) =>
  form["line.16"] === undefined ? undefined : sum(form["line.16"], form["line.17"]);

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
