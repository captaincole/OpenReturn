/*
 * The forms about who gets the refund of a return: Form 8379 (the injured
 * spouse's share of a joint refund). Form 8888 (the refund split into accounts)
 * is older and stays in filingInfo.ts. federal/laterForms.ts joins this group
 * with the others. A new refund form adds its type and resolver here, not to
 * filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8379FilingInfo } from "./8379/filingInfo.js";
import { resolve8379Info } from "./8379/resolveInfo.js";

export type RefundFormsFilingInfo = Form8379FilingInfo;

export const REFUND_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve8379Info,
];
