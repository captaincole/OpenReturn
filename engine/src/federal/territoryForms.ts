/*
 * The forms of a bona fide resident of a U.S. territory: Form 4563 (the
 * exclusion of income from American Samoa). federal/laterForms.ts joins this
 * group with the others. A new territory form adds its type and resolver
 * here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form4563FilingInfo } from "./4563/filingInfo.js";
import { resolve4563Info } from "./4563/resolveInfo.js";

export type TerritoryFormsFilingInfo = Form4563FilingInfo;

export const TERRITORY_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> =
  [resolve4563Info];
