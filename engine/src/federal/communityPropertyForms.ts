/*
 * The community property forms: Form 8958 (how a separate return divides
 * community and separate items). They are joined here, and filingInfo.ts takes
 * them as one. A new community property form adds its type and resolver here,
 * not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8958FilingInfo } from "./8958/filingInfo.js";
import { resolve8958Info } from "./8958/resolveInfo.js";

export type CommunityPropertyFormsFilingInfo = Form8958FilingInfo;

export const COMMUNITY_PROPERTY_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve8958Info];
