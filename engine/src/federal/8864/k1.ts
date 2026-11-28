/*
 * Line 10: "Biodiesel, renewable diesel, or sustainable aviation fuel credit
 * from partnerships, S corporations, cooperatives, estates, and trusts"
 * (irs-8864-face-2025::sec::face-page-1::b01). A partnership or S corporation
 * K-1 reports it in box 15 or box 13 code AC: "If no statement is attached,
 * report this amount on Form 8864, line 10. If a statement is attached, see the
 * instructions for Form 8864, line 10" (irs-1065k1-inst-2025::sec::box-15-credits::b09).
 * A cooperative's or an estate's or trust's credit is a stated Form 3800 line
 * 1l or 1ff credit that names the entity's EIN (facts/kinds/generalBusinessCredit.ts):
 * the engine does not read Form 1099-PATR, and a K-1 (Form 1041) credit has no
 * route (passThrough/trustBoxes.ts).
 */

import {
  getGeneralBusinessCreditFacts,
  isK1BiodieselCreditAnswer,
  makeK1BiodieselCreditKey,
  type GeneralBusinessCreditFact,
  type K1BiodieselCreditAnswer,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute, type ReceivedItem } from "../passThrough/receipts.js";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code AC (passThrough box tables). */
export const BIODIESEL_K1_DETAIL = "biodiesel";

/* Form 3800 Part III: line 1l for Form 8864, line 1ff for its SAF credit (irs-8864-inst-2025::sec::line-11::b01). */
export const DIESEL_LINE = "1l";
export const SAF_LINE = "1ff";

export interface K1BiodieselCredit {
  received: ReceivedItem;
  answerKey: string;
  /* Undefined while the answer is missing or malformed. */
  answer?: K1BiodieselCreditAnswer;
}

/* A K-1 code AC credit: Form 8864 and its Form 3800 sources figure it (form3800.ts), not the K-1 table. */
export const isBiodieselK1Credit = (received: ReceivedItem): boolean =>
  received.item.detail === BIODIESEL_K1_DETAIL;

/* Every K-1 code AC credit on the return, with its answer. */
export function k1BiodieselCreditsOf(inputs: ResolverInputs): K1BiodieselCredit[] {
  return k1EntitiesWithRoute(inputs, "form_3800")
    .filter(isBiodieselK1Credit)
    .map((received) => {
      const answerKey = makeK1BiodieselCreditKey(received.entity.key);
      const value = inputs.factByKey.get(answerKey);
      return { received, answerKey, answer: isK1BiodieselCreditAnswer(value) ? value : undefined };
    });
}

/* The stated Form 3800 line 1l and 1ff credits from a cooperative, an estate or a trust (with its EIN). */
export function statedPassThroughCredits(inputs: ResolverInputs): GeneralBusinessCreditFact[] {
  return getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      (value.line === DIESEL_LINE || value.line === SAF_LINE) && value.passThroughEin !== undefined,
  );
}

/* The stated line 1l credits with no EIN: the taxpayer's own credit, entered on Form 3800 directly. */
export function statedOwnCredits(inputs: ResolverInputs): GeneralBusinessCreditFact[] {
  return getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) => value.line === DIESEL_LINE && value.passThroughEin === undefined,
  );
}

export const K1_STATEMENT_GAP = (name: string) =>
  `The K-1 from ${name} prints STMT for box 15 (or box 13) code AC with no amount; the entity's statement gives the credit (irs-1065k1-inst-2025::sec::box-15-credits::b09).`;
