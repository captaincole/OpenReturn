/*
 * The forms of a sale of business property: Form 6252 (an installment sale),
 * Form 8824 (a like-kind exchange) and Form 4797, which takes amounts from
 * both. They are joined here, in this order, and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form4797FilingInfo } from "./4797/filingInfo.js";
import { resolve4797Info } from "./4797/resolveInfo.js";
import type { Form6252FilingInfo } from "./6252/filingInfo.js";
import { resolve6252Info } from "./6252/resolveInfo.js";
import type { Form8824FilingInfo } from "./8824/filingInfo.js";
import { resolve8824Info } from "./8824/resolveInfo.js";

export type SaleFormsFilingInfo = Form6252FilingInfo & Form8824FilingInfo & Form4797FilingInfo;

export const SALE_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve6252Info,
  resolve8824Info,
  resolve4797Info,
];
