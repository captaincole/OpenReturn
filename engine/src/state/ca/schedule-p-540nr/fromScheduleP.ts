/*
 * Schedule P (540NR) Part I, lines 22 to 24 and Part III are Schedule P
 * (540)'s lines: "In Part I, determine your adjustments and preferences that
 * apply to your total taxable income for the year as if you were a resident"
 * (ca-540nr-sched-p-inst-2025::sec::part-i-alternative-minimum-taxable-income::b01),
 * and the line instructions repeat the resident's with Form 540NR and
 * Schedule CA (540NR) in place of Form 540 and Schedule CA (540). So each such
 * field runs the Schedule P (540) method of the same line, with an accessor
 * that reads each Schedule P (540), Form 540 and Schedule CA (540) line from
 * the line that holds the same amount on this return (issue #336, point 3;
 * as 540nr/fromForm540.ts does for Form 540).
 *
 * A read the maps do not name is an error, not a blank: a Schedule P (540)
 * method that starts to read a new line must get its line here, or the field
 * shows the error instead of a wrong amount.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import type { Unsupported } from "../../../types.js";
import { SCHEDULE_CA_FIELD_OF } from "../schedule-ca-540nr/fromScheduleCa.js";
import schedulePCatalog from "../schedule-p/catalog.json";
import type { SchedulePFilingInfo } from "../schedule-p/filingInfo.js";
import type { ScheduleP } from "../schedule-p/types.js";
import catalog from "./catalog.json";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleP540NR } from "./types.js";

const FORM_PREFIX = "schedule-p-540nr.";
const SCHEDULE_P_PREFIX = "schedule-p.";
const SCHEDULE_CA_PREFIX = "schedule-ca.";
const SCHEDULE_CA_540NR_PREFIX = "schedule-ca-540nr.";

/* The Form 540 lines Schedule P (540) reads, and the Form 540NR line of the same amount. */
const FORM_540_TO_540NR: Readonly<Record<string, string>> = {
  "form-540.line.13_federal_agi": "form-540nr.1.line.13_federal_agi",
  "form-540.line.17_ca_agi": "form-540nr.1.line.17_agi_all_sources",
  "form-540.line.18_deductions": "form-540nr.1.line.18_deductions",
  "form-540.line.19_taxable_income": "form-540nr.1.line.19_total_taxable_income",
};

/* Schedule P (540) fields named differently on Schedule P (540NR). */
const RENAMED: Readonly<Record<string, string>> = {
  "1.line.24_tentative_minimum_tax": "1.line.24_total_tentative_minimum_tax",
  "1.part3.1_tax_from_form_540_line_35": "2.part3.1_tax_from_form_540nr_line_42",
};

/* A field's name after its page: "1.line.18_x" is "line.18_x". */
const afterPage = (fieldId: string) => fieldId.slice(fieldId.indexOf(".") + 1);
const shortId = (fieldId: string, prefix: string) => fieldId.slice(prefix.length);

/*
 * Schedule P (540) field → Schedule P (540NR) field: the same name after the
 * page (Part I, lines 22 and 23, Part III), and the renamed ones. Schedule P
 * (540) lines 25 and 26 hold the resident's regular tax and AMT, which Schedule
 * P (540NR) figures in its own lines 25 to 45 (partII.ts): no field.
 */
function buildFieldMap(): Map<string, string> {
  const byName = new Map(
    catalog.fields.map(({ fieldId }) => {
      const field = shortId(fieldId, FORM_PREFIX);
      return [afterPage(field), field];
    }),
  );
  const map = new Map<string, string>();
  for (const { fieldId } of schedulePCatalog.fields) {
    const field = shortId(fieldId, SCHEDULE_P_PREFIX);
    const same = RENAMED[field] ?? byName.get(afterPage(field));
    if (same !== undefined) map.set(field, same);
  }
  return map;
}

export const SCHEDULE_P_540NR_FIELD_OF = buildFieldMap();
const SCHEDULE_CA_540NR_FIELD_OF = new Map(
  [...SCHEDULE_CA_FIELD_OF].map(([field, field540]) => [field540, field]),
);

function ownField(field540: string): string {
  const field = SCHEDULE_P_540NR_FIELD_OF.get(field540);
  if (field === undefined) {
    throw new Error(`Schedule P (540NR) has no line for the Schedule P (540) read "${field540}".`);
  }
  return field;
}

function scheduleCaField(field540: string): string {
  const field = SCHEDULE_CA_540NR_FIELD_OF.get(field540);
  if (field === undefined) {
    throw new Error(
      `Schedule CA (540NR) has no line for the Schedule CA (540) read "${field540}".`,
    );
  }
  return `${SCHEDULE_CA_540NR_PREFIX}${field}`;
}

/* The full id this return holds the amount of a Schedule P (540) read in. */
function readOf(key: string): string {
  if (key.startsWith(SCHEDULE_P_PREFIX)) return ownField(shortId(key, SCHEDULE_P_PREFIX));
  if (key.startsWith(SCHEDULE_CA_PREFIX)) return scheduleCaField(shortId(key, SCHEDULE_CA_PREFIX));
  if (key.startsWith("form-540.")) {
    const line = FORM_540_TO_540NR[key];
    if (line === undefined) throw new Error(`Form 540NR has no line mapped for "${key}".`);
    return line;
  }
  // A credit form's line: read as it is (the form files with Form 540 only, so it is blank here).
  if (key.startsWith("form-") || key.startsWith("schedule-")) return key;
  return ownField(key);
}

/* The Schedule P (540NR) accessor, seen as Schedule P (540)'s. */
export function asScheduleP(form: FormAccessor<ScheduleP540NR>): FormAccessor<ScheduleP> {
  return new Proxy({} as FormAccessor<ScheduleP>, {
    get(_target, key) {
      if (typeof key !== "string") return undefined;
      return form[readOf(key)];
    },
  });
}

export type Bind = BindingFn<ScheduleP540NR, ScheduleP540NRFilingInfo, keyof ScheduleP540NR>;
export type SchedulePMethod = BindingFn<ScheduleP, SchedulePFilingInfo, keyof ScheduleP>;

/* The Schedule P (540) method of a line, as the binding of a Schedule P (540NR) line. */
export function fromScheduleP(method: SchedulePMethod): Bind {
  return (form, info) =>
    method(asScheduleP(form), info) as
      ScheduleP540NR[keyof ScheduleP540NR] | Unsupported | undefined;
}

/* The Schedule P (540) field of a Schedule P (540NR) field, if it has one. */
const FIELD_540_OF = new Map(
  [...SCHEDULE_P_540NR_FIELD_OF].map(([field540, field]) => [field, field540]),
);
export const scheduleP540FieldOf = (field: string) =>
  FIELD_540_OF.get(field) as keyof ScheduleP | undefined;
