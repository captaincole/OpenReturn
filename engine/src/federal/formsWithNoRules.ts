/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form2210FFilingInfo } from "./2210-f/filingInfo.js";
import { resolve2210FInfo } from "./2210-f/resolveInfo.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form8332FilingInfo } from "./8332/filingInfo.js";
import { resolve8332Info } from "./8332/resolveInfo.js";
import type { Form8833FilingInfo } from "./8833/filingInfo.js";
import { resolve8833Info } from "./8833/resolveInfo.js";
import type { Form8933FilingInfo } from "./8933/filingInfo.js";
import { resolve8933Info } from "./8933/resolveInfo.js";
import type { Form8992FilingInfo } from "./8992/filingInfo.js";
import { resolve8992Info } from "./8992/resolveInfo.js";
import type { ScheduleJFilingInfo } from "./schedule-j/filingInfo.js";
import { resolveScheduleJInfo } from "./schedule-j/resolveInfo.js";
export type FederalFormsWithNoRulesFilingInfo = Form5471FilingInfo &
  Form8933FilingInfo &
  Form8992FilingInfo &
  ScheduleJFilingInfo &
  Form2210FFilingInfo &
  Form8332FilingInfo &
  Form8833FilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve5471Info,
  resolve8933Info,
  resolve8992Info,
  resolveScheduleJInfo,
  resolve2210FInfo,
  resolve8332Info,
  resolve8833Info,
];
