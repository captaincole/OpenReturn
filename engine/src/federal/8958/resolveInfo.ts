import {
  COMMUNITY_PROPERTY_KEYS,
  getCommunityPropertyItemFacts,
  SPOUSE_KEYS,
} from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { FilingStatus } from "../../values.js";
import type { Form8958FilingInfo } from "./filingInfo.js";
import { form8958Table, itemsThatWait, type ContextState } from "./form.js";
import {
  COMMUNITY_PROPERTY_STATES,
  RDP_COMMUNITY_PROPERTY_STATES,
  type Relationship,
} from "./lines.js";

const FILING_STATUS_KEY = "decisions.scope.filing_status";

/*
 * The form is for people who "Are subject to community property laws, and File
 * separate federal income tax returns" (irs-8958-form-2025::sec::purpose-of-form::b01).
 * A married person files separately as married filing separately; RDPs "aren't
 * married for federal tax purposes" and file as single or head of household
 * (irs-pub-555-2025::sec::publication-555::b05).
 */
function relationshipOf(status: FilingStatus | undefined): Relationship | undefined {
  if (status === "married_filing_separately") return "spouse";
  if (status === "single" || status === "head_of_household") return "registered_domestic_partner";
  return undefined;
}

const statesFor = (relationship: Relationship) =>
  relationship === "spouse" ? COMMUNITY_PROPERTY_STATES : RDP_COMMUNITY_PROPERTY_STATES;

const NOT_SEPARATE =
  "Form 8958 is for separate returns (irs-8958-form-2025::sec::purpose-of-form::b01); on a joint return nothing is allocated.";

function contextOf(
  inputs: ResolverInputs,
  status: FilingStatus | undefined,
  domicileState: string | undefined,
): ContextState {
  if (status === undefined) return { waits: true };
  const relationship = relationshipOf(status);
  if (relationship === undefined) return { gap: NOT_SEPARATE };
  if (domicileState === undefined) return { waits: true };
  if (!statesFor(relationship).has(domicileState)) {
    return {
      gap: `The domicile ${domicileState} has no community property law for this filer (irs-pub-555-2025::sec::publication-555::b05).`,
    };
  }
  const livingApart =
    inputs.factByKey.get(COMMUNITY_PROPERTY_KEYS.spousesLivingApartRules) === true;
  return {
    relationship,
    domicileState,
    livingApartRules: relationship === "spouse" && livingApart,
  };
}

/*
 * Who files: a separate return with community property items, domiciled in a
 * community property state (spouses: the nine states; RDPs: Nevada, Washington
 * and California). The form files while the domicile is not stated yet, and
 * asks for it. The explicit decision still wins.
 */
export function resolve8958Info(inputs: ResolverInputs): Form8958FilingInfo {
  const items = getCommunityPropertyItemFacts(inputs.facts);
  const status = filingStatusOf(inputs);
  const relationship = relationshipOf(status);
  const domicileState = text(inputs, COMMUNITY_PROPERTY_KEYS.domicileState)?.trim().toUpperCase();
  const subject =
    relationship !== undefined &&
    (domicileState === undefined || statesFor(relationship).has(domicileState));
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8958",
    fallbacks: [
      {
        rule: `fallback: ${items.length} community property item(s) on a separate return in a community property state`,
        value: items.length > 0 && subject,
        triggeredByFactKeys: items.map((item) => item.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8958": mustFile } };
  if (mustFile.value !== true) return filed;
  const context = contextOf(inputs, status, domicileState);
  const answers = {
    [FILING_STATUS_KEY]: status,
    [COMMUNITY_PROPERTY_KEYS.domicileState]: domicileState,
    [SPOUSE_KEYS.firstName]: text(inputs, SPOUSE_KEYS.firstName),
    [SPOUSE_KEYS.lastName]: text(inputs, SPOUSE_KEYS.lastName),
    [SPOUSE_KEYS.ssn]: text(inputs, SPOUSE_KEYS.ssn),
  };
  return {
    ...filed,
    form8958: form8958Table(items, context),
    missingInputs: {
      "form-8958": [...missingInputs(answers), ...itemsThatWait(items, context)],
    },
  };
}
