/*
 * The forms that decide which parent claims a child: Form 8332 (the custodial
 * parent's release, or its revocation). federal/laterForms.ts joins this group
 * with the others. A new form of this kind adds its type and resolver here,
 * not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8332FilingInfo } from "./8332/filingInfo.js";
import { resolve8332Info } from "./8332/resolveInfo.js";

export type ChildClaimFormsFilingInfo = Form8332FilingInfo;

export const CHILD_CLAIM_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve8332Info];
