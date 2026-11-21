import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { Form8853 } from "./types.js";

/* Each line's value, unsupported(reason) for a case the engine does not handle, or absent (blank). */
export type Form8853Lines = { [K in keyof Form8853]?: Form8853[K] | Unsupported };

export interface Form8853FilingInfo extends BaseFilingInfo {
  /* Every line, figured by the resolver from the facts (resolveInfo.ts). */
  form8853Lines?: Form8853Lines;
  /* The lines other forms take that apply to this return; one left blank waits for an answer. */
  form8853Expected?: ReadonlyArray<keyof Form8853>;
  /* Whose SSN heads page 1: the MSA account holder, the taxpayer when both spouses have one. */
  form8853MsaHolder?: "taxpayer" | "spouse";
  /* Whose name and SSN head Section C: the policyholder on the 1099-LTC. */
  form8853Policyholder?: "taxpayer" | "spouse";
  /* Every MSA account holder on the return (Sections A and B), each once. */
  form8853MsaHolders?: ReadonlyArray<"taxpayer" | "spouse">;
  /* The part of line 8 subject to the additional tax (line 9b over 20%), for FTB 3805P line 10b. */
  form8853ArcherSubjectToTax?: number;
}
