/*
 * One activity's Form 6198, from its Part I entries and the owner's amounts at
 * risk. The at-risk stage of the K-1 loss limits (passThrough/atRisk.ts) and
 * Schedule C line 31 (schedule-c/atRisk.ts) read the allocation; the form's
 * bindings print the lines. Imports no form, so both may read it.
 */

import type { AtRiskAmounts } from "../../facts/index.js";
import {
  allocateLoss,
  amountAtRisk,
  amountAtRiskBelowZero,
  deductibleLoss,
  partIIILines,
  partIILines,
  partILines,
  type AllowedEntry,
  type PartIEntry,
  type PartIIILines,
  type PartIILines,
  type PartILines,
} from "./lines.js";

/* One activity that files Form 6198: a K-1 entity or a Schedule C business. */
export interface AtRiskActivity<T> {
  /* The fact the owner's amounts at risk are in; the form waits on it. */
  factKey: string;
  /* How a reason names the activity. */
  title: string;
  /* The header's description of the activity (irs-6198-inst-2025::sec::specific-instructions::b01). */
  description: string;
  /* This year's items, any loss carried from an earlier year included (::part-i-2::b01). */
  entries: ReadonlyArray<PartIEntry<T>>;
  amounts?: AtRiskAmounts;
  /* Whose activity it is on a joint return: the header's identifying number. */
  owner: "taxpayer" | "spouse";
}

export interface Form6198Figures<T> {
  partI: PartILines;
  /* Parts II to IV only with a line 5 loss ("If line 5 shows a current year profit, you may not have to complete the rest of this form"). */
  partII?: PartIILines;
  partIII?: PartIIILines;
  line20?: number;
  line21?: number;
  /* Each entry's allowed part and the part carried to next year. */
  entries: AllowedEntry<T>[];
}

export type Form6198Outcome<T> =
  | { kind: "figured"; figures: Form6198Figures<T> }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

const LINE_2: ReadonlyArray<string> = ["2a", "2b", "2c"];

/* Lines 2a to 2c from the facts: amounts the owner reports on another form. */
export function dispositionEntries<T>(amounts: AtRiskAmounts | undefined): PartIEntry<T>[] {
  const sold = amounts?.dispositions;
  const entries: Array<PartIEntry<T> | undefined> = [
    sold?.scheduleD === undefined ? undefined : { line: "2a", amount: sold.scheduleD },
    sold?.form4797 === undefined ? undefined : { line: "2b", amount: sold.form4797 },
    sold?.otherForm === undefined ? undefined : { line: "2c", amount: sold.otherForm.amount },
  ];
  return entries.filter(
    (entry): entry is PartIEntry<T> => entry !== undefined && entry.amount !== 0,
  );
}

/* Part II and Part III as the facts give them; a Part III with its starting amount missing waits. */
function amountsAtRisk(amounts: AtRiskAmounts | undefined) {
  const partII = amounts?.simplified ? partIILines(amounts.simplified) : undefined;
  const partIII = amounts?.detailed ? partIIILines(amounts.detailed) : undefined;
  const waits = amounts?.detailed !== undefined && partIII === undefined;
  return { partII, partIII, waits };
}

/*
 * The activity's Form 6198. A line 5 profit allows every item in full. A loss
 * waits on the amounts at risk (Part II or Part III). Two cases are not
 * modeled: an amount at risk below zero (the recapture of earlier losses), and
 * a loss on lines 2a to 2c the limit would reduce, since that loss is on
 * another form the engine does not change.
 */
export function figureForm6198<T>(activity: AtRiskActivity<T>): Form6198Outcome<T> {
  const partI = partILines(activity.entries);
  if (partI.line5 >= 0) {
    return {
      kind: "figured",
      figures: { partI, entries: allocateLoss(activity.entries, undefined) },
    };
  }
  const { partII, partIII, waits } = amountsAtRisk(activity.amounts);
  const line20 = amountAtRisk(partII, partIII);
  if (waits || line20 === undefined) return { kind: "waiting", factKeys: [activity.factKey] };
  if (amountAtRiskBelowZero(partII, partIII)) {
    return {
      kind: "unsupported",
      reason: `${activity.title}: the amount at risk is below zero at the end of the year, so earlier losses may be recaptured as income (irs-pub-925-2025::sec::recapture-rule::b01), which is not modeled.`,
    };
  }
  const line21 = deductibleLoss(partI.line5, line20);
  const entries = allocateLoss(activity.entries, line21);
  if (entries.some((entry) => LINE_2.includes(entry.line) && entry.carried < 0)) {
    return {
      kind: "unsupported",
      reason: `${activity.title}: the at-risk limit reduces a loss on Form 6198 lines 2a to 2c, which the owner reports on another form; reducing it there is not modeled.`,
    };
  }
  return { kind: "figured", figures: { partI, partII, partIII, line20, line21, entries } };
}
