import { getSection1256Facts } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6781FilingInfo } from "./filingInfo.js";
import { line1Row } from "./lines.js";

/*
 * Who files: a gain or loss on a section 1256 contract
 * (irs-6781-form-2025::sec::general-instructions::b01). A 1099-B with boxes 8–11
 * or a contract with no 1099-B files the form; the explicit decision still wins.
 * Straddles (Part II) have no facts, so only the decision files the form for one.
 */
export function resolve6781Info(inputs: ResolverInputs): Form6781FilingInfo {
  const facts = getSection1256Facts(inputs.facts);
  return {
    mustFile: {
      "form-6781": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6781",
        fallbacks: [
          {
            rule: `fallback: ${facts.length} section 1256 fact(s) present`,
            value: facts.length > 0,
            triggeredByFactKeys: facts.map((fact) => fact.key),
          },
        ],
      }),
    },
    section1256Rows: facts.map(line1Row),
  };
}
