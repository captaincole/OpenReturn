/*
 * Form 3468's credits on Form 3800 Part III: "You must report any credit
 * amount for a facility or property on Part III, line 3; Part IV, line 3; Part
 * V, line 11; or Part VI, line 32 of Form 3468, on the applicable lines of Form
 * 3800, Part III" (irs-3468-inst-2025::sec::specific-instructions::b03), and
 * Part II line 7 and Part VII line 3 as the form says (face-part-ii::b02,
 * face-part-vii::b02). Each property is one source; each part of a stated
 * cooperative fact is one source. A K-1's codes P to U stay the K-1's own
 * sources (3800/k1Credits.ts): their amounts are the credits.
 */

import {
  getCooperativeInvestmentCreditFacts,
  getInvestmentCreditPropertyFacts,
  type CooperativeInvestmentCreditFact,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { ReceivedItem } from "../passThrough/receipts.js";
import { COOPERATIVE_FIELDS, COOPERATIVES_COPY, PARTS, type Form3468Copy } from "./copies.js";
import { filedForm3468Copies } from "./resolveInfo.js";

function cooperativeSources(fact: CooperativeInvestmentCreditFact): CreditSource[] {
  const { credits, passive, passiveActivity, cooperativeEin } = fact.value;
  const parts = Object.keys(PARTS) as Array<keyof typeof PARTS>;
  return parts.flatMap((part) => {
    const line = PARTS[part].form3800Line;
    const amount = credits[COOPERATIVE_FIELDS[part]];
    if (amount === undefined) return [];
    const credit = {
      line,
      key: fact.key,
      amount: roundDollars(amount),
      passive,
      activity: passive ? passiveActivity : undefined,
      ein: cooperativeEin,
    };
    return [{ credit }];
  });
}

/* One property's source, from its copy's total line. */
function propertySource(copy: Form3468Copy, inputs: ResolverInputs): CreditSource | undefined {
  const fact = getInvestmentCreditPropertyFacts(inputs.facts).find((each) => each.key === copy.key);
  if (fact === undefined || copy.part === undefined) return undefined;
  const { passive, passiveActivity, passThroughEin, transfer, electivePayment } = fact.value;
  const credit = {
    line: PARTS[copy.part].form3800Line,
    key: copy.key,
    amount: copy.total,
    passive,
    activity: passive ? passiveActivity : undefined,
    ein: passThroughEin,
    transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
    electivePayment: electivePayment && {
      ...electivePayment,
      amount: roundDollars(electivePayment.amount),
    },
  };
  return { credit };
}

/* Form 3468's sources for Form 3800, and the properties that wait on an answer. */
export function form3468CreditSources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const copies = filedForm3468Copies(inputs);
  if (copies.length === 0) return { sources: [], missing: [] };
  const properties = copies.filter((copy) => copy.key !== COOPERATIVES_COPY);
  const sources = properties.flatMap((copy) => propertySource(copy, inputs) ?? []);
  const cooperatives = getCooperativeInvestmentCreditFacts(inputs.facts).flatMap(
    cooperativeSources,
  );
  const missing = properties.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { sources: [...sources, ...cooperatives], missing };
}

/*
 * A K-1's box 15 code E that a property fact figures on Form 3468 (its k1Key):
 * the property's source stands in for it, so the K-1 item is not counted twice.
 */
export function figuredOnForm3468(inputs: ResolverInputs, received: ReceivedItem): boolean {
  if (received.item.detail !== "rehabilitation_rental") return false;
  if (filedForm3468Copies(inputs).length === 0) return false;
  return getInvestmentCreditPropertyFacts(inputs.facts).some(
    (fact) => fact.value.k1Key === received.entity.key,
  );
}
