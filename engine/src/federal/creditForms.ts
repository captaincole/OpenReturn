/*
 * The general business credit forms: Form 3800, and Form 8582-CR, which limits
 * a credit from a passive activity before Form 3800 takes it. They are joined
 * here, in this order, and filingInfo.ts takes them as one, so that file stays
 * under its line limit. A new business credit form adds its type and resolver
 * here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form3800FilingInfo } from "./3800/filingInfo.js";
import { resolve3800Info } from "./3800/resolveInfo.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";

export type CreditFormsFilingInfo = Form3800FilingInfo & Form8582CRFilingInfo;

export const CREDIT_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve3800Info,
  resolve8582CRInfo,
];
