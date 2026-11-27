/*
 * The forms of a taxpayer who claims a benefit of a U.S. treaty: Form 8833
 * (the disclosure of each treaty-based return position). federal/laterForms.ts
 * joins this group with the others. A new treaty form adds its type and
 * resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8833FilingInfo } from "./8833/filingInfo.js";
import { resolve8833Info } from "./8833/resolveInfo.js";

export type TreatyFormsFilingInfo = Form8833FilingInfo;

export const TREATY_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve8833Info,
];
