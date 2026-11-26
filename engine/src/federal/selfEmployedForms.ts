/*
 * The forms of a self-employed person's own tax and deductions: Schedule SE
 * (self-employment tax) and Form 7206 (the self-employed health insurance
 * deduction). They are joined here, and filingInfo.ts takes them as one. A new
 * form of this kind adds its type and resolver here, not to filingInfo.ts.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form7206FilingInfo } from "./7206/filingInfo.js";
import { resolve7206Info } from "./7206/resolveInfo.js";
import type { ScheduleSEFilingInfo } from "./schedule-se/filingInfo.js";
import { resolveScheduleSEInfo } from "./schedule-se/resolveInfo.js";

export type SelfEmployedFilingInfo = ScheduleSEFilingInfo & Form7206FilingInfo;

export const SELF_EMPLOYED_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolveScheduleSEInfo,
  resolve7206Info,
];
