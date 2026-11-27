/*
 * The California forms a Form 540NR return would need that the engine figures
 * for Form 540 only. Each form's resolver files it with Form 540
 * (decisions.scope.must_file_ca_540) and its lines read Form 540's lines, so on
 * a Form 540NR return it does not file. A line of Form 540NR or Schedule CA
 * (540NR) that takes one of them is a named gap when this return would need
 * the form, so the return never prints a silent wrong amount (issue #336,
 * point 4). Which forms: each resolver runs again as if the return were a
 * full-year resident's Form 540, and a form that would file there is listed.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import { resolve3461Info } from "../3461/resolveInfo.js";
import { resolve3506Info } from "../3506/resolveInfo.js";
import { resolve3507Info } from "../3507/resolveInfo.js";
import { resolve3510Info } from "../3510/resolveInfo.js";
import { resolve3514Info } from "../3514/resolveInfo.js";
import { resolve3526Info } from "../3526/resolveInfo.js";
import { resolve3541Info } from "../3541/resolveInfo.js";
import { resolve3800CaInfo } from "../3800-ca/resolveInfo.js";
import { resolve3801CRInfo } from "../3801-cr/resolveInfo.js";
import { resolve3801Info } from "../3801/resolveInfo.js";
import { resolve3803Info } from "../3803/resolveInfo.js";
import { resolve3804CRInfo } from "../3804-cr/resolveInfo.js";
import { resolve3805pInfo } from "../3805p/resolveInfo.js";
import { resolve3805VInfo } from "../3805v/resolveInfo.js";
import { resolve3853Info } from "../3853/resolveInfo.js";
import { resolve3885AInfo } from "../3885a/resolveInfo.js";
import { resolve3913Info } from "../3913/resolveInfo.js";
import { resolve5805Info } from "../5805/resolveInfo.js";
import { resolve5805FInfo } from "../5805f/resolveInfo.js";
import { resolve5870AInfo } from "../5870a/resolveInfo.js";
import { resolveScheduleD1Info } from "../schedule-d-1/resolveInfo.js";
import { resolveScheduleG1Info } from "../schedule-g-1/resolveInfo.js";
import { resolveScheduleSInfo } from "../schedule-s/resolveInfo.js";

/* A California form that Form 540NR lines take, with the name a gap gives it. */
interface FormOnlyWith540 {
  formId: string;
  name: string;
  resolve: (inputs: ResolverInputs) => BaseFilingInfo;
}

export const FORMS_ONLY_WITH_540: ReadonlyArray<FormOnlyWith540> = [
  { formId: "form-3506", name: "FTB 3506", resolve: resolve3506Info },
  { formId: "form-3510", name: "FTB 3510", resolve: resolve3510Info },
  { formId: "form-3801-cr", name: "FTB 3801-CR", resolve: resolve3801CRInfo },
  { formId: "form-3804-cr", name: "FTB 3804-CR", resolve: resolve3804CRInfo },
  { formId: "schedule-s", name: "Schedule S", resolve: resolveScheduleSInfo },
  // Schedule P (540NR) Part III takes these two credits too (schedule-p-540nr/partIII.ts).
  { formId: "form-3507", name: "FTB 3507", resolve: resolve3507Info },
  { formId: "form-3541", name: "FTB 3541", resolve: resolve3541Info },
  { formId: "form-3800-ca", name: "FTB 3800", resolve: resolve3800CaInfo },
  { formId: "form-3803", name: "FTB 3803", resolve: resolve3803Info },
  { formId: "schedule-g-1", name: "Schedule G-1", resolve: resolveScheduleG1Info },
  { formId: "form-5870a", name: "FTB 5870A", resolve: resolve5870AInfo },
  { formId: "form-3805p", name: "FTB 3805P", resolve: resolve3805pInfo },
  { formId: "form-3514", name: "FTB 3514", resolve: resolve3514Info },
  { formId: "form-3853", name: "FTB 3853", resolve: resolve3853Info },
  { formId: "form-5805", name: "FTB 5805", resolve: resolve5805Info },
  { formId: "form-5805f", name: "FTB 5805F", resolve: resolve5805FInfo },
  { formId: "schedule-d-1", name: "Schedule D-1", resolve: resolveScheduleD1Info },
  { formId: "form-3801", name: "FTB 3801", resolve: resolve3801Info },
  { formId: "form-3885a", name: "FTB 3885A", resolve: resolve3885AInfo },
  { formId: "form-3461", name: "FTB 3461", resolve: resolve3461Info },
  { formId: "form-3913", name: "FTB 3913", resolve: resolve3913Info },
  { formId: "form-3805v", name: "FTB 3805V", resolve: resolve3805VInfo },
  { formId: "form-3526", name: "FTB 3526", resolve: resolve3526Info },
];

/* The same answers, as a full-year resident who files Form 540 would give them. */
export function asFullYearResident(inputs: ResolverInputs): ResolverInputs {
  const decisionByKey = new Map(inputs.decisionByKey);
  decisionByKey.set("decisions.scope.must_file_ca_540", true);
  decisionByKey.set("decisions.scope.ca_residency", "full_year");
  return { ...inputs, decisionByKey };
}

/* The ids of the forms in FORMS_ONLY_WITH_540 that this return would file with Form 540. */
export function formsNeededOnly540(inputs: ResolverInputs): string[] {
  const resident = asFullYearResident(inputs);
  return FORMS_ONLY_WITH_540.filter(
    ({ formId, resolve }) => resolve(resident).mustFile?.[formId]?.value === true,
  ).map(({ formId }) => formId);
}

/* The gap a line gives when it takes a form that this return needs. */
export function formOnly540Gap(formId: string): string {
  const name = FORMS_ONLY_WITH_540.find((form) => form.formId === formId)?.name ?? formId;
  return `This return needs ${name}, which the engine figures for Form 540 only, not yet for a Form 540NR return.`;
}
