/*
 * The credit forms for a home that filingInfo.ts does not hold: Form 8859 (the
 * District of Columbia first-time homebuyer credit carried from 2024). They are
 * joined here, and laterForms.ts takes them as one. A new home credit form adds
 * its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8859FilingInfo } from "./8859/filingInfo.js";
import { resolve8859Info } from "./8859/resolveInfo.js";

export type HomeCreditFormsFilingInfo = Form8859FilingInfo;

export const HOME_CREDIT_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve8859Info];
