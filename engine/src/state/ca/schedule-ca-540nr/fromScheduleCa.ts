/*
 * Schedule CA (540NR) columns A, B and C, and Part III, are Schedule CA
 * (540)'s rules. "Use Schedule CA (540NR), column A through column D to
 * compute your total adjusted gross income as if you were a resident of
 * California for the entire year"
 * (ca-540nr-booklet-2025::sec::how-nonresidents-and-part-year-residents-are-taxed::b01),
 * and the column B and C instructions are the resident's
 * (ca-540nr-sched-ca-inst-2025::sec::column-b-and-column-c-subtractions-and-additions::b01:
 * "Generally, if a California resident cannot subtract the income in column B,
 * a nonresident or part-year resident may not subtract income in column B").
 * So each such field runs the Schedule CA (540) method of the same line, with
 * an accessor that reads each Schedule CA (540) line from its Schedule CA
 * (540NR) line (issue #336, point 3). A read the map does not name is an
 * error, not a blank.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import type { Unsupported } from "../../../types.js";
import { SCHEDULE_CA_BINDINGS, SCHEDULE_CA_UNSUPPORTED } from "../schedule-ca/bindings.js";
import type { ScheduleCaFilingInfo } from "../schedule-ca/filingInfo.js";
import type { ScheduleCa } from "../schedule-ca/types.js";
import catalog from "./catalog.json";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleCa540NR } from "./types.js";

const FORM_PREFIX = "schedule-ca-540nr.";
const SCHEDULE_CA_PREFIX = "schedule-ca.";

/* The Part III fields, whose names differ from Schedule CA (540) Part II's: 540NR field → 540 field. */
const PART_III_FIELDS: Readonly<Record<string, string>> = {
  "3.part3.itemize_ca_not_federal": "4.page2.itemize_ca_not_federal",
  "3.part3.1_medical_dental_expenses": "4.page2.medical_dental_expenses",
  "3.part3.2_federal_agi_line11b": "4.page2.medical_agi_line11b",
  "3.part3.3_medical_agi_threshold": "4.page2.medical_agi_threshold",
  "3.part3.4_medical_federal": "4.page2.medical_line4_federal",
  "3.part3.4_medical_additions": "4.page2.medical_line4_additions",
  "4.part3.18_itemized_total_combined": "5.page2.total_itemized_18_combined",
  "4.part3.19_unreimbursed_employee_expenses": "5.page2.job_expenses_19",
  "4.part3.20_tax_preparation_fees": "5.page2.job_expenses_20",
  "4.part3.21_other_expenses_type": "5.page2.job_expenses_21_type",
  "4.part3.21_other_expenses_amount": "5.page2.job_expenses_21_amount",
  "4.part3.22_job_expenses_total": "5.page2.job_expenses_22_total",
  "4.part3.23_federal_agi": "5.page2.job_expenses_23_agi",
  "4.part3.24_two_percent_of_agi": "5.page2.job_expenses_24_threshold",
  "4.part3.25_job_expenses_net": "5.page2.job_expenses_25_net",
  "4.part3.26_total_itemized_deductions": "5.page2.total_itemized_26",
  "4.part3.27_other_adjustments_type": "5.page2.other_adjustments_27_type",
  "4.part3.27_other_adjustments_amount": "5.page2.other_adjustments_27_amount",
  "4.part3.28_itemized_after_adjustments": "5.page2.total_itemized_28",
  "4.part3.29_itemized_after_agi_limit": "5.page2.total_itemized_29",
  "4.part3.30_itemized_or_standard_deduction": "5.page2.total_itemized_30_standard_or_itemized",
  "3.line.c24z_adjustment_type": "3.line.c24z_income_type",
};

/* Part III lines 5a to 17, by group: "<page>.part3.<line>_<group>_<column>" is "<page>.page2.<group>_<line>_<column>". */
const PART_III_GROUPS: ReadonlyArray<[string, string, string, readonly string[]]> = [
  ["3", "4", "taxes", ["5a", "5b", "5c", "5d", "5e", "6", "7"]],
  ["3", "4", "interest", ["8a", "8b", "8c", "8e", "9", "10"]],
  ["3", "5", "charity", ["11", "12", "13", "14"]],
];
const PART_III_RENAMED: ReadonlyArray<[string, string]> = [
  ["15_casualty_theft_loss", "casualty_15"],
  ["16_other_itemized_deductions", "other_deductions_16"],
  ["17_itemized_subtotal", "total_itemized_17"],
];
const COLUMNS = ["federal", "subtractions", "additions", "type"] as const;

function partIIIGroupFields(): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const [page, page540, group, lines] of PART_III_GROUPS) {
    for (const line of lines) {
      for (const column of COLUMNS) {
        pairs.push([
          `${page}.part3.${line}_${group}_${column}`,
          `${page540}.page2.${group}_${line}_${column}`,
        ]);
      }
    }
  }
  for (const [name, name540] of PART_III_RENAMED) {
    for (const column of COLUMNS)
      pairs.push([`4.part3.${name}_${column}`, `5.page2.${name540}_${column}`]);
  }
  return pairs;
}

/* A field's name after its page: "0.line.1a_federal" is "line.1a_federal". */
const afterPage = (fieldId: string) => fieldId.slice(fieldId.indexOf(".") + 1);

const SCHEDULE_CA_FIELDS = [
  ...Object.keys(SCHEDULE_CA_BINDINGS),
  ...Object.keys(SCHEDULE_CA_UNSUPPORTED),
];

/*
 * Schedule CA (540NR) field → Schedule CA (540) field. Part II lines and the
 * header have the same name on both schedules (only the page differs); Part
 * III is named in the tables above.
 */
function buildFieldMap(): Map<string, string> {
  const byName = new Map(SCHEDULE_CA_FIELDS.map((field) => [afterPage(field), field]));
  const map = new Map<string, string>();
  for (const { fieldId } of catalog.fields) {
    const field = fieldId.slice(FORM_PREFIX.length);
    const same = byName.get(afterPage(field));
    if (same !== undefined) map.set(field, same);
  }
  const named = [...Object.entries(PART_III_FIELDS), ...partIIIGroupFields()];
  for (const [field, field540] of named) {
    if (SCHEDULE_CA_FIELDS.includes(field540)) map.set(field, field540);
  }
  return map;
}

export const SCHEDULE_CA_FIELD_OF = buildFieldMap();
const FIELD_540NR_OF = new Map(
  [...SCHEDULE_CA_FIELD_OF].map(([field, field540]) => [field540, field]),
);

/* The Schedule CA (540NR) accessor, seen as Schedule CA (540)'s. */
function asScheduleCa(form: FormAccessor<ScheduleCa540NR>): FormAccessor<ScheduleCa> {
  const read = (field540: string) => {
    const field = FIELD_540NR_OF.get(field540);
    if (field === undefined) {
      throw new Error(
        `Schedule CA (540NR) has no line for the Schedule CA (540) read "${field540}".`,
      );
    }
    return form[field];
  };
  return new Proxy({} as FormAccessor<ScheduleCa>, {
    get(_target, key) {
      if (typeof key !== "string") return undefined;
      if (key.startsWith(SCHEDULE_CA_PREFIX)) return read(key.slice(SCHEDULE_CA_PREFIX.length));
      if (key.startsWith("form-540."))
        throw new Error(`Schedule CA (540NR) reads Form 540: "${key}".`);
      if (key.startsWith("form-") || key.startsWith("schedule-")) return form[key];
      return read(key);
    },
  });
}

/* The binding of any Schedule CA (540NR) field. */
export type Bind = BindingFn<ScheduleCa540NR, ScheduleCa540NRFilingInfo, keyof ScheduleCa540NR>;
type ScheduleCaMethod = BindingFn<ScheduleCa, ScheduleCaFilingInfo, keyof ScheduleCa>;

/* The Schedule CA (540) rule of a Schedule CA (540NR) field: its method, or its gap's reason. */
export type ScheduleCaRule = { bind: Bind } | { unsupported: string } | undefined;

export function scheduleCaRule(field: string): ScheduleCaRule {
  const field540 = SCHEDULE_CA_FIELD_OF.get(field) as keyof ScheduleCa | undefined;
  if (field540 === undefined) return undefined;
  const method = SCHEDULE_CA_BINDINGS[field540] as ScheduleCaMethod | undefined;
  if (method) {
    return {
      bind: (form, info) =>
        method(asScheduleCa(form), info) as
          ScheduleCa540NR[keyof ScheduleCa540NR] | Unsupported | undefined,
    };
  }
  const reason = SCHEDULE_CA_UNSUPPORTED[field540];
  return reason === undefined ? undefined : { unsupported: reason };
}

/* A Schedule CA (540) field that has no Schedule CA (540NR) field, read through the same accessor. */
export function scheduleCaValue(
  field540: keyof ScheduleCa,
  form: FormAccessor<ScheduleCa540NR>,
  info: ScheduleCa540NRFilingInfo,
): unknown {
  const method = SCHEDULE_CA_BINDINGS[field540] as ScheduleCaMethod | undefined;
  return method?.(asScheduleCa(form), info);
}
