/*
 * Form 7211's credit as Form 3800 sources: "All others, stop here and report
 * this amount on Form 3800, Part III, line 1gg" (irs-7211-face-2025::sec::face-part-ii-2::b02;
 * irs-3800-inst-2025::sec::part-vi::b01). Each facility's line 11 is one source.
 *
 * The separate form's line 10 adds the K-1 and Form 1099-PATR credits, which
 * already are Form 3800 sources of their own (3800/sources.ts), with the
 * entity's EIN in column (c) and their own passive answer, so this adds the
 * facilities only, as Form 8586 does with its line 4 (8586/form3800.ts).
 */

import {
  getCleanElectricityFacilityFacts,
  getGeneralBusinessCreditFacts,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { PASS_THROUGH_COPY, type Form7211Copy } from "./copies.js";
import { FORM_3800_LINE } from "./passThroughCredits.js";
import { filedForm7211Copies } from "./resolveInfo.js";

const STATED_TWICE_GAP =
  "A clean electricity production credit is stated as a Form 3800 line 1gg amount with no pass-through entity, and Form 7211 figures one from the facility facts: the engine cannot tell whether they are the same credit.";

function facilitySource(inputs: ResolverInputs, copy: Form7211Copy): CreditSource | undefined {
  const fact = getCleanElectricityFacilityFacts(inputs.facts).find((each) => each.key === copy.key);
  if (fact === undefined || copy.total === undefined) return undefined;
  const { passive, passiveActivity, transfer, electivePayment } = fact.value;
  const credit = {
    line: FORM_3800_LINE,
    key: copy.key,
    amount: copy.total,
    passive,
    activity: passive ? passiveActivity : undefined,
    transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
    electivePayment: electivePayment && {
      ...electivePayment,
      amount: roundDollars(electivePayment.amount),
    },
  };
  return { credit };
}

/* Form 7211's sources for Form 3800 line 1gg, and the facilities that wait on an answer. */
export function cleanElectricitySources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const facilities = filedForm7211Copies(inputs).filter((copy) => copy.key !== PASS_THROUGH_COPY);
  if (facilities.length === 0) return { sources: [], missing: [] };
  const missing = facilities.filter((copy) => copy.waiting).map((copy) => copy.key);
  const sources = facilities.flatMap((copy) => facilitySource(inputs, copy) ?? []);
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === FORM_3800_LINE && value.passThroughEin === undefined,
  );
  if (statedTwice && sources.length > 0) {
    const credit = { ...sources[0].credit, amount: unsupported(STATED_TWICE_GAP) };
    return { sources: [{ credit }, ...sources.slice(1)], missing };
  }
  return { sources, missing };
}
