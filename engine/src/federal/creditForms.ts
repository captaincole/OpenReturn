/*
 * The business credit forms: Form 3800; Form 8582-CR, which limits a credit
 * from a passive activity before Form 3800 takes it; Form 8834, whose passive
 * credit Form 8582-CR limits too; Form 4136, the refundable credit for federal
 * tax paid on fuels used in a business; Form 8912, the credit for holders
 * of tax credit bonds; Form 8846, the credit for employer social security
 * and Medicare taxes on tips; Form 5884, the work opportunity credit for the
 * taxpayer's own employees; Form 8844, the empowerment zone employment
 * credit, which adds a source to Form 3800 Part III line 3; Form 8609-A, the
 * low-income housing credit of each building an owner holds directly; Form
 * 8586, which totals the Forms 8609-A and the K-1 low-income housing credits
 * for Form 3800; Form 8826, the disabled access credit; Form 8881, the
 * credits for the retirement plan of the taxpayer's own business or farm;
 * Form 8882, the credit for employer-provided childcare facilities and
 * services; Form 6765, the credit for increasing research activities; Form
 * 6478, the biofuel producer credit a pass-through entity allocates from a tax
 * year that began in 2024; and Form 7210, the clean hydrogen production credit
 * of each facility the taxpayer owns. They are joined here, in this order, and
 * filingInfo.ts takes them as one, so that file stays under its line limit. A
 * new credit form adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form3800FilingInfo } from "./3800/filingInfo.js";
import { resolve3800Info } from "./3800/resolveInfo.js";
import type { Form4136FilingInfo } from "./4136/filingInfo.js";
import { resolve4136Info } from "./4136/resolveInfo.js";
import type { Form5884FilingInfo } from "./5884/filingInfo.js";
import { resolve5884Info } from "./5884/resolveInfo.js";
import type { Form6478FilingInfo } from "./6478/filingInfo.js";
import { resolve6478Info } from "./6478/resolveInfo.js";
import type { Form6765FilingInfo } from "./6765/filingInfo.js";
import { resolve6765Info } from "./6765/resolveInfo.js";
import type { Form7210FilingInfo } from "./7210/filingInfo.js";
import { resolve7210Info } from "./7210/resolveInfo.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";
import type { Form8586FilingInfo } from "./8586/filingInfo.js";
import { resolve8586Info } from "./8586/resolveInfo.js";
import type { Form8609AFilingInfo } from "./8609-a/filingInfo.js";
import { resolve8609AInfo } from "./8609-a/resolveInfo.js";
import type { Form8826FilingInfo } from "./8826/filingInfo.js";
import { resolve8826Info } from "./8826/resolveInfo.js";
import type { Form8834FilingInfo } from "./8834/filingInfo.js";
import { resolve8834Info } from "./8834/resolveInfo.js";
import type { Form8844FilingInfo } from "./8844/filingInfo.js";
import { resolve8844Info } from "./8844/resolveInfo.js";
import type { Form8846FilingInfo } from "./8846/filingInfo.js";
import { resolve8846Info } from "./8846/resolveInfo.js";
import type { Form8881FilingInfo } from "./8881/filingInfo.js";
import { resolve8881Info } from "./8881/resolveInfo.js";
import type { Form8882FilingInfo } from "./8882/filingInfo.js";
import { resolve8882Info } from "./8882/resolveInfo.js";
import type { Form8912FilingInfo } from "./8912/filingInfo.js";
import { resolve8912Info } from "./8912/resolveInfo.js";

export type CreditFormsFilingInfo = Form3800FilingInfo &
  Form8582CRFilingInfo &
  Form8834FilingInfo &
  Form4136FilingInfo &
  Form8912FilingInfo &
  Form8846FilingInfo &
  Form5884FilingInfo &
  Form8844FilingInfo &
  Form8609AFilingInfo &
  Form8586FilingInfo &
  Form8826FilingInfo &
  Form8881FilingInfo &
  Form8882FilingInfo &
  Form6765FilingInfo &
  Form6478FilingInfo &
  Form7210FilingInfo;

export const CREDIT_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve3800Info,
  resolve8582CRInfo,
  resolve8834Info,
  resolve4136Info,
  resolve8912Info,
  resolve8846Info,
  resolve5884Info,
  resolve8844Info,
  resolve8609AInfo,
  resolve8586Info,
  resolve8826Info,
  resolve8881Info,
  resolve8882Info,
  resolve6765Info,
  resolve6478Info,
  resolve7210Info,
];
