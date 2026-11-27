/*
 * Form 8835's credit as Form 3800 sources. Line 15: "All others: For
 * electricity produced during the 4-year period beginning on the date the
 * facility was placed in service, stop here, and report the applicable part
 * of this amount on Form 3800, Part III, line 4e. For all other production of
 * electricity, stop here and report the applicable part of this amount on Form
 * 3800, Part III, line 1f" (irs-8835-face-2025::sec::face-part-ii-2::b01).
 *
 * Each facility is one source on each line its credit reaches (copies.ts
 * splits line 15). The K-1 credits of line 14 already are Form 3800 sources
 * of their own (3800/sources.ts), with the entity's EIN, so this adds the
 * facilities only, as Form 8586 adds line 3 (8586/form3800.ts). A facility's
 * passive answer and its section 6418 transfer travel with its source, as a
 * Form 3468 property's do (3468/credit.ts).
 */

import {
  getGeneralBusinessCreditFacts,
  getRenewableElectricityFacilityFacts,
  type RenewableElectricityFacilityFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { gap, isGap, type Cell } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { PASS_THROUGH_COPY, type Form8835Copy } from "./copies.js";
import {
  FIRST_FOUR_YEARS_LINE,
  isStatedForm8835Credit,
  LATER_YEARS_LINE,
} from "./passThroughCredits.js";
import { filedForm8835Copies } from "./resolveInfo.js";

const STATED_TWICE_GAP =
  "A renewable electricity production credit is stated as a Form 3800 line 1f or 4e amount from Form 8835 with no pass-through entity, and Form 8835 figures one from the facility facts: the engine cannot tell whether they are the same credit.";
const PURCHASED_GAP =
  "A purchased (transferred-in) credit is reported on Form 3800 by the transferee, not figured on the seller's Form 8835 (irs-8835-inst-2025::sec::line-14::b01, Caution).";
const SPLIT_TRANSFER_GAP =
  "The facility's credit is split between Form 3800 lines 4e and 1f, and the transfer fact does not say which part it transfers.";

function sourceOf(
  key: string,
  line: string,
  amount: Cell,
  value: RenewableElectricityFacilityFactValue,
  transfers: boolean,
): CreditSource {
  const transfer = transfers ? value.transfer : undefined;
  return {
    credit: {
      line,
      key,
      amount,
      passive: value.passive,
      activity: value.passive ? value.passiveActivity : undefined,
      transfer: transfer && { ...transfer, amount: roundDollars(transfer.amount) },
    },
  };
}

/* A part that reaches its line: an amount above 0, or a gap. */
const reaches = (amount: number | Unsupported | undefined): amount is number | Unsupported =>
  amount !== undefined && (isGap(amount) || amount !== 0);

/* Why the facility's transfer cannot be placed; undefined when it can. */
function transferGap(
  value: RenewableElectricityFacilityFactValue,
  parts: number,
): string | undefined {
  if (value.transfer === undefined) return undefined;
  if (value.transfer.direction === "purchased") return PURCHASED_GAP;
  return parts > 1 ? SPLIT_TRANSFER_GAP : undefined;
}

/* One facility's sources: line 4e for the first 4 years, line 1f for later production. */
function facilitySources(
  copy: Form8835Copy,
  value: RenewableElectricityFacilityFactValue,
): CreditSource[] {
  const credit = copy.credit;
  if (credit === undefined) return [];
  const parts = (
    [
      [FIRST_FOUR_YEARS_LINE, credit.firstFourYears],
      [LATER_YEARS_LINE, credit.later],
    ] as Array<[string, number | Unsupported | undefined]>
  ).filter((part): part is [string, number | Unsupported] => reaches(part[1]));
  const reason = transferGap(value, parts.length);
  return parts.map(([line, amount]) =>
    sourceOf(copy.key, line, reason ? gap(reason) : amount, value, reason === undefined),
  );
}

/*
 * The facilities' sources while Form 8835 files, and the facilities that wait
 * on an answer (no source while waiting). A facility with a credit of 0 has no row.
 */
export function renewableElectricitySourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const copies = filedForm8835Copies(inputs).filter((copy) => copy.key !== PASS_THROUGH_COPY);
  if (copies.length === 0) return { sources: [], missing: [] };
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  const facts = new Map(
    getRenewableElectricityFacilityFacts(inputs.facts).map((fact) => [fact.key, fact.value]),
  );
  const sources = copies.flatMap((copy) => facilitySources(copy, facts.get(copy.key)!));
  if (sources.length === 0) return { sources, missing };
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => isStatedForm8835Credit(value) && value.passThroughEin === undefined,
  );
  if (statedTwice) {
    const credit = { ...sources[0]!.credit, amount: unsupported(STATED_TWICE_GAP) };
    return { sources: [{ credit }], missing };
  }
  return { sources, missing };
}
