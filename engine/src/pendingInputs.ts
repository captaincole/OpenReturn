import type { FilingInfo } from "./filingInfo.js";
import type { BaseFormField, EvaluatedForm } from "./types.js";

export interface PendingInputs {
  pendingDecisions: string[];
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
 * Check the resolved filingInfo slot, not raw fact presence: a fact with
 * the wrong value shape is still pending. identity.email is left out on
 * purpose: Cade fills it from authEmail.
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
