/*
 * Who files Form 540NR. Form 540's resolver reads it too: a return that files
 * Form 540NR does not file Form 540 (ca-540nr-booklet-2025::sec::which-form-to-use::b01:
 * "Use Form 540NR if either you or your spouse/RDP were a nonresident or
 * part-year resident in taxable year 2025"). This file imports no form, so
 * that resolver can read it.
 */

import {
  CA_RESIDENCY,
  CA_RESIDENCY_DECISION_KEY,
  readCaCaliforniaAmounts,
} from "../../../facts/index.js";
import type { MustFileResolution } from "../../../filingInfo.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";

export const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";
const FORM_540_KEY = "decisions.scope.must_file_ca_540";

/* A nonresident who states a California amount above 0 has California-source income. */
function statesCaliforniaIncome(inputs: ResolverInputs): boolean {
  return Object.values(readCaCaliforniaAmounts(inputs.facts)).some((amount) => amount > 0);
}

/*
 * The explicit decision decides. Without it, a part-year resident, or a
 * nonresident with California-source income, is asked: the filing requirement
 * compares gross income and AGI from all sources under California law with the
 * booklet's charts (ca-540nr-booklet-2025::sec::do-i-have-to-file::b01, Steps 1
 * to 4), amounts the resolver cannot see, so Cade decides it. Anyone else does
 * not file: the engine does not test residency, and a nonresident with no
 * California-source income has nothing for California to tax
 * (::how-nonresidents-and-part-year-residents-are-taxed::b01).
 */
export function form540NRMustFile(inputs: ResolverInputs): MustFileResolution {
  const explicit = inputs.decisionByKey.get(MUST_FILE_540NR_KEY);
  const residency = inputs.decisionByKey.get(CA_RESIDENCY_DECISION_KEY);
  const derivation = (rule: string) => ({
    decidedBy: "engine" as const,
    rule,
    triggeredByFactKeys: [],
    triggeredByDecisionKeys: [MUST_FILE_540NR_KEY, CA_RESIDENCY_DECISION_KEY],
  });
  if (typeof explicit === "boolean") {
    return {
      decisionKey: MUST_FILE_540NR_KEY,
      value: explicit,
      derivation: derivation(`explicit decision: ${MUST_FILE_540NR_KEY} = ${explicit}`),
    };
  }
  const asks =
    residency === CA_RESIDENCY.partYear ||
    (residency === CA_RESIDENCY.nonresident && statesCaliforniaIncome(inputs));
  if (asks) return { decisionKey: MUST_FILE_540NR_KEY, value: undefined, derivation: undefined };
  return {
    decisionKey: MUST_FILE_540NR_KEY,
    value: false,
    derivation: derivation(
      `no decision, and the residency (${String(residency ?? "not stated")}) is not a part-year resident's or a nonresident's with a California amount`,
    ),
  };
}

/* Form 540NR files on this return. */
export const files540NR = (inputs: ResolverInputs): boolean =>
  form540NRMustFile(inputs).value === true;

/*
 * Form 540's own must-file: its explicit decision, except on a return that
 * files Form 540NR, which does not file Form 540 (which-form-to-use::b01).
 * With no Form 540NR, every return resolves as it did before.
 */
export function form540MustFile(inputs: ResolverInputs): MustFileResolution {
  if (!files540NR(inputs)) {
    return resolveMustFile(inputs.decisionByKey, { explicitKey: FORM_540_KEY });
  }
  return {
    decisionKey: FORM_540_KEY,
    value: false,
    derivation: {
      decidedBy: "engine",
      rule: "Form 540NR files instead: a part-year resident or a nonresident files Form 540NR, not Form 540",
      triggeredByFactKeys: [],
      triggeredByDecisionKeys: [MUST_FILE_540NR_KEY, CA_RESIDENCY_DECISION_KEY],
    },
  };
}
