/*
 * The forms for a credit the IRS reduced or disallowed in an earlier year:
 * Form 8862, which claims the EIC, the child tax credits or the AOTC again.
 * They are joined here and in laterForms.ts, so filingInfo.ts stays under its
 * line limit. A new form of this kind adds its type and resolver here.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8862FilingInfo } from "./8862/filingInfo.js";
import { resolve8862Info } from "./8862/resolveInfo.js";

export type DisallowedCreditFormsFilingInfo = Pick<Form8862FilingInfo, "form8862">;

export const DISALLOWED_CREDIT_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve8862Info];
