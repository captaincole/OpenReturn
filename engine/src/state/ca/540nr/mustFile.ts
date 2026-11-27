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
  isW2FactKey,
  readCaCaliforniaAmounts,
  type W2FactValue,
} from "../../../facts/index.js";
import type { MustFileResolution } from "../../../filingInfo.js";
import { sum } from "../../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";

export const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";
const FORM_540_KEY = "decisions.scope.must_file_ca_540";

/* A W-2 whose state boxes name California with wages or withholding (boxes 15 to 17). */
function showsCaliforniaWages(w2: W2FactValue): boolean {
  return w2.box15?.trim().toUpperCase() === "CA" && (sum(w2.box16) > 0 || sum(w2.box17) > 0);
}

/*
 * A nonresident has California-source income in sight when a stated
 * California amount is above 0 or a W-2 shows California wages: "Nonresidents
 * of California who received California sourced income in 2025 ... file Form
 * 540NR" (ca-540nr-booklet-2025::sec::how-nonresidents-and-part-year-residents-are-taxed::b01).
 * The W-2 matters because column E is asked only once Form 540NR files.
 */
function hasCaliforniaIncome(inputs: ResolverInputs): boolean {
  const stated = Object.values(readCaCaliforniaAmounts(inputs.facts)).some((amount) => amount > 0);
  const w2s = inputs.facts
    .filter((fact) => isW2FactKey(fact.key))
    .map((fact) => fact.value as W2FactValue);
  return stated || w2s.some(showsCaliforniaWages);
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
    (residency === CA_RESIDENCY.nonresident && hasCaliforniaIncome(inputs));
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
