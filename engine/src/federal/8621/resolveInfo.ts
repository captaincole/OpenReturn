import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8621FilingInfo } from "./filingInfo.js";
import { form8621Totals } from "./totals.js";

/*
 * Who files: a shareholder of a PFIC, one form for each fund, in any of five
 * circumstances (irs-8621-inst-2025::sec::passive-foreign-investment-corporation-pfic::b01);
 * totals.ts decides each fund. The explicit decision still wins.
 */
export function resolve8621Info(inputs: ResolverInputs): Form8621FilingInfo {
  const totals = form8621Totals(inputs);
  const filed = totals?.filed ?? [];
  return {
    mustFile: {
      "form-8621": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8621",
        fallbacks: [
          {
            rule: `fallback: ${filed.length} PFIC fund(s) that must file`,
            value: filed.length > 0,
            triggeredByFactKeys: filed.map((fund) => fund.key),
          },
        ],
      }),
    },
    form8621Totals: totals,
  };
}
