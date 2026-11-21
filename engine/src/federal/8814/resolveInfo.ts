import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form8814Children, MUST_FILE_8814_KEY } from "./children.js";
import type { Form8814FilingInfo } from "./filingInfo.js";
import { form8814TotalsOf } from "./totals.js";

/*
 * irs-8814-inst-2025::sec::general-instructions::b01: parents choose to report a
 * child's interest and dividends on their own return, and the tax may be less
 * if the child files (::parents-who-don-t-file-a-joint-return::b05). So no fact
 * turns the form on: only the decision. One copy per child with an investment
 * income fact (::b02); each copy waits for that child's answers.
 */
export function resolve8814Info(inputs: ResolverInputs): Form8814FilingInfo {
  const children = form8814Children(inputs);
  return {
    mustFile: {
      "form-8814": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_8814_KEY,
        fallbacks: [{ rule: "fallback: the election is the parents' choice", value: false }],
      }),
    },
    missingInputs: { "form-8814": [...new Set(children.flatMap((child) => child.missing))] },
    form8814Children: children.length > 0 ? children : undefined,
    form8814Totals: form8814TotalsOf(children),
  };
}
