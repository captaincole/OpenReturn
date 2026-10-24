/*
 * What the return still needs: every decision and fact key a filed form
 * is waiting for. Cade asks the user about these, and the agent renders
 * no documents until both lists are empty.
 */

import type { FilingInfo } from "./filingInfo.js";
import type { BaseFormField, EvaluatedForm } from "./types.js";

export interface PendingInputs {
  /** decisions.* keys, sorted. */
  pendingDecisions: string[];
  /** Fact keys, sorted. */
  pendingFacts: string[];
}

export function pendingInputs(scenario: {
  forms: ReadonlyMap<string, EvaluatedForm<BaseFormField>>;
  filingInfo: FilingInfo;
}): PendingInputs {
  const { pendingDecisions, pendingFacts } = collectPending(scenario.forms.values());
  addPendingIdentityFacts(scenario.filingInfo, pendingFacts);
  return {
    pendingDecisions: Array.from(pendingDecisions).sort(),
    pendingFacts: Array.from(pendingFacts).sort(),
  };
}

/*
 * Aggregate unique pending decisions and facts across every form:
 * must-file blockers, and for each filed form its missing required inputs
 * plus field blockers that name a key.
 */
function collectPending(forms: Iterable<EvaluatedForm<BaseFormField>>): {
  pendingDecisions: Set<string>;
  pendingFacts: Set<string>;
} {
  const pendingDecisions = new Set<string>();
  const pendingFacts = new Set<string>();
  const add = (key: string) =>
    (key.startsWith("decisions.") ? pendingDecisions : pendingFacts).add(key);
  for (const form of forms) {
    if (!form.mustFile.ok) {
      if (form.mustFile.missingDecisionKey) add(form.mustFile.missingDecisionKey);
      continue;
    }
    if (!form.mustFile.value) continue;
    form.missingInputs.forEach(add);
    for (const field of form.fields) {
      if (field.result.ok || field.result.unsupported) continue;
      if (field.result.missingDecisionKey) add(field.result.missingDecisionKey);
      field.result.missingFactKeys?.forEach(add);
    }
  }
  return { pendingDecisions, pendingFacts };
}

/*
 * Identity gaps surface as pendingFacts. We check the RESOLVED filingInfo
 * slot, not raw fact presence. A fact with the right key but the wrong
 * value shape (e.g. identity.phone written as an object) would pass a
 * raw-presence gate even though the resolver cannot read it. With
 * filingInfo, pendingFacts reflects exactly what the engine consumes.
 * identity.email is intentionally NOT in this list — it is a courtesy
 * field that Cade auto-fills from authEmail at doc-generation time.
 */
function addPendingIdentityFacts(filingInfo: FilingInfo, pendingFacts: Set<string>): void {
  const requiredSlots: Array<[string, unknown]> = [
    ["identity.name.first", filingInfo.taxpayerFirstName],
    ["identity.name.last", filingInfo.taxpayerLastName],
    ["identity.ssn", filingInfo.taxpayerSSN],
    ["identity.dob", filingInfo.taxpayerDateOfBirth],
    ["identity.address.street", filingInfo.homeAddressLine1],
    ["identity.address.city", filingInfo.homeAddressCity],
    ["identity.address.state", filingInfo.homeAddressState],
    ["identity.address.zip", filingInfo.homeAddressZip],
    ["identity.occupation", filingInfo.taxpayerOccupation],
    ["identity.phone", filingInfo.taxpayerPhone],
  ];
  for (const [key, value] of requiredSlots) {
    if (!value) pendingFacts.add(key);
  }
}
