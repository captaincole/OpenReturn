import { getLookBackFact, LOOK_BACK_FACT_KEY } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8697FilingInfo } from "./filingInfo.js";
import { planForm8697 } from "./plan.js";

/*
 * Who files: "You must file Form 8697 for each tax year in which you completed
 * a long-term contract" accounted for under the percentage of completion
 * method, and for a later year in which the contract price or costs are
 * adjusted (irs-8697-inst-2025::sec::who-must-file::b01); an owner of a
 * pass-through entity files for the year that holds the end of the entity's
 * year of completion (::pass-through-entities::b02). The look-back fact says
 * the method applies in 2025; the explicit decision still wins. A decision to
 * file with no fact waits for the fact, so Cade asks for it.
 */
export function resolve8697Info(inputs: ResolverInputs): Form8697FilingInfo {
  const fact = getLookBackFact(inputs.facts);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8697",
    fallbacks: [
      {
        rule: "fallback: a look-back fact for contracts completed or adjusted in 2025",
        value: fact !== undefined,
        triggeredByFactKeys: fact === undefined ? [] : [fact.key],
      },
    ],
  });
  const filed = { mustFile: { "form-8697": mustFile } };
  if (mustFile.value !== true) return filed;
  if (fact === undefined) return { ...filed, missingInputs: { "form-8697": [LOOK_BACK_FACT_KEY] } };
  return { ...filed, form8697: planForm8697(fact.value) };
}
