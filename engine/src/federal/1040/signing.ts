/* Form 1040 Sign Here: the occupations, the taxpayer's phone and email. */

import type { Form1040FilingInfo } from "./filingInfo.js";

export const signingTaxpayerOccupation = (_: unknown, info: Form1040FilingInfo) =>
  info.taxpayerOccupation;

/*
 * MANUAL EDIT: "If you are filing a joint return, your spouse must also sign
 * ... enter your occupation(s)" (irs-1040-inst-2025::sec::sign-your-return::b01).
 * Only a joint return has the spouse's signature line.
 */
export const signingSpouseOccupation = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_jointly" ? info.spouseOccupation : undefined;

export const signingTaxpayerPhone = (_: unknown, info: Form1040FilingInfo) => info.taxpayerPhone;

export const signingTaxpayerEmail = (_: unknown, info: Form1040FilingInfo) => info.taxpayerEmail;
