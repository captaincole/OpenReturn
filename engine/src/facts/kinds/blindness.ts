/*
 * Visual impairment, as the taxpayer states it (CA 540 line 8; 1040 line 12d).
 * "Visually impaired means not capable of seeing better than 20/200 while wearing
 * glasses or contact lenses, or if your field of vision is not more than 20
 * degrees" (ca-540-inst-2025::sec::line-8-blind-exemptions::b01). A boolean, in
 * category identity; Cade records it when the person is visually impaired.
 */

export const BLINDNESS_KEYS = {
  taxpayer: "identity.blind",
  spouse: "identity.spouse.blind",
} as const;
