/* Schedule 1 Part II answers: adjustments to income a taxpayer states, each a number unless noted. */

export const ADJUSTMENT_KEYS = {
  /* Line 16: the deductible self-employed SEP, SIMPLE and qualified plan contributions (the Pub. 560 worksheet). */
  selfEmployedPlanDeduction: "adjustments.self_employed_plan_deduction",
  /* Line 19a: alimony paid. */
  alimonyPaid: "adjustments.alimony_paid",
  /* Line 19b: the recipient's SSN (text). */
  alimonyRecipientSsn: "adjustments.alimony_recipient_ssn",
  /* Line 19c: the date of the original divorce or separation agreement, YYYY-MM-DD. */
  alimonyPaidAgreementDate: "adjustments.alimony_paid_agreement_date",
  /* A pre-2019 agreement changed after 2018 to say alimony is not income to the recipient (boolean). */
  alimonyPaidAgreementExcludes: "adjustments.alimony_paid_agreement_excludes",
  /* Line 24a: jury duty pay given to the employer, because the employer paid the salary. */
  juryDutyPayToEmployer: "adjustments.jury_duty_pay_to_employer",
  /* Line 24d: reforestation amortization and expenses. */
  reforestation: "adjustments.reforestation",
  /* Line 24e: repayment of supplemental unemployment benefits under the Trade Act of 1974. */
  tradeActBenefitRepayment: "adjustments.trade_act_benefit_repayment",
  /* Line 24h: attorney fees and court costs for unlawful discrimination claims, up to the gross income from them. */
  discriminationClaimFees: "adjustments.discrimination_claim_fees",
  /* Line 24i: attorney fees and court costs for an IRS whistleblower award, up to the award in gross income. */
  whistleblowerAwardFees: "adjustments.whistleblower_award_fees",
} as const;

/* Lines 2b and 19c: an agreement entered into on or before December 31, 2018 (an ISO date sorts as text). */
export const LAST_PRE_2019_AGREEMENT_DATE = "2018-12-31";
