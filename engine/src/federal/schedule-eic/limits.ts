/*
 * irs-1040-inst-2025::sec::all-filers::b01 (Step 1, question 1): line 11b must
 * be under these amounts, by the number of children with valid SSNs who lived
 * with the taxpayer (0, 1, 2, 3 or more). Step 5 holds earned income to the
 * same amounts (irs-1040-inst-2025::sec::no-continue-7::b01).
 */
export const EIC_INCOME_LIMITS = {
  other: [19104, 50434, 57310, 61555],
  joint: [26214, 57554, 64430, 68675],
} as const;

export function eicIncomeLimit(children: number, joint: boolean): number {
  const limits = joint ? EIC_INCOME_LIMITS.joint : EIC_INCOME_LIMITS.other;
  return limits[Math.min(children, 3)]!;
}
