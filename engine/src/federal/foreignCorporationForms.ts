/*
 * The forms for income from foreign corporations that have rules: Form 965-A,
 * the yearly report of the section 965 transition tax and its installments.
 * They are joined here, and laterForms.ts takes them as one, so filingInfo.ts
 * stays under its line limit. A new form of this group adds its type and
 * resolver here.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form965AFilingInfo } from "./965-a/filingInfo.js";
import { resolve965AInfo } from "./965-a/resolveInfo.js";

export type ForeignCorporationFormsFilingInfo = Form965AFilingInfo;

export const FOREIGN_CORPORATION_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [resolve965AInfo];
