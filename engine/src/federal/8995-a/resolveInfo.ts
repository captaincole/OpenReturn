import { isDividendFactKey } from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8995AFilingInfo } from "./filingInfo.js";

export function resolve8995AInfo(inputs: ResolverInputs): Form8995AFilingInfo {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  const reit = sum(...divs.map((row) => (row.value as { box5?: unknown }).box5));
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8995_a",
    fallbacks: [{ rule: `fallback: section 199A dividends $${reit} > 0`, value: reit > 0 }],
  });
  return {
    mustFile: { "form-8995-a": r },
    qualifiedReitDividends: divs.length > 0 ? reit : undefined,
  };
}
