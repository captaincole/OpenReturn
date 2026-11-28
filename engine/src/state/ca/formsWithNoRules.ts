/*
 * The California forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision, so
 * they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form3503FilingInfo } from "./3503/filingInfo.js";
import { resolve3503Info } from "./3503/resolveInfo.js";
import type { Form3504FilingInfo } from "./3504/filingInfo.js";
import { resolve3504Info } from "./3504/resolveInfo.js";
import type { Form3521FilingInfo } from "./3521/filingInfo.js";
import { resolve3521Info } from "./3521/resolveInfo.js";
import type { Form3523FilingInfo } from "./3523/filingInfo.js";
import { resolve3523Info } from "./3523/resolveInfo.js";
import type { Form3531FilingInfo } from "./3531/filingInfo.js";
import { resolve3531Info } from "./3531/resolveInfo.js";
import type { Form3540FilingInfo } from "./3540/filingInfo.js";
import { resolve3540Info } from "./3540/resolveInfo.js";
import type { ScheduleXFilingInfo } from "./schedule-x/filingInfo.js";
import { resolveScheduleXInfo } from "./schedule-x/resolveInfo.js";

export type CaliforniaFormsWithNoRulesFilingInfo = ScheduleXFilingInfo &
  Form3503FilingInfo &
  Form3504FilingInfo &
  Form3521FilingInfo &
  Form3523FilingInfo &
  Form3531FilingInfo &
  Form3540FilingInfo;

export const CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolveScheduleXInfo,
  resolve3503Info,
  resolve3504Info,
  resolve3521Info,
  resolve3523Info,
  resolve3531Info,
  resolve3540Info,
];
