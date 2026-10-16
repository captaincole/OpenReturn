/*
 * Form 8995-A slot resolver (composed by resolveFilingInfo).
 */

import { isDividendFactKey } from "../../facts/index.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8995AFilingInfo } from "./filingInfo.js";

/*
 * Default: required when 1099-DIV box 5 (section 199A dividends) is
 * positive. An explicit `decisions.scope.must_file_8995_a` wins.
 */
export function resolve8995AInfo(inputs: ResolverInputs): Form8995AFilingInfo {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  const reit = divs.reduce((t, row) => {
    const v = (row.value as { box5?: unknown }).box5;
    return t + (typeof v === "number" ? v : 0);
  }, 0);
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8995_a",
    fallbacks: [{ rule: `fallback: section 199A dividends $${reit} > 0`, value: reit > 0 }],
  });
  return {
    mustFile8995A: r.value as Form8995AFilingInfo["mustFile8995A"],
    mustFile8995ADerivation: r.derivation,
    qualifiedReitDividends: divs.length > 0 ? reit : undefined,
  };
}
