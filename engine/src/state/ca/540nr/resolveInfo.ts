import { CA_RESIDENCY_DECISION_KEY, SPOUSE_KEYS, isW2FactKey } from "../../../facts/index.js";
import { sumOrBlank } from "../../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  missingInputs,
  text,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { californiaWithholdingOtherForms } from "../540/withholding.js";
import { formsNeededOnly540 } from "./californiaForms.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";
import { form540NRMustFile } from "./mustFile.js";

/*
 * A W-2 state box that names California ("CA", "CA 123-4567-8"), or no state
 * box: the same rule Form 540 line 71 applies to the other forms
 * (state/ca/540/withholding.ts). Another state's wages and tax are not
 * California's (ca-540nr-booklet-2025::sec::line-81-california-income-tax-withheld::b01:
 * "Do not include ... tax withheld by other states").
 */
const CALIFORNIA = "CA";
const californiaOrUnstated = (state: unknown) =>
  typeof state !== "string" ||
  state.trim() === "" ||
  state.trim().toUpperCase().startsWith(CALIFORNIA);

function californiaW2s(inputs: ResolverInputs): Array<Record<string, unknown>> {
  return factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as Record<string, unknown>)
    .filter((w2) => californiaOrUnstated(w2.box15));
}

/* The answers the form reads, as Form 540 asks them, and the residency itself. */
function requiredAnswers(inputs: ResolverInputs): Record<string, unknown> {
  const status = filingStatusOf(inputs);
  return {
    [CA_RESIDENCY_DECISION_KEY]: inputs.decisionByKey.get(CA_RESIDENCY_DECISION_KEY),
    // Line 9: 65 or older by December 31 adds the senior exemption.
    "identity.dob": text(inputs, "identity.dob"),
    ...(status === "married_filing_jointly"
      ? { [SPOUSE_KEYS.dob]: text(inputs, SPOUSE_KEYS.dob) }
      : {}),
    ...(status === "qualifying_surviving_spouse"
      ? { [SPOUSE_KEYS.yearOfDeath]: text(inputs, SPOUSE_KEYS.yearOfDeath) }
      : {}),
    // Line 91: the full-year coverage box.
    "health_coverage.full_year_mec": inputs.factByKey.get("health_coverage.full_year_mec"),
  };
}

/*
 * ca-540nr-booklet-2025::sec::which-form-to-use::b01: Form 540NR is the return
 * of a part-year resident or a nonresident (mustFile.ts). Lines 12 and 81 read
 * the California W-2s.
 */
export function resolve540NRInfo(inputs: ResolverInputs): Form540NRFilingInfo {
  const resolution = form540NRMustFile(inputs);
  const files = resolution.value === true;
  const w2s = californiaW2s(inputs);
  return {
    mustFile: { "form-540nr": resolution },
    missingInputs: { "form-540nr": files ? missingInputs(requiredAnswers(inputs)) : [] },
    formsNeededOnly540: files ? formsNeededOnly540(inputs) : undefined,
    w2CaliforniaWages: sumOrBlank(...w2s.map((w2) => w2.box16)),
    californiaTaxWithheld: sumOrBlank(
      ...w2s.map((w2) => w2.box17),
      californiaWithholdingOtherForms(inputs),
    ),
  };
}
