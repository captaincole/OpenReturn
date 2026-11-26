/*
 * The loss forms: Form 172 (the net operating loss and its carryover). They
 * are joined here, and filingInfo.ts takes them as one. A new loss form adds
 * its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form172FilingInfo } from "./172/filingInfo.js";
import { resolve172Info } from "./172/resolveInfo.js";

export type LossFormsFilingInfo = Form172FilingInfo;

export const LOSS_FORMS_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve172Info,
];
