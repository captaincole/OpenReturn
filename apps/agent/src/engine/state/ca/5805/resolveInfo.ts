/*
 * FTB 5805 slot resolver (composed by resolveFilingInfo).
 */

import { PRIOR_YEAR_KEYS } from "../../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form5805FilingInfo } from "./filingInfo.js";

const PRIOR_YEAR_CA_AGI = "prior_year.ca_agi";

/*
 * Default: file when the prior-year CA tax is known, so the penalty
 * check can run (a zero penalty leaves line 13 at 0). Without it, the
 * form is not filed and no question is raised. An explicit
 * `decisions.scope.must_file_5805` wins.
 */
export function resolve5805Info(inputs: ResolverInputs): Form5805FilingInfo {
  const { factByKey, decisionByKey } = inputs;
  const priorYearCaTax = numberFact(factByKey.get(PRIOR_YEAR_KEYS.caTax));
  const r = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_5805",
    fallbacks: [
      { rule: "fallback: prior-year CA tax is known", value: priorYearCaTax !== undefined },
    ],
  });
  const caAgi = numberFact(factByKey.get(PRIOR_YEAR_CA_AGI));
  const fedAgi = numberFact(factByKey.get(PRIOR_YEAR_KEYS.federalAgi));
  const agi = caAgi ?? fedAgi;
  const mfs = decisionByKey.get("decisions.scope.filing_status") === "married_filing_separately";
  return {
    mustFile5805: r.value as Form5805FilingInfo["mustFile5805"],
    mustFile5805Derivation: r.derivation,
    priorYearCaTax,
    priorYearSafeHarborRate: agi === undefined ? undefined : agi > (mfs ? 75000 : 150000) ? 1.1 : 1,
    priorYearAgiSource:
      caAgi !== undefined ? "ca_agi" : fedAgi !== undefined ? "federal_agi (stand-in)" : undefined,
  };
}

function numberFact(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
