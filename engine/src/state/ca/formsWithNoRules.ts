/*
 * The California forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision, so
 * they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form3809FilingInfo } from "./3809/filingInfo.js";
import { resolve3809Info } from "./3809/resolveInfo.js";
import type { ScheduleD540NRFilingInfo } from "./schedule-d-540nr/filingInfo.js";
import { resolveScheduleD540NRInfo } from "./schedule-d-540nr/resolveInfo.js";
import type { ScheduleP540NRFilingInfo } from "./schedule-p-540nr/filingInfo.js";
import { resolveScheduleP540NRInfo } from "./schedule-p-540nr/resolveInfo.js";
import type { ScheduleXFilingInfo } from "./schedule-x/filingInfo.js";
import { resolveScheduleXInfo } from "./schedule-x/resolveInfo.js";

export type CaliforniaFormsWithNoRulesFilingInfo = ScheduleXFilingInfo &
  Form3809FilingInfo &
  ScheduleD540NRFilingInfo &
  ScheduleP540NRFilingInfo;

export const CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolveScheduleXInfo, resolve3809Info, resolveScheduleD540NRInfo, resolveScheduleP540NRInfo];
