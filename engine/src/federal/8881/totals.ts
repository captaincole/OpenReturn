/*
 * Form 8881 lines 7, 10 and 14 (the credits from partnerships and S
 * corporations) and the part totals 8, 11 and 15.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { firstGap } from "../3800/cells.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";

export type Amount = number | Unsupported | undefined;

/* Each part's K-1 detail (partnership box 15 and S corporation box 13, codes AE, AF and AG) and its Form 3800 Part III row. */
export const PARTS = {
  partI: { detail: "pension_startup", line: "1j", sourceForm: "8881 Part I" },
  partII: { detail: "auto_enrollment", line: "1dd", sourceForm: "8881 Part II" },
  partIII: { detail: "military_spouse_participation", line: "1ee", sourceForm: "8881 Part III" },
} as const;

export type Part = keyof typeof PARTS;

/*
 * Lines 7, 10 and 14: the part's credit "from partnerships and S corporations"
 * (irs-8881-face-2025::sec::face-part-i::b03, face-part-ii::b01,
 * face-part-iii::b01). The K-1 boxes come from the K-1 facts; any other notice
 * is a stated Form 3800 credit on the part's row that names its pass-through
 * entity (passThroughEin). Each is rounded, then added. Blank with none.
 */
export function passThroughCredit(inputs: ResolverInputs, part: Part): Amount {
  const { detail, line, sourceForm } = PARTS[part];
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(({ item }) => item.detail === detail);
  if (k1.some(({ item }) => item.amount === undefined)) {
    return unsupported(
      `A Schedule K-1 ${sourceForm} credit has no amount, so its line is not known.`,
    );
  }
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      value.line === line && value.sourceForm === sourceForm && value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}

/* Lines 8, 11 and 15: "Add lines 5, 6g, and 7", "Add lines 9 and 10", "Add lines 12, 13, and 14" (face-part-i::b03, face-part-ii::b01, face-part-iii::b01). */
export function partTotal(...lines: Amount[]): Amount {
  return firstGap(lines) ?? sumOrBlank(...lines);
}
