/*
 * The canceled debt forms: Form 982 (the exclusion of a discharged debt and
 * the tax attributes it reduces). They are joined here, and filingInfo.ts
 * takes their resolvers as one. A new debt form adds its type and resolver
 * here, not to filingInfo.ts. filingInfo.ts is at its line cap, so the
 * FilingInfo type takes these slots through the forms that read them
 * (Schedule1FilingInfo and ScheduleCaFilingInfo pick them); Form 982's own
 * bindings read Form982FilingInfo.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form982FilingInfo } from "./982/filingInfo.js";
import { resolve982Info } from "./982/resolveInfo.js";

export type DebtFormsFilingInfo = Form982FilingInfo;

export const DEBT_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve982Info,
];
