/*
 * The California forms that resolve after the federal forms, in this order.
 * filingInfo.ts takes them as one. A new California form whose resolver has no
 * place among the earlier forms adds its filing info type and its resolver here.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form3461FilingInfo } from "./3461/filingInfo.js";
import { resolve3461Info } from "./3461/resolveInfo.js";
import type { Form3510FilingInfo } from "./3510/filingInfo.js";
import { resolve3510Info } from "./3510/resolveInfo.js";
import type { Form3800CaFilingInfo } from "./3800-ca/filingInfo.js";
import { resolve3800CaInfo } from "./3800-ca/resolveInfo.js";
import type { Form3801FilingInfo } from "./3801/filingInfo.js";
import { resolve3801Info } from "./3801/resolveInfo.js";
import type { Form3803FilingInfo } from "./3803/filingInfo.js";
import { resolve3803Info } from "./3803/resolveInfo.js";
import type { Form3804CRFilingInfo } from "./3804-cr/filingInfo.js";
import { resolve3804CRInfo } from "./3804-cr/resolveInfo.js";
import type { Form3840FilingInfo } from "./3840/filingInfo.js";
import { resolve3840Info } from "./3840/resolveInfo.js";
import type { Form3853FilingInfo } from "./3853/filingInfo.js";
import { resolve3853Info } from "./3853/resolveInfo.js";
import type { Form3913FilingInfo } from "./3913/filingInfo.js";
import { resolve3913Info } from "./3913/resolveInfo.js";
import type { Form540NRFilingInfo } from "./540nr/filingInfo.js";
import { resolve540NRInfo } from "./540nr/resolveInfo.js";
import type { ScheduleCa540NRFilingInfo } from "./schedule-ca-540nr/filingInfo.js";
import { resolveScheduleCa540NRInfo } from "./schedule-ca-540nr/resolveInfo.js";
import type { ScheduleD1FilingInfo } from "./schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "./schedule-d-1/resolveInfo.js";
import type { ScheduleG1FilingInfo } from "./schedule-g-1/filingInfo.js";
import { resolveScheduleG1Info } from "./schedule-g-1/resolveInfo.js";
import type { ScheduleSFilingInfo } from "./schedule-s/filingInfo.js";
import { resolveScheduleSInfo } from "./schedule-s/resolveInfo.js";

export type LaterCaliforniaFormsFilingInfo = Form540NRFilingInfo &
  ScheduleCa540NRFilingInfo &
  ScheduleSFilingInfo &
  Form3801FilingInfo &
  Form3510FilingInfo &
  Form3803FilingInfo &
  Form3800CaFilingInfo &
  ScheduleG1FilingInfo &
  Form3913FilingInfo &
  Form3461FilingInfo &
  Form3853FilingInfo &
  Form3804CRFilingInfo &
  ScheduleD1FilingInfo &
  Form3840FilingInfo;

export const LATER_CALIFORNIA_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve540NRInfo,
  resolveScheduleCa540NRInfo,
  resolveScheduleSInfo,
  resolve3801Info,
  resolve3510Info,
  resolve3803Info,
  resolve3800CaInfo,
  resolveScheduleG1Info,
  resolve3913Info,
  resolve3461Info,
  resolve3853Info,
  resolve3804CRInfo,
  resolveScheduleD1Info,
  resolve3840Info,
];
