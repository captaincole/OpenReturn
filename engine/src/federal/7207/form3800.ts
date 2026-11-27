/*
 * Form 7207's credit as a Form 3800 source: "All others, stop here and report
 * this amount on Form 3800, Part III, line 1b" (irs-7207-face-2025, Part II
 * line 8a). Each facility's line 8a is one source. The separate form's line 7
 * is not: Form 3800 takes each K-1 credit as its own K-1 source (3800/sources.ts,
 * with the entity's EIN), and a stated credit that names its entity is
 * already a stated source, so nothing is counted twice.
 *
 * A transfer (section 6418) or an elective payment (section 6417(d)(1)(D))
 * reaches Form 3800 as Form 3468's do (3468/credit.ts): the transfer's stated
 * amount in column (f); the elective payment for the facility's whole credit,
 * which columns (h) and (j) leave unsupported (3800/credits.ts).
 */

import {
  readAdvancedManufacturingFacilityFacts,
  type AdvancedManufacturingFacilityFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { FORM_3800_LINE } from "./passThroughCredit.js";
import { filedForm7207Copies } from "./resolveInfo.js";

const BOTH_ELECTIONS_GAP =
  "The facility states both an elective payment and a transfer: a credit that is not elected as a payment can be transferred, not both (irs-7207-inst-2025::sec::credit-transfers::b01).";
const TRANSFER_ABOVE_CREDIT_GAP =
  "The transfer is more than the credit figured in Part II, and only that credit can be transferred (irs-7207-inst-2025::sec::credit-transfers::b01).";

const PURCHASED_GAP =
  "A purchased credit is a transferee's credit, reported on Form 3800 (irs-7207-inst-2025::sec::line-7::b02, Transferees of Eligible Credits), not on the facility's Form 7207.";

/* Why the facility's elections cannot reach Form 3800 as stated; undefined when they can. */
function electionGap(value: AdvancedManufacturingFacilityFactValue, credit: number) {
  const { transfer, electivePayment } = value;
  if (transfer !== undefined && electivePayment !== undefined) return BOTH_ELECTIONS_GAP;
  if (transfer?.direction === "purchased") return PURCHASED_GAP;
  if (transfer !== undefined && roundDollars(transfer.amount) > credit)
    return TRANSFER_ABOVE_CREDIT_GAP;
  return undefined;
}

/* The Form 3800 line 1b sources of the facilities on the filed Forms 7207. */
export function form7207CreditSources(inputs: ResolverInputs): CreditSource[] {
  const copies = filedForm7207Copies(inputs);
  if (copies.length === 0) return [];
  const { facilities } = readAdvancedManufacturingFacilityFacts(inputs.facts);
  return facilities.flatMap(({ key, value }) => {
    const copy = copies.find((each) => each.key === key);
    if (copy?.total === undefined) return [];
    const { passive, passiveActivity, transfer, electivePayment } = value;
    const credit = typeof copy.total === "number" ? copy.total : 0;
    const gap = electionGap(value, credit);
    const source: CreditSource = {
      credit: {
        line: FORM_3800_LINE,
        key,
        amount: gap === undefined ? copy.total : unsupported(gap),
        passive,
        activity: passive ? passiveActivity : undefined,
        transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
        electivePayment: electivePayment && { ...electivePayment, amount: credit },
      },
    };
    return [source];
  });
}
