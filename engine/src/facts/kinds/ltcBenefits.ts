/*
 * Long-term care benefits: Form 1099-LTC (one fact per form) and the answers
 * Form 8853 Section C needs for the insured's LTC period.
 * Box meanings: irs-8853-inst-2025::sec::per-diem-payments::b01 (box 3),
 * line-19::b01 (box 2), and the Form 1099-LTC itself (boxes 1, 4, 5).
 */

type FactRow = { key: string; value: unknown; category: string };

export interface LtcBenefitsFactValue {
  payerName: string;
  payerTin?: string;
  /* Whose 1099-LTC on a joint return (the policyholder); absent means the taxpayer's. */
  owner?: "taxpayer" | "spouse";
  insuredName: string;
  insuredSsn: string;
  box1: number; // Gross long-term care benefits paid
  box2?: number; // Accelerated death benefits paid
  box3: "per_diem" | "reimbursed"; // Check one: per diem or reimbursed amount
  box4?: boolean; // Qualified contract
  box5?: "chronically_ill" | "terminally_ill"; // Insured is chronically ill / terminally ill
  box5DateCertified?: string;
}

export interface LtcBenefitsFact {
  key: string;
  value: LtcBenefitsFactValue;
}

const LTC_CATEGORY = "medical";
const LTC_KEY_MIDDLE = "ltc_benefits";

/* A payer can send more than one 1099-LTC (one per insured), so the key carries a form id. */
export function makeLtcBenefitsFactKey(payerSlug: string, formId: string): string {
  return `account.${payerSlug}.${LTC_KEY_MIDDLE}.${formId}`;
}

export function isLtcBenefitsFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "account" && parts[2] === LTC_KEY_MIDDLE;
}

export function getLtcBenefitsFacts(facts: ReadonlyArray<FactRow>): LtcBenefitsFact[] {
  return facts
    .filter((fact) => fact.category === LTC_CATEGORY && isLtcBenefitsFactKey(fact.key))
    .map((fact) => ({ key: fact.key, value: fact.value as LtcBenefitsFactValue }));
}

/* The insured's answers for Section C (one insured, one LTC period). */
export const LTC_KEYS = {
  /* Line 15: did anyone else receive per diem payments or accelerated death benefits for the insured? */
  otherPayees: "medical.ltc.other_payees",
  /* Line 16, when no 1099-LTC box 5 settles it: was the insured terminally ill? */
  insuredTerminallyIll: "medical.ltc.insured_terminally_ill",
  /* Line 21: the number of days in the LTC period (irs-8853-inst-2025::sec::line-21::b01). */
  periodDays: "medical.ltc.period_days",
  /* Line 22: costs incurred for qualified LTC services for the insured during the period. */
  qualifiedServicesCosts: "medical.ltc.qualified_services_costs",
  /* Line 24: reimbursements received or expected for those services (irs-8853-inst-2025::sec::line-24::b01). */
  reimbursements: "medical.ltc.reimbursements",
} as const;
