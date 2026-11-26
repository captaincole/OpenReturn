/*
 * The farm forms: Form 4835 (rent from farm land) and Schedule F (a farm
 * business). They are joined here, and filingInfo.ts takes them as one. A new
 * farm form adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form4835FilingInfo } from "./4835/filingInfo.js";
import { resolve4835Info } from "./4835/resolveInfo.js";

export type FarmFormsFilingInfo = Form4835FilingInfo;

export const FARM_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve4835Info,
];
