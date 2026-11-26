/*
 * The forms that pay back a credit or a subsidy of an earlier year: Form 8828
 * (a federal mortgage subsidy), Form 8611 (the low-income housing credit) and
 * Form 4255 (an investment credit and other business credits). They are joined
 * here, in this order, and filingInfo.ts takes them as one. A new recapture
 * form adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form4255FilingInfo } from "./4255/filingInfo.js";
import { resolve4255Info } from "./4255/resolveInfo.js";
import type { Form8611FilingInfo } from "./8611/filingInfo.js";
import { resolve8611Info } from "./8611/resolveInfo.js";
import type { Form8828FilingInfo } from "./8828/filingInfo.js";
import { resolve8828Info } from "./8828/resolveInfo.js";

export type RecaptureFormsFilingInfo = Form8828FilingInfo & Form8611FilingInfo & Form4255FilingInfo;

export const RECAPTURE_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> =
  [resolve8828Info, resolve8611Info, resolve4255Info];
