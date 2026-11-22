/* Form 1040 Sign Here: the taxpayer's occupation, phone and email. */

import type { Form1040FilingInfo } from "./filingInfo.js";

export const signingTaxpayerOccupation = (_: unknown, info: Form1040FilingInfo) =>
  info.taxpayerOccupation;

export const signingTaxpayerPhone = (_: unknown, info: Form1040FilingInfo) => info.taxpayerPhone;

export const signingTaxpayerEmail = (_: unknown, info: Form1040FilingInfo) => info.taxpayerEmail;
