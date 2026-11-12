import type { ResolverInputs } from "../../resolverInputs.js";
import { qbiMustFile } from "../qbi/whichForm.js";
import type { Form8995FilingInfo } from "./filingInfo.js";

/*
 * irs-8995-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995 figures
 * the QBI deduction at or below the threshold; qbi/whichForm.ts holds the rule both
 * QBI forms share. Form 8995 asks no answer of its own: below the threshold a
 * specified service business counts like any other.
 */
export function resolve8995Info(inputs: ResolverInputs): Form8995FilingInfo {
  return {
    mustFile: { "form-8995": qbiMustFile(inputs, "form-8995") },
    missingInputs: { "form-8995": [] },
  };
}
