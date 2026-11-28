/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form7207FilingInfo } from "./7207/filingInfo.js";
import { resolve7207Info } from "./7207/resolveInfo.js";
import type { Form7211FilingInfo } from "./7211/filingInfo.js";
import { resolve7211Info } from "./7211/resolveInfo.js";
import type { Form7213FilingInfo } from "./7213/filingInfo.js";
import { resolve7213Info } from "./7213/resolveInfo.js";
import type { Form7218FilingInfo } from "./7218/filingInfo.js";
import { resolve7218Info } from "./7218/resolveInfo.js";
import type { Form8835FilingInfo } from "./8835/filingInfo.js";
import { resolve8835Info } from "./8835/resolveInfo.js";
import type { Form8874FilingInfo } from "./8874/filingInfo.js";
import { resolve8874Info } from "./8874/resolveInfo.js";
import type { Form8896FilingInfo } from "./8896/filingInfo.js";
import { resolve8896Info } from "./8896/resolveInfo.js";
import type { Form8900FilingInfo } from "./8900/filingInfo.js";
import { resolve8900Info } from "./8900/resolveInfo.js";
import type { Form8906FilingInfo } from "./8906/filingInfo.js";
import { resolve8906Info } from "./8906/resolveInfo.js";
import type { Form8908FilingInfo } from "./8908/filingInfo.js";
import { resolve8908Info } from "./8908/resolveInfo.js";
import type { Form8911ScheduleAFilingInfo } from "./8911-schedule-a/filingInfo.js";
import { resolve8911ScheduleAInfo } from "./8911-schedule-a/resolveInfo.js";
import type { Form8932FilingInfo } from "./8932/filingInfo.js";
import { resolve8932Info } from "./8932/resolveInfo.js";
import type { Form8933ScheduleAFilingInfo } from "./8933-schedule-a/filingInfo.js";
import { resolve8933ScheduleAInfo } from "./8933-schedule-a/resolveInfo.js";
import type { Form8933ScheduleBFilingInfo } from "./8933-schedule-b/filingInfo.js";
import { resolve8933ScheduleBInfo } from "./8933-schedule-b/resolveInfo.js";
import type { Form8933ScheduleCFilingInfo } from "./8933-schedule-c/filingInfo.js";
import { resolve8933ScheduleCInfo } from "./8933-schedule-c/resolveInfo.js";
import type { Form8933ScheduleDFilingInfo } from "./8933-schedule-d/filingInfo.js";
import { resolve8933ScheduleDInfo } from "./8933-schedule-d/resolveInfo.js";
import type { Form8933ScheduleEFilingInfo } from "./8933-schedule-e/filingInfo.js";
import { resolve8933ScheduleEInfo } from "./8933-schedule-e/resolveInfo.js";
import type { Form8933ScheduleFFilingInfo } from "./8933-schedule-f/filingInfo.js";
import { resolve8933ScheduleFInfo } from "./8933-schedule-f/resolveInfo.js";
import type { Form8933FilingInfo } from "./8933/filingInfo.js";
import { resolve8933Info } from "./8933/resolveInfo.js";
import type { Form8936ScheduleAFilingInfo } from "./8936-schedule-a/filingInfo.js";
import { resolve8936ScheduleAInfo } from "./8936-schedule-a/resolveInfo.js";
import type { Form8941FilingInfo } from "./8941/filingInfo.js";
import { resolve8941Info } from "./8941/resolveInfo.js";
import type { Form8992FilingInfo } from "./8992/filingInfo.js";
import { resolve8992Info } from "./8992/resolveInfo.js";
import type { Form8994FilingInfo } from "./8994/filingInfo.js";
import { resolve8994Info } from "./8994/resolveInfo.js";
export type FederalFormsWithNoRulesFilingInfo = Form5471FilingInfo &
  Form8933FilingInfo &
  Form8992FilingInfo &
  Form7207FilingInfo &
  Form7211FilingInfo &
  Form7213FilingInfo &
  Form7218FilingInfo &
  Form8835FilingInfo &
  Form8874FilingInfo &
  Form8896FilingInfo &
  Form8900FilingInfo &
  Form8906FilingInfo &
  Form8908FilingInfo &
  Form8932FilingInfo &
  Form8941FilingInfo &
  Form8994FilingInfo &
  Form8911ScheduleAFilingInfo &
  Form8936ScheduleAFilingInfo &
  Form8933ScheduleAFilingInfo &
  Form8933ScheduleBFilingInfo &
  Form8933ScheduleCFilingInfo &
  Form8933ScheduleDFilingInfo &
  Form8933ScheduleEFilingInfo &
  Form8933ScheduleFFilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve5471Info,
  resolve8933Info,
  resolve8992Info,
  resolve7207Info,
  resolve7211Info,
  resolve7213Info,
  resolve7218Info,
  resolve8835Info,
  resolve8874Info,
  resolve8896Info,
  resolve8900Info,
  resolve8906Info,
  resolve8908Info,
  resolve8932Info,
  resolve8941Info,
  resolve8994Info,
  resolve8911ScheduleAInfo,
  resolve8936ScheduleAInfo,
  resolve8933ScheduleAInfo,
  resolve8933ScheduleBInfo,
  resolve8933ScheduleCInfo,
  resolve8933ScheduleDInfo,
  resolve8933ScheduleEInfo,
  resolve8933ScheduleFInfo,
];
