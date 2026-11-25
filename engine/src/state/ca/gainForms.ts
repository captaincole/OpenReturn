/*
 * California's capital gain forms for a resident: FTB 3805E sends its capital
 * asset gains to Schedule D (540) line 1 (3805e/totals.ts), so the two are
 * joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form3805EFilingInfo } from "./3805e/filingInfo.js";
import { resolve3805EInfo } from "./3805e/resolveInfo.js";
import type { ScheduleDCaFilingInfo } from "./schedule-d-ca/filingInfo.js";
import { resolveScheduleDCaInfo } from "./schedule-d-ca/resolveInfo.js";

export type CaGainFilingInfo = Form3805EFilingInfo & ScheduleDCaFilingInfo;

export const CA_GAIN_RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolve3805EInfo,
  resolveScheduleDCaInfo,
];
