/*
 * Form 7213's credits as Form 3800 sources: Part I line 9, "All others, stop
 * here and enter this amount on Form 3800, Part III, line 1cc", and Part II
 * line 13, "report this amount on Form 3800, Part III, line 1u"
 * (irs-7213-face-2025::sec::face-part-i::b02, face-part-ii::b02). Each facility
 * copy is one source. The pass-through copy's K-1 credits already are Form
 * 3800 sources of their own (3800/sources.ts, with each entity's EIN and
 * passive answer), so Part III lines 1cc and 1u add to the copies' totals.
 */

import { getGeneralBusinessCreditFacts, getNuclearFacilityFacts } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { Form7213Copy } from "./cells.js";
import { PART_I_TOTAL, PART_II_TOTAL } from "./copies.js";
import { filedForm7213Copies } from "./resolveInfo.js";

/* Part III lines 1cc (Form 7213 Part I) and 1u (Part II) (3800/rows.ts). */
export const ADVANCED_NUCLEAR_LINE = "1cc";
export const ZERO_EMISSION_LINE = "1u";

const STATED_TWICE_GAP = (line: string) =>
  `A nuclear power production credit is stated as a Form 3800 line ${line} amount with no pass-through entity, and Form 7213 figures one from a facility fact: the engine cannot tell whether they are the same credit.`;

/* One facility copy's source, from its part's total line. */
function facilitySource(copy: Form7213Copy, inputs: ResolverInputs): CreditSource | undefined {
  const fact = getNuclearFacilityFacts(inputs.facts).find((each) => each.key === copy.key);
  if (fact === undefined) return undefined;
  const { credit, passive, passiveActivity } = fact.value;
  const line = credit.section === "45J" ? ADVANCED_NUCLEAR_LINE : ZERO_EMISSION_LINE;
  const total = copy.cells[credit.section === "45J" ? PART_I_TOTAL : PART_II_TOTAL];
  const amount = typeof total === "number" || typeof total === "object" ? total : undefined;
  const transfer = credit.section === "45U" ? credit.transfer : undefined;
  const electivePayment = credit.section === "45U" ? credit.electivePayment : undefined;
  return {
    credit: {
      line,
      key: copy.key,
      amount: statedTwice(inputs, line) ? unsupported(STATED_TWICE_GAP(line)) : amount,
      passive,
      activity: passive ? passiveActivity : undefined,
      transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
      electivePayment: electivePayment && {
        ...electivePayment,
        amount: roundDollars(electivePayment.amount),
      },
    },
  };
}

/* A stated general business credit on the line that names no pass-through entity. */
const statedTwice = (inputs: ResolverInputs, line: string) =>
  getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === line && value.passThroughEin === undefined,
  );

/*
 * The facility copies' sources for Form 3800, and the facilities that wait on
 * an answer (no source while one waits). None while Form 7213 does not file.
 */
export function nuclearProductionSources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const copies = filedForm7213Copies(inputs);
  const waiting = copies.filter((copy) => copy.waiting);
  const sources = copies
    .filter((copy) => !copy.waiting)
    .flatMap((copy) => facilitySource(copy, inputs) ?? []);
  return { sources, missing: waiting.map((copy) => copy.key) };
}
