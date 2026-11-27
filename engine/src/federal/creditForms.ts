/*
 * The business credit forms: Form 3800; Form 8582-CR, which limits a credit
 * from a passive activity before Form 3800 takes it; Form 8834, whose passive
 * credit Form 8582-CR limits too; Form 4136, the refundable credit for federal
 * tax paid on fuels used in a business; and Form 8912, the credit for holders
 * of tax credit bonds; and Form 8609-A, the low-income housing credit of each
 * building an owner holds directly. They are joined here, in this order, and filingInfo.ts
 * takes them as one, so that file stays under its line limit. A new credit
 * form adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form3800FilingInfo } from "./3800/filingInfo.js";
import { resolve3800Info } from "./3800/resolveInfo.js";
import type { Form4136FilingInfo } from "./4136/filingInfo.js";
import { resolve4136Info } from "./4136/resolveInfo.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";
import type { Form8609AFilingInfo } from "./8609-a/filingInfo.js";
import { resolve8609AInfo } from "./8609-a/resolveInfo.js";
import type { Form8834FilingInfo } from "./8834/filingInfo.js";
import { resolve8834Info } from "./8834/resolveInfo.js";
import type { Form8912FilingInfo } from "./8912/filingInfo.js";
import { resolve8912Info } from "./8912/resolveInfo.js";

export type CreditFormsFilingInfo = Form3800FilingInfo &
  Form8582CRFilingInfo &
  Form8834FilingInfo &
  Form4136FilingInfo &
  Form8912FilingInfo &
  Form8609AFilingInfo;

export const CREDIT_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve3800Info,
  resolve8582CRInfo,
  resolve8834Info,
  resolve4136Info,
  resolve8912Info,
  resolve8609AInfo,
];
