/* Form 540 signing block: the taxpayer's email and phone. */

import type { Form540Line } from "./form540Binding.js";

export const signingTaxpayerEmail: Form540Line<"signing.taxpayer_email"> = (_, info) =>
  info.taxpayerEmail;
export const signingTaxpayerPhone: Form540Line<"signing.taxpayer_phone"> = (_, info) =>
  info.taxpayerPhone;
