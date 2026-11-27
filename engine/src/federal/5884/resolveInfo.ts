import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { employeesOnReturn } from "./employees.js";
import type { Form5884FilingInfo, Form5884Lines } from "./filingInfo.js";
import { lines1To2 } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_5884";
const FORM_5884 = "5884";
const PART_III_LINE = "4b";
/* The K-1 detail of a partnership's box 15 code J and an S corporation's box 13 code J (passThrough box tables). */
const K1_DETAIL = "work_opportunity";

export const UNPLACED_GAP =
  "A targeted group employee works for an activity that is not a Schedule C business or Schedule F farm of this return, and the wage deduction that the credit reduces (irs-5884-inst-2025::sec::line-2::b01) is on a schedule the engine does not reduce.";
const K1_AMOUNT_GAP =
  "A Schedule K-1 work opportunity credit (code J) has no amount, so line 3 is not known.";

/*
 * Line 3: "Enter total work opportunity credits from: Schedule K-1 (Form 1065)
 * ... box 15 (code J); Schedule K-1 (Form 1120-S) ... box 13 (code J); Schedule
 * K-1 (Form 1041) ... ; or Form 1099-PATR ... or other notice of credit
 * allocation" (irs-5884-inst-2025::sec::line-3::b01). The partnership and S
 * corporation boxes come from the K-1 facts; any other notice is a stated
 * Form 3800 line 4b credit that names its pass-through entity (passThroughEin).
 * Blank with none.
 */
export function passThroughCredits(inputs: ResolverInputs): number | Unsupported | undefined {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_DETAIL,
  );
  if (k1.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      value.line === PART_III_LINE &&
      value.sourceForm === FORM_5884 &&
      value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}

/* Lines 1a to 3 from the facts. */
export function form5884LinesOf(inputs: ResolverInputs): Form5884Lines {
  const { employees, unplacedKeys, malformedKeys } = employeesOnReturn(inputs);
  const line3 = passThroughCredits(inputs);
  if (unplacedKeys.length > 0) return { lines: unsupported(UNPLACED_GAP), line3 };
  if (malformedKeys.length > 0) return { lines: undefined, line3 };
  return { lines: lines1To2(employees.map((employee) => employee.value)), line3 };
}

/*
 * Who files: "Use Form 5884 to claim the work opportunity credit for qualified
 * first- and/or second-year wages you paid to or incurred for targeted group
 * employees during the tax year" (irs-5884-inst-2025::sec::general-instructions::b01).
 * A targeted group employee fact files it. A taxpayer whose "only source for
 * this credit is a partnership, S corporation, cooperative, estate, or trust"
 * does not file it and reports the credit "directly on Form 3800" (same block),
 * so a K-1 alone does not. The form leaves the return when line 2 is 0
 * (filesOnlyWithAmountOn, bindings.ts). The explicit decision still wins.
 */
export function resolve5884Info(inputs: ResolverInputs): Form5884FilingInfo {
  const { employees, unplacedKeys, malformedKeys } = employeesOnReturn(inputs);
  // A malformed employee fact files the form too, so its key is asked again.
  const keys = [...employees.map((employee) => employee.key), ...unplacedKeys, ...malformedKeys];
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} targeted group employee fact(s) of the taxpayer's own business or farm`,
        value: keys.length > 0,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const files = mustFile.value === true;
  return {
    mustFile: { "form-5884": mustFile },
    missingInputs: { "form-5884": files ? malformedKeys : [] },
    workOpportunity: files ? form5884LinesOf(inputs) : undefined,
  };
}
