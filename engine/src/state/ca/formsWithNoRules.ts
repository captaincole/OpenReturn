/*
 * The California forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision, so
 * they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleP540NRFilingInfo } from "./schedule-p-540nr/filingInfo.js";
import { resolveScheduleP540NRInfo } from "./schedule-p-540nr/resolveInfo.js";
import type { ScheduleXFilingInfo } from "./schedule-x/filingInfo.js";
import { resolveScheduleXInfo } from "./schedule-x/resolveInfo.js";

export type CaliforniaFormsWithNoRulesFilingInfo = ScheduleXFilingInfo & ScheduleP540NRFilingInfo;

export const CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolveScheduleXInfo, resolveScheduleP540NRInfo];
