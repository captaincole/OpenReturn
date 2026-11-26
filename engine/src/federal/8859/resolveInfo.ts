import { DC_HOMEBUYER_CREDIT_KEYS } from "../../facts/index.js";
import { missingInputs, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8859FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer with an unused District of Columbia first-time
 * homebuyer credit carried from 2024. "You may claim only a carryforward of any
 * unused credit (which is shown on your prior year Form 8859, line 4)"
 * (irs-8859-form-2025::sec::omb-no-1545-0074::b01); the credit cannot be claimed
 * for a home bought after 2011 (irs-1040-inst-2025::sec::line-6h::b01). The
 * explicit decision still wins. A filing form asks for the carryforward (0 is an
 * answer): line 1 reads it.
 */
export function resolve8859Info(inputs: ResolverInputs): Form8859FilingInfo {
  const key = DC_HOMEBUYER_CREDIT_KEYS.carryforwardFrom2024;
  const carryforward = num(inputs, key);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8859",
    fallbacks: [
      {
        rule: "fallback: a District of Columbia first-time homebuyer credit carried from the 2024 Form 8859",
        value: (carryforward ?? 0) > 0,
        triggeredByFactKeys: (carryforward ?? 0) > 0 ? [key] : [],
      },
    ],
  });
  const asked = resolution.value === true ? missingInputs({ [key]: carryforward }) : [];
  return {
    mustFile: { "form-8859": resolution },
    missingInputs: { "form-8859": asked },
    dcHomebuyerCarryforward: carryforward,
  };
}
