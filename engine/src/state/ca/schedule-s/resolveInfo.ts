import { getOtherStateTaxFacts, type OtherStateTaxFact } from "../../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { OtherStateCreditInput, ScheduleSFilingInfo } from "./filingInfo.js";
import { residentCreditAllowed } from "./lines.js";

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/* A Part I list with each row's description and two amounts, or undefined. */
function completeItems(fact: OtherStateTaxFact): OtherStateCreditInput["items"] {
  const items = fact.value.items;
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const complete = items.every(
    (item) =>
      typeof item.description === "string" &&
      finite(item.californiaAmount) !== undefined &&
      finite(item.otherStateAmount) !== undefined,
  );
  return complete ? items : undefined;
}

function creditInput(fact: OtherStateTaxFact): OtherStateCreditInput {
  return {
    factKey: fact.key,
    state: fact.value.state.toUpperCase(),
    items: completeItems(fact),
    taxPaid: finite(fact.value.taxPaid),
    otherStateAdjustedGrossIncome: finite(fact.value.otherStateAdjustedGrossIncome),
  };
}

const complete = (input: OtherStateCreditInput) =>
  input.items !== undefined &&
  input.taxPaid !== undefined &&
  input.otherStateAdjustedGrossIncome !== undefined;

/*
 * Who files (ca-540-sched-s-inst-2025::sec::a-purpose::b01, ::c-california-residents::b01–b02):
 * a California resident (Form 540 files) who paid net income tax to a state
 * California allows the credit for, on income California also taxes. One copy
 * for each such state with tax paid (a tax not stated yet counts, so it is
 * asked). A state outside the list, or a stated tax of 0, files no copy. The
 * explicit decision still wins.
 */
export function resolveScheduleSInfo(inputs: ResolverInputs): ScheduleSFilingInfo {
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const credits = getOtherStateTaxFacts(inputs.facts)
    .filter((fact) => typeof fact.value?.state === "string" && residentCreditAllowed(fact.value))
    .map(creditInput)
    .filter((input) => input.taxPaid === undefined || input.taxPaid > 0);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_s",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and ${credits.length} other state(s) California allows the credit for, with tax paid`,
        value: files540 && credits.length > 0,
        triggeredByFactKeys: credits.map((input) => input.factKey),
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  const filed = resolution.value === true;
  return {
    mustFile: { "schedule-s": resolution },
    missingInputs: {
      "schedule-s": filed
        ? credits.filter((input) => !complete(input)).map((input) => input.factKey)
        : [],
    },
    otherStateCredits: filed ? credits : [],
  };
}
