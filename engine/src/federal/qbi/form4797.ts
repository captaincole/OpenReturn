/*
 * Form 4797's part of a business's QBI. "Ordinary business income or loss is
 * generally included in QBI ... a section 1231 gain or loss is only includible
 * in QBI if it isn't capital gain or loss"
 * (irs-8995-inst-2025::sec::determining-your-qualified-business::b06). So a
 * Schedule C business, or a rental that is a QBI trade or business, takes the
 * ordinary amount of the property it sold: the Part II rows, the Part III
 * recapture and its share of line 11 or 12 (4797/activities.ts).
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { resolve4797Info } from "../4797/resolveInfo.js";
import type { QbiBusiness } from "./filingInfo.js";

export function withForm4797(inputs: ResolverInputs, businesses: QbiBusiness[]): QbiBusiness[] {
  const activities = resolve4797Info(inputs).form4797Activities;
  if (activities === undefined) return businesses;
  return businesses.map((business) => {
    if (business.kind === "passThrough") return business;
    if (activities.waiting) return { ...business, form4797Waits: true };
    const entry = activities.amounts.find((each) => each.key === business.factKey);
    const gapHolds = entry !== undefined || activities.amounts.length === 0;
    if (activities.ordinaryGap && gapHolds) {
      return { ...business, qbiGap: business.qbiGap ?? `Form 4797: ${activities.ordinaryGap}` };
    }
    return entry === undefined ? business : { ...business, form4797Ordinary: entry.ordinary };
  });
}
