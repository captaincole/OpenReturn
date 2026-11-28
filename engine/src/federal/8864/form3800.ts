/*
 * Form 8864's credit as Form 3800 sources: "All others, stop here and report
 * this amount on the appropriate line of Form 3800" (irs-8864-face-2025::sec::face-page-1::b01),
 * "Form 3800, Part III, line 1l. However, if the amount on line 10 includes the
 * SAF credit, report the amount of the SAF credit on Form 3800, Part III, line
 * 1ff" (irs-8864-inst-2025::sec::line-11::b01).
 *
 * Form 3800 takes line 9 here, one source for each business (its part of line
 * 9), and each K-1 code AC credit as a source of its own, with the entity's EIN
 * and passive answer, split between lines 1l and 1ff by the owner's answer. The
 * K-1 sources do not wait for Form 8864 to file: a taxpayer whose only source
 * is a K-1 reports it on Form 3800 directly (the DECISION in resolveInfo.ts).
 * Form 3800's own K-1 table leaves code AC to this file (3800/sources.ts). A
 * stated cooperative, estate or trust credit stays a stated Form 3800 source.
 */

import type { PassiveCreditActivity } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CurrentCredit } from "../3800/credits.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { COMBINED_LIMIT_GAP, type ProductionOfBusiness } from "./figures.js";
import {
  DIESEL_LINE,
  K1_STATEMENT_GAP,
  k1BiodieselCreditsOf,
  SAF_LINE,
  statedOwnCredits,
  type K1BiodieselCredit,
} from "./k1.js";
import { columnC, RATE_AFTER_JUNE } from "./lines.js";
import { agriBiodieselFiguresOf, resolve8864Info } from "./resolveInfo.js";

type Found = { sources: CreditSource[]; missing: string[] };

/* One source that carries the gap, so line 1l and every total that adds it stay unsupported. */
const gapSource = (key: string, reason: string, line = DIESEL_LINE): CreditSource => ({
  credit: { line, key, amount: unsupported(reason), passive: false },
});

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (column (d)), which Form 8582-CR limits by the tax on
 * net passive income. The engine does not figure a passive Schedule C business
 * (schedule-c/lines.ts), so that limit is a gap, as for Form 8846.
 */
const PASSIVE_BUSINESS_GAP =
  "The agri-biodiesel credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

const TRANSFER_GAP = (key: string) =>
  `The transfer election of ${key} is more than its credit for fuel sold or used after June 30, 2025, the only part a section 6418 election can transfer (irs-8864-inst-2025::sec::what-s-new::b01).`;

const STATED_OWN_GAP = (key: string) =>
  `The stated Form 3800 line 1l credit ${key} has no pass-through EIN, so it is the taxpayer's own credit, which Form 8864 lines 7 to 9 figure from the production facts: record the credit once.`;

/*
 * "Include this amount in income ... even if you can't use all of the credit"
 * (irs-8864-inst-2025::sec::line-9::b01): Schedule C line 6 takes line 9 from
 * the production fact alone. With the decision decisions.scope.must_file_8864
 * false, the income stays and no credit is claimed. Until the two agree, line
 * 1l is a gap, so the return never takes the income without the credit.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8864 is false, but the agri-biodiesel production ${key} claims the credit, and its Schedule C line 6 includes line 9 (irs-8864-inst-2025::sec::line-9::b01). Remove the decision, or the production fact if the credit is not claimed.`;

function ownSource(production: ProductionOfBusiness): CreditSource | string {
  if (production.business.materiallyParticipated === false) return PASSIVE_BUSINESS_GAP;
  const transfer = production.fact.transfer;
  if (transfer && transfer.amount > columnC(production.fact.gallonsAfterJune, RATE_AFTER_JUNE)) {
    return TRANSFER_GAP(production.key);
  }
  const credit: CurrentCredit = {
    line: DIESEL_LINE,
    key: production.key,
    amount: production.share ?? 0,
    passive: false,
    transfer: transfer && {
      direction: "sold",
      amount: roundDollars(transfer.amount),
      registrationNumber: transfer.registrationNumber,
    },
  };
  return { credit };
}

/* Line 9's sources: one for each business with a part, or the gap that stops them. */
function ownSourcesOf(inputs: ResolverInputs): Found {
  const figures = agriBiodieselFiguresOf(inputs);
  const first = figures.eligibleKeys[0];
  if (first === undefined) return { sources: [], missing: [] };
  if (resolve8864Info(inputs).mustFile?.["form-8864"]?.value !== true) {
    return { sources: [gapSource(first, DECISION_CONFLICT_GAP(first))], missing: [] };
  }
  if (figures.gap !== undefined) return { sources: [gapSource(first, figures.gap)], missing: [] };
  const stated = statedOwnCredits(inputs)[0];
  if (stated !== undefined) {
    return { sources: [gapSource(stated.key, STATED_OWN_GAP(stated.key))], missing: [] };
  }
  const unknown = figures.productions.filter(
    ({ business }) => business.materiallyParticipated === undefined,
  );
  if (unknown.length > 0) {
    return { sources: [], missing: unknown.map(({ businessKey }) => businessKey) };
  }
  const withCredit = figures.productions.filter(({ share }) => (share ?? 0) > 0);
  const sources = withCredit.map((production) => {
    const source = ownSource(production);
    return typeof source === "string" ? gapSource(production.key, source) : source;
  });
  return { sources, missing: [] };
}

/*
 * A K-1 credit is passive when the owner did not materially participate in the
 * entity (irs-1065k1-inst-2025::sec::box-15-credits::b01), and Form 8582-CR
 * takes its activity: the rule of 3800/sources.ts for every other K-1 credit,
 * for a credit that is never a rental credit.
 */
function k1Activity({ received }: K1BiodieselCredit): PassiveCreditActivity {
  const { entity } = received;
  return {
    name: entity.name,
    rentalRealEstate: false,
    activelyParticipated: entity.holding?.activelyParticipated,
    before1990: false,
    publiclyTradedPartnership: entity.k1.form === "1065" && entity.k1.publiclyTraded === true,
  };
}

const SAF_OVER_AMOUNT_GAP = (name: string) =>
  `The sustainable aviation fuel credit stated for the K-1 from ${name} is more than its box 15 (or box 13) code AC amount, which includes it.`;

/* One K-1's sources: the credit less its SAF part on line 1l, the SAF part on line 1ff. */
function k1Sources(credit: K1BiodieselCredit, limitsExceeded: boolean): Found {
  const { entity, item } = credit.received;
  const participated = entity.holding?.materiallyParticipated;
  const missing = [
    ...(participated === undefined ? [entity.holdingKey] : []),
    ...(credit.answer === undefined ? [credit.answerKey] : []),
  ];
  if (item.amount === undefined) {
    return { sources: [gapSource(entity.key, K1_STATEMENT_GAP(entity.name))], missing: [] };
  }
  if (missing.length > 0 || credit.answer === undefined) return { sources: [], missing };
  if (limitsExceeded && credit.answer.agriBiodiesel !== undefined) {
    return { sources: [gapSource(entity.key, COMBINED_LIMIT_GAP)], missing: [] };
  }
  const amount = roundDollars(item.amount);
  const saf = roundDollars(credit.answer.safCredit);
  if (saf > amount)
    return { sources: [gapSource(entity.key, SAF_OVER_AMOUNT_GAP(entity.name))], missing: [] };
  const passive = participated === false;
  const base = { key: entity.key, passive, ein: entity.ein };
  const activity = passive ? k1Activity(credit) : undefined;
  const parts: Array<[string, number]> = [
    [DIESEL_LINE, amount - saf],
    [SAF_LINE, saf],
  ];
  const sources = parts
    .filter(([, part]) => part !== 0)
    .map(([line, part]) => ({ credit: { ...base, line, amount: part, activity } }));
  return { sources, missing: [] };
}

/* Every Form 8864 source of Form 3800 lines 1l and 1ff, and the answers they wait on (fact keys). */
export function biodieselCreditSourcesOf(inputs: ResolverInputs): Found {
  const own = ownSourcesOf(inputs);
  const limitsExceeded = agriBiodieselFiguresOf(inputs).combinedLimitsExceeded;
  const k1 = k1BiodieselCreditsOf(inputs).map((credit) => k1Sources(credit, limitsExceeded));
  return {
    sources: [...own.sources, ...k1.flatMap((found) => found.sources)],
    missing: [...own.missing, ...k1.flatMap((found) => found.missing)],
  };
}
