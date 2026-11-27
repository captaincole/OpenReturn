/*
 * The investment credit forms: Form 3468, one copy for each facility or
 * property and one for the unused credits from cooperatives. Form 3800 reads
 * its credits from the facts (3468/credit.ts), not from these slots.
 * federal/laterForms.ts joins this group with the others. A new form of this
 * kind adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form3468FilingInfo } from "./3468/filingInfo.js";
import { resolve3468Info } from "./3468/resolveInfo.js";

export type InvestmentCreditFormsFilingInfo = Form3468FilingInfo;

export const INVESTMENT_CREDIT_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve3468Info];
