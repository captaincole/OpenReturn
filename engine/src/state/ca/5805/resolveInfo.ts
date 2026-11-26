import { PRIOR_YEAR_KEYS } from "../../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { farmerTestWaitingKeys, resolve5805FMustFile } from "../5805f/mustFile.js";
import type { Form5805FilingInfo } from "./filingInfo.js";

const PRIOR_YEAR_CA_AGI = "prior_year.ca_agi";

/*
 * Without the prior-year CA tax the form is not filed and no question is raised.
 * A farmer or fisherman files FTB 5805F instead
 * (ca-5805-inst-2025::sec::g-farmers-and-fishermen::b01, ca-5805f-inst-2025::sec::b-qualifications::b01).
 */
export function resolve5805Info(inputs: ResolverInputs): Form5805FilingInfo {
  const { factByKey, decisionByKey } = inputs;
  const priorYearCaTax = numberFact(factByKey.get(PRIOR_YEAR_KEYS.caTax));
  const files5805F = resolve5805FMustFile(inputs).value === true;
  const resolution = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_5805",
    fallbacks: [
      {
        rule: "fallback: prior-year CA tax is known and FTB 5805F does not file",
        value: priorYearCaTax !== undefined && !files5805F,
      },
    ],
  });
  const caAgi = numberFact(factByKey.get(PRIOR_YEAR_CA_AGI));
  const fedAgi = numberFact(factByKey.get(PRIOR_YEAR_KEYS.federalAgi));
  const agi = caAgi ?? fedAgi;
  const mfs = decisionByKey.get("decisions.scope.filing_status") === "married_filing_separately";
  return {
    mustFile: { "form-5805": resolution },
    /* Federal AGI stands in for CA AGI. With farm income, the farmer test comes first. */
    missingInputs: {
      "form-5805": missingInputs({
        [PRIOR_YEAR_KEYS.federalAgi]: agi,
        ...(resolution.value === true
          ? Object.fromEntries(farmerTestWaitingKeys(inputs).map((key) => [key, undefined]))
          : {}),
      }),
    },
    priorYearCaTax,
    priorYearSafeHarborRate: agi === undefined ? undefined : agi > (mfs ? 75000 : 150000) ? 1.1 : 1,
    priorYearAgiSource:
      caAgi !== undefined ? "ca_agi" : fedAgi !== undefined ? "federal_agi (stand-in)" : undefined,
  };
}

function numberFact(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
