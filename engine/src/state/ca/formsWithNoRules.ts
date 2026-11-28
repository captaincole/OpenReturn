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
import type { Form3547FilingInfo } from "./3547/filingInfo.js";
import { resolve3547Info } from "./3547/resolveInfo.js";
import type { Form3548FilingInfo } from "./3548/filingInfo.js";
import { resolve3548Info } from "./3548/resolveInfo.js";
import type { Form3554FilingInfo } from "./3554/filingInfo.js";
import { resolve3554Info } from "./3554/resolveInfo.js";
import type { Form3568FilingInfo } from "./3568/filingInfo.js";
import { resolve3568Info } from "./3568/resolveInfo.js";
import type { Form3592FilingInfo } from "./3592/filingInfo.js";
import { resolve3592Info } from "./3592/resolveInfo.js";
import type { Form3596FilingInfo } from "./3596/filingInfo.js";
import { resolve3596Info } from "./3596/resolveInfo.js";
import type { Form3808FilingInfo } from "./3808/filingInfo.js";
import { resolve3808Info } from "./3808/resolveInfo.js";
import type { Form3814FilingInfo } from "./3814/filingInfo.js";
import { resolve3814Info } from "./3814/resolveInfo.js";
import type { Form3820FilingInfo } from "./3820/filingInfo.js";
import { resolve3820Info } from "./3820/resolveInfo.js";
import type { Form3821FilingInfo } from "./3821/filingInfo.js";
import { resolve3821Info } from "./3821/resolveInfo.js";
import type { Form3831FilingInfo } from "./3831/filingInfo.js";
import { resolve3831Info } from "./3831/resolveInfo.js";
import type { Form3835FilingInfo } from "./3835/filingInfo.js";
import { resolve3835Info } from "./3835/resolveInfo.js";
import type { Form3870FilingInfo } from "./3870/filingInfo.js";
import { resolve3870Info } from "./3870/resolveInfo.js";
import type { Form3872FilingInfo } from "./3872/filingInfo.js";
import { resolve3872Info } from "./3872/resolveInfo.js";
import type { Form4197FilingInfo } from "./4197/filingInfo.js";
import { resolve4197Info } from "./4197/resolveInfo.js";
import type { Form540TwoEZFilingInfo } from "./540-2ez/filingInfo.js";
import { resolve540TwoEZInfo } from "./540-2ez/resolveInfo.js";
import type { ScheduleRCaFilingInfo } from "./schedule-r-ca/filingInfo.js";
import { resolveScheduleRCaInfo } from "./schedule-r-ca/resolveInfo.js";
import type { ScheduleXFilingInfo } from "./schedule-x/filingInfo.js";
import { resolveScheduleXInfo } from "./schedule-x/resolveInfo.js";

export type CaliforniaFormsWithNoRulesFilingInfo = ScheduleXFilingInfo &
  Form3503FilingInfo &
  Form3504FilingInfo &
  Form3521FilingInfo &
  Form3523FilingInfo &
  Form3531FilingInfo &
  Form3540FilingInfo &
  Form3547FilingInfo &
  Form3548FilingInfo &
  Form3554FilingInfo &
  Form3568FilingInfo &
  Form3592FilingInfo &
  Form3596FilingInfo &
  Form3808FilingInfo &
  Form3814FilingInfo &
  Form3820FilingInfo &
  Form3821FilingInfo &
  Form3831FilingInfo &
  Form3835FilingInfo &
  Form3870FilingInfo &
  Form3872FilingInfo &
  Form4197FilingInfo &
  Form540TwoEZFilingInfo &
  ScheduleRCaFilingInfo;

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
  resolve3547Info,
  resolve3548Info,
  resolve3554Info,
  resolve3568Info,
  resolve3592Info,
  resolve3596Info,
  resolve3808Info,
  resolve3814Info,
  resolve3820Info,
  resolve3821Info,
  resolve3831Info,
  resolve3835Info,
  resolve3870Info,
  resolve3872Info,
  resolve4197Info,
  resolve540TwoEZInfo,
  resolveScheduleRCaInfo,
];
