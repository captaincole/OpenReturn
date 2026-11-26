/*
 * The forms that limit a credit from a passive activity: Form 8582-CR. It is
 * here, and filingInfo.ts takes the group as one, so that file stays under its
 * line limit. A new form of this kind adds its type and resolver here, not to
 * filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";

export type PassiveCreditFormsFilingInfo = Form8582CRFilingInfo;

export const PASSIVE_CREDIT_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve8582CRInfo];
