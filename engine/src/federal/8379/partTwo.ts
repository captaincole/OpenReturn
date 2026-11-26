/*
 * Part II: "Enter the following information exactly as it is shown on the tax
 * return for which you are filing this form. The spouse's name and social
 * security number shown first on that tax return must also be shown first
 * below" (irs-8379-face-2025::sec::face-part-ii::b01). The taxpayer is shown
 * first on the joint return, the spouse second.
 */

import type { SSN } from "../../values.js";
import type { Form8379FilingInfo } from "./filingInfo.js";

export type Position = "first" | "second";

/* "First name, initial, and last name". */
function fullName(first?: string, initial?: string, last?: string): string | undefined {
  if (!first || !last) return undefined;
  return initial ? `${first} ${initial} ${last}` : `${first} ${last}`;
}

const joint = (info: Form8379FilingInfo): boolean => info.filingStatus === "married_filing_jointly";

export function nameShown(info: Form8379FilingInfo, position: Position): string | undefined {
  if (position === "first") {
    return fullName(info.taxpayerFirstName, info.taxpayerMiddleInitial, info.taxpayerLastName);
  }
  if (!joint(info)) return undefined;
  return fullName(info.spouseFirstName, info.spouseMiddleInitial, info.spouseLastName);
}

export function ssnShown(info: Form8379FilingInfo, position: Position): SSN | undefined {
  if (position === "first") return info.taxpayerSSN;
  return joint(info) ? info.spouseSSN : undefined;
}

/* "If injured spouse, check here": the box next to the injured spouse's name. */
export function injuredBox(info: Form8379FilingInfo, position: Position): boolean | undefined {
  const fact = info.form8379?.fact;
  if (fact === undefined) return undefined;
  return fact.injuredSpouse === (position === "first" ? "taxpayer" : "spouse");
}

/* Line 11: "Check this box only if you want your refund issued in both names." */
export const refundInBothNames = (info: Form8379FilingInfo): boolean | undefined =>
  info.form8379?.fact?.refundInBothNames;

/* Line 12: a mailing address for the injured spouse's refund other than the joint return's. */
export function differentAddress(info: Form8379FilingInfo, yes: boolean): boolean | undefined {
  const fact = info.form8379?.fact;
  if (fact === undefined) return undefined;
  return (fact.refundMailingAddress !== undefined) === yes;
}

export const mailingAddress = (info: Form8379FilingInfo): string | undefined =>
  info.form8379?.fact?.refundMailingAddress;
