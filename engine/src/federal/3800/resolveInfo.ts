import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { refuelingBusinessCredit } from "../8911/resolveInfo.js";
import { cleanVehicleBusinessCredit } from "../8936/resolveInfo.js";
import type { Form3800FilingInfo } from "./filingInfo.js";

/*
 * irs-3800-inst-2025::sec::who-must-file::b01: a taxpayer who claims a general business credit, or carries one back or forward.
 * The form has no rules yet. MANUAL EDIT: a clean vehicle business credit (Form 8936 line 8 or 21,
 * or a K-1 credit) or a refueling property business credit (Form 8911 line 3, or K-1 code AO)
 * turns it on, so Schedule 3 line 6a shows the gap on that return; otherwise only the decision does.
 */
export function resolve3800Info(inputs: ResolverInputs): Form3800FilingInfo {
  return {
    mustFile: {
      "form-3800": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3800",
        fallbacks: [
          {
            rule: "fallback: Form 8936 has a clean vehicle business credit (Part III line 1y or 1aa)",
            value: cleanVehicleBusinessCredit(inputs),
          },
          {
            rule: "fallback: Form 8911 line 3 or a K-1 code AO has a refueling property business credit (Part III line 1s)",
            value: refuelingBusinessCredit(inputs),
          },
        ],
      }),
    },
  };
}
