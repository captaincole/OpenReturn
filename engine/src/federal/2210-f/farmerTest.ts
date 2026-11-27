/*
 * Who is a farmer or fisher for the federal estimated tax penalty: "If you are
 * an individual ... and at least two-thirds of your 2024 or 2025 gross income
 * is from farming or fishing, use Form 2210-F" (irs-2210f-inst-2025::sec::general-instructions::b01).
 * Form 2210 says the same from its side: "If you don't meet test 1, use Form
 * 2210" (irs-2210-inst-2025::sec::exceptions-to-the-penalty::b02–b03). Both
 * forms read this one answer, so a return files one of them, never both.
 */

import {
  FARMER_OR_FISHERMAN_KEYS,
  getFarmerGrossIncomeFacts,
  passingFarmerYearKeys,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { resolve4835Info } from "../4835/resolveInfo.js";
import { resolveScheduleFInfo } from "../schedule-f/resolveInfo.js";

export const MUST_FILE_2210F_KEY = "decisions.scope.must_file_2210_f";

export interface FarmerTest {
  /* A year passes the two-thirds test, or Cade decided that Form 2210-F files. */
  isFarmer: boolean;
  passingKeys: string[];
  byDecision: boolean;
  /* With farm income on the return and no passing year: each year not yet stated. */
  waitingKeys: string[];
}

/* Schedule F or Form 4835 files: the return has gross income from farming. */
function farmIncomeOnReturn(inputs: ResolverInputs): boolean {
  return (
    resolveScheduleFInfo(inputs).mustFile?.["schedule-f"]?.value === true ||
    resolve4835Info(inputs).mustFile?.["form-4835"]?.value === true
  );
}

function waitingKeys(inputs: ResolverInputs): string[] {
  if (!farmIncomeOnReturn(inputs)) return [];
  const stated = new Set(getFarmerGrossIncomeFacts(inputs.facts).map(({ key }) => key));
  return Object.values(FARMER_OR_FISHERMAN_KEYS).filter((key) => !stated.has(key));
}

export function farmerTest(inputs: ResolverInputs): FarmerTest {
  const passingKeys = passingFarmerYearKeys(inputs.facts);
  const byDecision = inputs.decisionByKey.get(MUST_FILE_2210F_KEY) === true;
  const isFarmer = passingKeys.length > 0 || byDecision;
  return { isFarmer, passingKeys, byDecision, waitingKeys: isFarmer ? [] : waitingKeys(inputs) };
}
