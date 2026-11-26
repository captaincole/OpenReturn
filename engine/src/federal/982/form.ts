/*
 * The whole Form 982 from the debts, the insolvency amount and the tax
 * attributes: Part I (partOne.ts, then the farm and real property business
 * limits here), Part II (partTwo.ts), and the taxable rest of each debt.
 */

import { roundDollars, sum } from "../../money.js";
import { amountOrZero, type Attributes, type DebtInput } from "./lines.js";
import { splitDebts, type DebtSplit } from "./partOne.js";
import {
  addPasses,
  attributesLeft,
  farmLimit,
  farmPass,
  generalPass,
  type PassLines,
  type QualifiedProperty,
} from "./partTwo.js";

export interface Form982Lines {
  line1a?: true;
  line1b?: true;
  line1c?: true;
  line1d?: true;
  line1e?: true;
  line2?: number;
  line3Yes?: true;
  line3No?: true;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10a?: number;
  line10b?: number;
  line11a?: number;
  line11b?: number;
  line11c?: number;
  line12?: number;
  line13?: number;
}

export type Form982Outcome =
  | {
      kind: "figured";
      /* Undefined when nothing is excluded: Form 982 does not file. */
      form?: Form982Lines;
      /* The taxable rest of the nonbusiness debts: Schedule 1 line 8c, cents kept. */
      nonbusinessTaxable: number;
      /* The taxable rest of business, rental and farm debts (Schedule C, E or F, Form 4835). */
      businessTaxable: number;
      /* Line 1e's part of line 2, cents kept (Schedule CA line 8c column C). */
      principalResidenceExcluded: number;
    }
  | { kind: "gap"; reason: string };

const FARM_AFTER_BASIS_GAP =
  "Line 10a reduces the basis of property under the insolvency or title 11 exclusion, and a farm exclusion follows; the engine does not split that basis among the farm's qualified property (irs-pub-4681-2025::sec::qualified-farm-indebtedness::b02), so the farm limit and lines 11a–11c are not figured.";
const REAL_PROPERTY_AFTER_BASIS_GAP =
  "Line 1d's second limit is the depreciable real property basis after the other basis reductions (irs-982-inst-2025::sec::line-1d::b02); lines 5, 10a or 11a reduce basis too, and the engine does not know how much of them falls on real property.";
const TWO_HOME_BASES_GAP =
  "Two principal residence debts state different home bases; a taxpayer has one main home at a time (irs-982-inst-2025::sec::line-1e::b01).";

const positive = (amount: number): number | undefined =>
  amount > 0 ? roundDollars(amount) : undefined;
const checked = (amount: number): true | undefined => (amount > 0 ? true : undefined);

/* Share one limit among the debts in the order of the facts. */
function allocate(candidates: readonly number[], limit: number): number[] {
  let left = amountOrZero(limit);
  return candidates.map((each) => {
    const used = Math.min(amountOrZero(each), left);
    left -= used;
    return used;
  });
}

/*
 * Line 10b: "the smaller of: That part of line 2 that is attributable to the
 * exclusion of qualified principal residence indebtedness, or The basis of your
 * main home", when the taxpayer still owns it (irs-982-inst-2025::sec::line-10b::b01).
 */
function line10bOf(splits: readonly DebtSplit[]): number | string {
  const kept = splits.filter(
    (split) => split.debt.residence?.keepsHome && split.principalResidence > 0,
  );
  const bases = new Set(kept.map((split) => split.debt.residence?.homeBasis ?? 0));
  if (bases.size > 1) return TWO_HOME_BASES_GAP;
  const excluded = sum(...kept.map((split) => split.principalResidence));
  return Math.min(excluded, [...bases][0] ?? 0);
}

/*
 * DECISION (2026-11-26, by the author): the line 10a limit counts the money held
 * immediately after the discharge. Text A, the line 10a instruction: "the
 * reduction in basis is limited to the aggregate of the basis of your property
 * immediately after the discharge over the aggregate of your liabilities
 * immediately after the discharge" (irs-982-inst-2025::sec::line-10a::b01).
 * Text B, the chart of the same instructions: "the excess of the aggregate
 * bases of the property and the amount of money you held immediately after the
 * discharge over your aggregate liabilities" (how-to-complete-the-form::b03),
 * as Pub. 4681 (irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b08) and
 * Pub. 225 (irs-pub-225-2025::sec::bankruptcy-and-insolvency::b04) say. The
 * engine follows Text B: three texts and the Pub. 4681 example ($5,500 basis +
 * $600 savings − $6,000 = $100) count the money, and the line 10a sentence is
 * the shorter wording of the same limit. The basis after line 5 counts
 * (bankruptcy-and-insolvency::b10).
 */
function basisLimitOf(attributes: Attributes, propertyBasis: number) {
  return (line5: number) =>
    amountOrZero(
      propertyBasis - line5 + attributes.moneyAfterDischarge - attributes.liabilitiesAfterDischarge,
    );
}

/* The two Part II passes, the farm amount, or the gap that stops them. */
function partTwo(splits: readonly DebtSplit[], attributes: Attributes, line10b: number) {
  const propertyBasis =
    attributes.depreciableBasis +
    attributes.realPropertyForSaleBasis +
    attributes.otherPropertyBasis;
  const firstAmount = sum(...splits.map((split) => split.title11 + split.insolvency));
  const first = generalPass(
    firstAmount,
    attributesLeft(attributes),
    propertyBasis - line10b,
    basisLimitOf(attributes, propertyBasis),
  );
  const farmCandidates = splits.map((split) => (split.debt.kind === "farm" ? split.rest : 0));
  if (sum(...farmCandidates) > 0 && first.lines.line10a > 0) return FARM_AFTER_BASIS_GAP;
  const property: QualifiedProperty = {
    farmLand: attributes.farmLandBasis,
    other:
      attributes.otherQualifiedPropertyBasis +
      (attributes.treatRealPropertyForSaleAsDepreciable ? 0 : attributes.realPropertyForSaleBasis),
  };
  const farm = allocate(farmCandidates, farmLimit(first.left, property));
  const second = farmPass(sum(...farm), first.left, property);
  return { pass: addPasses(first.lines, second.lines), farm };
}

/*
 * Line 1d's second limit: "the aggregate adjusted basis ... of depreciable real
 * property (determined after any reductions under sections 108(b) and (g))"
 * (irs-982-inst-2025::sec::line-1d::b02). The real property's share of lines 5,
 * 10a and 11a is not known, so the limit is figured only when it cannot bind.
 */
function realPropertyLimit(candidates: number, attributes: Attributes, pass: PassLines) {
  const otherReductions = pass.line5 + pass.line10a + pass.line11a;
  const basis = amountOrZero(attributes.depreciableRealPropertyBasis);
  if (candidates <= 0 || candidates <= basis - otherReductions) return candidates;
  return otherReductions === 0 ? basis : REAL_PROPERTY_AFTER_BASIS_GAP;
}

/* Line 3 is a question for "Any other debt" (irs-982-inst-2025::sec::how-to-complete-the-form::b03). */
function asksLine3(splits: readonly DebtSplit[], attributes: Attributes, farmTotal: number) {
  const firstPass = splits.filter((split) => split.title11 + split.insolvency > 0);
  if (firstPass.length === 0 && farmTotal === 0) return false;
  const businessDebt = firstPass.some(
    (split) => split.debt.kind !== "personal" && split.debt.kind !== "principal_residence",
  );
  const otherAttributes = [
    attributes.netOperatingLoss,
    attributes.generalBusinessCredit,
    attributes.minimumTaxCredit,
    attributes.netCapitalLoss,
    attributes.depreciableBasis,
    attributes.realPropertyForSaleBasis,
    attributes.passiveActivityLoss,
    attributes.passiveActivityCredit,
    attributes.foreignTaxCredit,
  ].some((amount) => amount > 0);
  return farmTotal > 0 || businessDebt || otherAttributes;
}

interface Excluded {
  splits: readonly DebtSplit[];
  farm: readonly number[];
  realProperty: readonly number[];
  pass: PassLines;
  line10b: number;
}

/* The printed lines, each total rounded to the nearest dollar. */
function printedLines(excluded: Excluded, attributes: Attributes): Form982Lines {
  const { splits, farm, realProperty, pass } = excluded;
  const total = (pick: (split: DebtSplit) => number) => sum(...splits.map(pick));
  const line4 = sum(...realProperty);
  const line2 =
    total((split) => split.title11 + split.principalResidence + split.insolvency) +
    sum(...farm) +
    line4;
  const line3 = asksLine3(splits, attributes, sum(...farm));
  const elected = attributes.treatRealPropertyForSaleAsDepreciable;
  return {
    line1a: checked(total((split) => split.title11)),
    line1b: checked(total((split) => split.insolvency)),
    line1c: checked(sum(...farm)),
    line1d: checked(line4),
    line1e: checked(total((split) => split.principalResidence)),
    line2: positive(line2),
    line3Yes: line3 && elected ? true : undefined,
    line3No: line3 && !elected ? true : undefined,
    line4: positive(line4),
    ...Object.fromEntries(
      (Object.keys(pass) as Array<keyof PassLines>).map((key) => [key, positive(pass[key])]),
    ),
    line10b: positive(excluded.line10b),
  };
}

/* Form 982 and the taxable rest of each debt. */
export function figureForm982(
  debts: readonly DebtInput[],
  insolvency: number,
  attributes: Attributes,
  principalResidenceCap: number,
): Form982Outcome {
  const splits = splitDebts(debts, insolvency, principalResidenceCap);
  const line10b = line10bOf(splits);
  if (typeof line10b === "string") return { kind: "gap", reason: line10b };
  const two = partTwo(splits, attributes, line10b);
  if (typeof two === "string") return { kind: "gap", reason: two };
  const candidates = splits.map((split) => split.realPropertyCandidate);
  const limit = realPropertyLimit(sum(...candidates), attributes, two.pass);
  if (typeof limit === "string") return { kind: "gap", reason: limit };
  const realProperty = allocate(candidates, limit);
  const taxable = splits.map((split, index) => split.rest - two.farm[index] - realProperty[index]);
  const nonbusiness = (split: DebtSplit) =>
    split.debt.kind === "personal" || split.debt.kind === "principal_residence";
  const excluded = { splits, farm: two.farm, realProperty, pass: two.pass, line10b };
  const form = printedLines(excluded, attributes);
  return {
    kind: "figured",
    form: form.line2 === undefined ? undefined : form,
    nonbusinessTaxable: sum(...taxable.filter((_, index) => nonbusiness(splits[index]))),
    businessTaxable: sum(...taxable.filter((_, index) => !nonbusiness(splits[index]))),
    principalResidenceExcluded: sum(...splits.map((split) => split.principalResidence)),
  };
}
