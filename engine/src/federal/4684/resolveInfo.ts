import { getCasualtyEventFacts, type CasualtyEventFact } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4684FilingInfo } from "./filingInfo.js";
import { hasGain } from "./lines.js";

/* An event with a gain on line 4 needs the reimbursement received in 2025 (line-4::b01). */
function missingReceived(events: readonly CasualtyEventFact[]): string[] {
  return events
    .filter(({ event }) =>
      event.properties.some(
        (property) => hasGain(property) && property.reimbursementReceived === undefined,
      ),
    )
    .map((event) => event.factKey);
}

/*
 * irs-4684-inst-2025::sec::general-instructions::b01: "Use Form 4684 to report
 * gains and losses from casualties and thefts." The form files when a casualty
 * event fact exists, one copy per event through line 12
 * (irs-4684-inst-2025::sec::section-a-personal-use-property::b01). Only
 * personal-use property (Section A) has a fact kind; Section B has none.
 */
export function resolve4684Info(inputs: ResolverInputs): Form4684FilingInfo {
  const casualtyEvents = getCasualtyEventFacts(inputs.facts);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4684",
    fallbacks: [
      {
        rule: `fallback: ${casualtyEvents.length} casualty or theft event(s)`,
        value: casualtyEvents.length > 0,
        triggeredByFactKeys: casualtyEvents.map((event) => event.factKey),
      },
    ],
  });
  return {
    mustFile: { "form-4684": resolution },
    missingInputs: { "form-4684": missingReceived(casualtyEvents) },
    casualtyEvents,
  };
}
