/*
 * The California forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision, so
 * they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form3507FilingInfo } from "./3507/filingInfo.js";
import { resolve3507Info } from "./3507/resolveInfo.js";
import type { Form3541FilingInfo } from "./3541/filingInfo.js";
import { resolve3541Info } from "./3541/resolveInfo.js";
import type { Form3801CRFilingInfo } from "./3801-cr/filingInfo.js";
import { resolve3801CRInfo } from "./3801-cr/resolveInfo.js";
import type { Form3805EFilingInfo } from "./3805e/filingInfo.js";
import { resolve3805EInfo } from "./3805e/resolveInfo.js";
import type { Form3805VFilingInfo } from "./3805v/filingInfo.js";
import { resolve3805VInfo } from "./3805v/resolveInfo.js";
import type { Form3805ZFilingInfo } from "./3805z/filingInfo.js";
import { resolve3805ZInfo } from "./3805z/resolveInfo.js";
import type { Form3807FilingInfo } from "./3807/filingInfo.js";
import { resolve3807Info } from "./3807/resolveInfo.js";
import type { Form3809FilingInfo } from "./3809/filingInfo.js";
import { resolve3809Info } from "./3809/resolveInfo.js";
import type { Form3840FilingInfo } from "./3840/filingInfo.js";
import { resolve3840Info } from "./3840/resolveInfo.js";
import type { Form3853FilingInfo } from "./3853/filingInfo.js";
import { resolve3853Info } from "./3853/resolveInfo.js";
import type { Form5805FFilingInfo } from "./5805f/filingInfo.js";
import { resolve5805FInfo } from "./5805f/resolveInfo.js";
import type { Form5870AFilingInfo } from "./5870a/filingInfo.js";
import { resolve5870AInfo } from "./5870a/resolveInfo.js";
import type { ScheduleD1FilingInfo } from "./schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "./schedule-d-1/resolveInfo.js";
import type { ScheduleD540NRFilingInfo } from "./schedule-d-540nr/filingInfo.js";
import { resolveScheduleD540NRInfo } from "./schedule-d-540nr/resolveInfo.js";
import type { ScheduleP540NRFilingInfo } from "./schedule-p-540nr/filingInfo.js";
import { resolveScheduleP540NRInfo } from "./schedule-p-540nr/resolveInfo.js";
import type { ScheduleXFilingInfo } from "./schedule-x/filingInfo.js";
import { resolveScheduleXInfo } from "./schedule-x/resolveInfo.js";

export type CaliforniaFormsWithNoRulesFilingInfo = ScheduleXFilingInfo &
  Form3507FilingInfo &
  Form3541FilingInfo &
  Form3805VFilingInfo &
  Form3805ZFilingInfo &
  Form3807FilingInfo &
  Form3809FilingInfo &
  Form3853FilingInfo &
  Form5805FFilingInfo &
  Form5870AFilingInfo &
  Form3801CRFilingInfo &
  Form3805EFilingInfo &
  Form3840FilingInfo &
  ScheduleD1FilingInfo &
  ScheduleD540NRFilingInfo &
  ScheduleP540NRFilingInfo;

export const CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolveScheduleXInfo,
  resolve3507Info,
  resolve3541Info,
  resolve3805VInfo,
  resolve3805ZInfo,
  resolve3807Info,
  resolve3809Info,
  resolve3853Info,
  resolve5805FInfo,
  resolve5870AInfo,
  resolve3801CRInfo,
  resolve3805EInfo,
  resolve3840Info,
  resolveScheduleD1Info,
  resolveScheduleD540NRInfo,
  resolveScheduleP540NRInfo,
];
