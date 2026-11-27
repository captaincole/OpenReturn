/*
 * Form 8586's credit as Form 3800 sources: "All others, stop here and report
 * this amount on Form 3800, Part III, line 4d" (irs-8586-form-2025::sec::face-page-1::b01).
 *
 * Line 5 is line 3 (the Forms 8609-A) plus line 4 (the pass-through credits).
 * The K-1 credits already are Form 3800 sources of their own (3800/sources.ts),
 * with the entity's EIN in column (c) and their own passive answer, so this adds
 * line 3 only, one source for each building, and Part III line 4d totals line 5,
 * as Form 5884 does for line 4b (5884/sources.ts).
 *
 * A building the taxpayer owns is a rental real estate activity, so its credit
 * is a passive activity credit for Form 8582-CR, unless the owner was a real
 * estate professional who materially participated in it
 * (irs-8582cr-inst-2025::sec::activities-that-aren-t-passive::b01, item 2). The
 * low-income housing credit needs no active participation and goes on Worksheet
 * 2 or 3 by the year the building was placed in service
 * (irs-8582cr-inst-2025::sec::reporting-credits-from-the-activities::b02). A
 * building in its compliance period in 2025 began its credit period in 2011 or
 * later, so it was placed in service after 1989 (Worksheet 3, Part IV:
 * irs-8582cr-inst-2025::sec::part-iv-special-allowance-for::b01).
 */

import { getGeneralBusinessCreditFacts, RENTAL_KEYS } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import { isGap, type Cell } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { booleanFact } from "../rentals/passive.js";
import { FORM_3800_LINE } from "./passThroughCredits.js";
import { buildingsOnForm8586, resolve8586Info } from "./resolveInfo.js";

const PROFESSIONAL_GAP =
  "The owner was a real estate professional, so a low-income housing building the owner materially participated in is not a passive activity (irs-8582cr-inst-2025::sec::activities-that-aren-t-passive::b01, item 2); the engine does not ask for material participation in the building.";
const STATED_TWICE_GAP =
  "A low-income housing credit is stated as a Form 3800 line 4d amount with no pass-through entity, and Form 8609-A figures one from the building facts: the engine cannot tell whether they are the same credit.";

const sourceOf = (key: string, amount: Cell, passive: boolean, bin = ""): CreditSource => ({
  credit: {
    line: FORM_3800_LINE,
    key,
    amount,
    passive,
    activity: passive
      ? { name: `Low-income housing building ${bin}`, rentalRealEstate: true, before1990: false }
      : undefined,
  },
});

/* One source that carries the gap, so line 4d and every total that adds it stay unsupported. */
const gapSource = (key: string, reason: string) => sourceOf(key, unsupported(reason), false);

/*
 * Line 3 as Form 3800 sources while Form 8586 files, and the answers they wait
 * on: a Form 8609-A's fact, or the real estate professional answer that decides
 * whether the credit is passive. A building with a credit of 0 has no row.
 */
export function lowIncomeHousingSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  if (resolve8586Info(inputs).mustFile?.["form-8586"]?.value !== true) {
    return { sources: [], missing: [] };
  }
  const buildings = buildingsOnForm8586(inputs).filter((building) => building.credit !== 0);
  const waiting = buildings.filter((building) => building.credit === undefined);
  const missing = [...new Set(waiting.flatMap((building) => building.waitingOn))];
  const withCredit = buildings.filter((building) => building.credit !== undefined);
  const gaps = withCredit.filter((building) => isGap(building.credit));
  // A Form 8609-A line that is a gap keeps its own reason on line 4d.
  if (gaps.length > 0) {
    return { sources: gaps.map((each) => sourceOf(each.key, each.credit, false)), missing };
  }
  if (withCredit.length === 0) return { sources: [], missing };
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === FORM_3800_LINE && value.passThroughEin === undefined,
  );
  if (statedTwice) return { sources: [gapSource(withCredit[0].key, STATED_TWICE_GAP)], missing };
  const professional = booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional));
  if (professional === undefined) {
    return { sources: [], missing: [...missing, RENTAL_KEYS.realEstateProfessional] };
  }
  if (professional) return { sources: [gapSource(withCredit[0].key, PROFESSIONAL_GAP)], missing };
  const sources = withCredit.map((building) =>
    sourceOf(building.key, building.credit, true, building.buildingIdentificationNumber),
  );
  return { sources, missing };
}
