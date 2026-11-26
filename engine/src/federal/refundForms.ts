/*
 * The forms about who gets the refund of a return: Form 8888 (the refund split
 * into accounts) and Form 8379 (the injured spouse's share of a joint refund).
 * They are joined here, in this order, and filingInfo.ts takes them as one. A
 * new refund form adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form8379FilingInfo } from "./8379/filingInfo.js";
import { resolve8379Info } from "./8379/resolveInfo.js";
import type { Form8888FilingInfo } from "./8888/filingInfo.js";
import { resolve8888Info } from "./8888/resolveInfo.js";

export type RefundFormsFilingInfo = Form8888FilingInfo & Form8379FilingInfo;

export const REFUND_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve8888Info,
  resolve8379Info,
];
