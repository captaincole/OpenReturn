/*
 * Form 982 Part II: the tax attributes each excluded dollar reduces, in two
 * passes. The first takes the amounts of lines 1a and 1b in the general order;
 * the second takes the farm amount of line 1c on what the first left ("If you
 * exclude canceled debt from income under both the insolvency exclusion and the
 * exclusion for qualified farm indebtedness, you must first reduce your tax
 * attributes by the amount excluded under the insolvency exclusion",
 * irs-pub-4681-2025::sec::qualified-farm-indebtedness-2::b01). Each line holds
 * the excluded dollars applied (irs-982-face-2025::sec::face-part-ii::b01).
 */

import {
  amountOrZero,
  applyInOrder,
  EXCLUDED_DOLLARS_PER_CREDIT_DOLLAR,
  type Attributes,
} from "./lines.js";

/* What is left of each attribute, in excluded dollars (a credit counts 3 times). */
export interface AttributesLeft {
  netOperatingLoss: number;
  generalBusinessCredit: number;
  minimumTaxCredit: number;
  netCapitalLoss: number;
  passive: number;
  foreignTaxCredit: number;
  /* Depreciable basis that line 5 and line 11a can still reduce (with line 3, the property held for sale too). */
  depreciableBasis: number;
  /* The line 5 election not used yet. */
  electionLeft: number;
}

export interface PassLines {
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10a: number;
  line11a: number;
  line11b: number;
  line11c: number;
  line12: number;
  line13: number;
}

export const NO_PASS: PassLines = {
  line5: 0,
  line6: 0,
  line7: 0,
  line8: 0,
  line9: 0,
  line10a: 0,
  line11a: 0,
  line11b: 0,
  line11c: 0,
  line12: 0,
  line13: 0,
};

const credit = (amount: number) => EXCLUDED_DOLLARS_PER_CREDIT_DOLLAR * amountOrZero(amount);

/*
 * Line 3: "treat all real property held primarily for sale to customers ... as
 * if it were depreciable property" (irs-982-inst-2025::sec::line-3::b01), so with
 * Yes its basis joins the depreciable basis of lines 5 and 11a.
 */
export function attributesLeft(attributes: Attributes): AttributesLeft {
  const forSale = attributes.treatRealPropertyForSaleAsDepreciable
    ? attributes.realPropertyForSaleBasis
    : 0;
  return {
    netOperatingLoss: amountOrZero(attributes.netOperatingLoss),
    generalBusinessCredit: credit(attributes.generalBusinessCredit),
    minimumTaxCredit: credit(attributes.minimumTaxCredit),
    netCapitalLoss: amountOrZero(attributes.netCapitalLoss),
    passive:
      amountOrZero(attributes.passiveActivityLoss) + credit(attributes.passiveActivityCredit),
    foreignTaxCredit: credit(attributes.foreignTaxCredit),
    depreciableBasis: amountOrZero(attributes.depreciableBasis) + amountOrZero(forSale),
    electionLeft: amountOrZero(attributes.electedDepreciableBasisReduction),
  };
}

/* The attributes after a pass took its lines. */
function lessPass(left: AttributesLeft, pass: PassLines): AttributesLeft {
  return {
    netOperatingLoss: left.netOperatingLoss - pass.line6,
    generalBusinessCredit: left.generalBusinessCredit - pass.line7,
    minimumTaxCredit: left.minimumTaxCredit - pass.line8,
    netCapitalLoss: left.netCapitalLoss - pass.line9,
    passive: left.passive - pass.line12,
    foreignTaxCredit: left.foreignTaxCredit - pass.line13,
    depreciableBasis: left.depreciableBasis - pass.line5 - pass.line11a,
    electionLeft: left.electionLeft - pass.line5,
  };
}

/*
 * The first pass, for lines 1a and 1b: line 5 when elected, then "lines 6
 * through 13 (excluding line 10b)" (irs-982-inst-2025::sec::part-ii::b01), in
 * the order of how-to-complete-the-form::b04. Line 10a takes the basis of all
 * property not reduced on line 5 or line 10b, up to `basisLimit` (line-10a::b01).
 */
export function generalPass(
  amount: number,
  left: AttributesLeft,
  propertyBasis: number,
  basisLimit: (line5: number) => number,
): { lines: PassLines; left: AttributesLeft } {
  const line5 = Math.min(amountOrZero(amount), left.electionLeft, left.depreciableBasis);
  const basis10a = Math.min(amountOrZero(propertyBasis - line5), basisLimit(line5));
  const { taken } = applyInOrder(amount - line5, [
    left.netOperatingLoss,
    left.generalBusinessCredit,
    left.minimumTaxCredit,
    left.netCapitalLoss,
    basis10a,
    left.passive,
    left.foreignTaxCredit,
  ]);
  const [line6, line7, line8, line9, line10a, line12, line13] = taken;
  const lines = { ...NO_PASS, line5, line6, line7, line8, line9, line10a, line12, line13 };
  return { lines, left: lessPass(left, lines) };
}

/* The farm limit and the farm pass's basis lines read the qualified property. */
export interface QualifiedProperty {
  farmLand: number;
  /* Other property used in a business or for income, with property held for sale when line 3 is No. */
  other: number;
}

/*
 * Line 1c's limit: "the total of your (a) tax attributes (determined under
 * section 108(g)(3)(B)), and (b) basis of property used or held for use in a
 * trade or business or for the production of income" (irs-982-inst-2025::sec::line-1c::b02),
 * after the insolvency reductions (irs-pub-4681-2025::sec::qualified-farm-indebtedness::b02).
 * Credits count 3 times (qualified-farm-indebtedness::b03).
 */
export function farmLimit(left: AttributesLeft, property: QualifiedProperty): number {
  return (
    left.netOperatingLoss +
    left.generalBusinessCredit +
    left.minimumTaxCredit +
    left.netCapitalLoss +
    left.passive +
    left.foreignTaxCredit +
    left.depreciableBasis +
    amountOrZero(property.farmLand) +
    amountOrZero(property.other)
  );
}

/*
 * The farm pass: line 5 with the election left, "the tax attributes in the order
 * listed on lines 6 through 9. Any remaining amount will be applied to reduce
 * the tax attributes in the order listed on lines 11a through 13"
 * (irs-982-inst-2025::sec::line-1c::b02).
 */
export function farmPass(
  amount: number,
  left: AttributesLeft,
  property: QualifiedProperty,
): { lines: PassLines; left: AttributesLeft } {
  const line5 = Math.min(amountOrZero(amount), left.electionLeft, left.depreciableBasis);
  const { taken } = applyInOrder(amount - line5, [
    left.netOperatingLoss,
    left.generalBusinessCredit,
    left.minimumTaxCredit,
    left.netCapitalLoss,
    left.depreciableBasis - line5,
    property.farmLand,
    property.other,
    left.passive,
    left.foreignTaxCredit,
  ]);
  const [line6, line7, line8, line9, line11a, line11b, line11c, line12, line13] = taken;
  const lines = {
    ...NO_PASS,
    ...{ line5, line6, line7, line8, line9, line11a, line11b, line11c, line12, line13 },
  };
  return { lines, left: lessPass(left, lines) };
}

/* Two passes, line by line. */
export function addPasses(first: PassLines, second: PassLines): PassLines {
  const total = { ...NO_PASS };
  for (const key of Object.keys(NO_PASS) as Array<keyof PassLines>) {
    total[key] = first[key] + second[key];
  }
  return total;
}
