/*
 * Form 7218's side of Form 3800 Part III line 1q. Line 3: "All others, stop
 * here and report this amount on Form 3800, Part III, line 1q"
 * (irs-7218-face-2025::sec::face-part-ii::b01). Each facility's line 3 is one
 * source, passive when the activity is passive for the taxpayer, with its
 * section 6418 transfer (Part III column (f)). The pass-through form adds no
 * source: Form 3800 already holds each K-1 and each stated pass-through
 * credit on line 1q with its entity (copies.ts).
 */

import { getCleanFuelFacilityFacts, type CleanFuelFacilityFact } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { FORM_3800_LINE, PASS_THROUGH_COPY, type Form7218Copy } from "./copies.js";
import { filedForm7218Copies } from "./resolveInfo.js";

const STATED_TWICE_GAP =
  "A clean fuel production credit is stated as a Form 3800 line 1q amount with no pass-through entity, and Form 7218 figures one from the facility facts: the engine cannot tell whether they are the same credit.";
const PURCHASED_GAP =
  "A facility's own credit can only be sold under section 6418 (irs-7218-inst-2025::sec::emissions-factor::b03); a purchased clean fuel credit is the buyer's stated Form 3800 line 1q entry, not a Form 7218 facility.";

function sourceOf(copy: Form7218Copy, fact: CleanFuelFacilityFact): CreditSource | undefined {
  if (copy.waiting || copy.line3 === undefined) return undefined;
  const { passive, passiveActivity, transfer } = fact.value;
  const purchased = transfer?.direction === "purchased";
  const credit = {
    line: FORM_3800_LINE,
    key: copy.key,
    amount: purchased ? gap(PURCHASED_GAP) : copy.line3,
    passive,
    activity: passive ? passiveActivity : undefined,
    transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
  };
  return { credit };
}

const isStatedOwn = (source: CreditSource) =>
  source.credit.line === FORM_3800_LINE && source.credit.ein === undefined;

/*
 * The stated Form 3800 sources with each facility's line 3 added, when Form
 * 7218 files, and the facilities that wait on an answer (no source while one
 * waits). A stated line 1q credit with no entity becomes a gap then.
 */
export function withForm7218(
  inputs: ResolverInputs,
  stated: CreditSource[],
): { sources: CreditSource[]; missing: string[] } {
  const copies = filedForm7218Copies(inputs).filter((copy) => copy.key !== PASS_THROUGH_COPY);
  if (copies.length === 0) return { sources: stated, missing: [] };
  const kept = stated.map((source) =>
    isStatedOwn(source)
      ? { ...source, credit: { ...source.credit, amount: gap(STATED_TWICE_GAP) } }
      : source,
  );
  const facts = getCleanFuelFacilityFacts(inputs.facts);
  const own = copies.flatMap((copy) => {
    const fact = facts.find((each) => each.key === copy.key);
    const source = fact && sourceOf(copy, fact);
    return source ? [source] : [];
  });
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { sources: [...kept, ...own], missing };
}
