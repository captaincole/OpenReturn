/*
 * The farm forms: Form 4835 (rent from farm land), Schedule F (a farm
 * business), Schedule J (farm and fishing income averaging) and Form 2210-F (the
 * estimated tax penalty of a farmer or fisher). They are joined here, and
 * filingInfo.ts takes them as one. A new farm form adds its type and resolver
 * here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form2210FFilingInfo } from "./2210-f/filingInfo.js";
import { resolve2210FInfo } from "./2210-f/resolveInfo.js";
import type { Form4835FilingInfo } from "./4835/filingInfo.js";
import { resolve4835Info } from "./4835/resolveInfo.js";
import type { ScheduleFFilingInfo } from "./schedule-f/filingInfo.js";
import { resolveScheduleFInfo } from "./schedule-f/resolveInfo.js";
import type { ScheduleJFilingInfo } from "./schedule-j/filingInfo.js";
import { resolveScheduleJInfo } from "./schedule-j/resolveInfo.js";

export type FarmFormsFilingInfo = ScheduleFFilingInfo &
  Form4835FilingInfo &
  ScheduleJFilingInfo &
  Form2210FFilingInfo;

export const FARM_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolveScheduleFInfo,
  resolve4835Info,
  resolveScheduleJInfo,
  resolve2210FInfo,
];
