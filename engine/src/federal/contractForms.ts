/*
 * The forms for long-term contracts: Form 8697, the look-back interest on
 * contracts completed or adjusted in the year. federal/laterForms.ts joins this
 * group with the others. A new long-term contract form adds its type and
 * resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8697FilingInfo } from "./8697/filingInfo.js";
import { resolve8697Info } from "./8697/resolveInfo.js";

export type ContractFormsFilingInfo = Form8697FilingInfo;

export const CONTRACT_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve8697Info,
];
