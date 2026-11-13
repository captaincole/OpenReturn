/*
 * A taxpayer who was an independent contractor federally (Schedule C) but an
 * employee for California. The taxpayer states the totals from all such
 * businesses; Schedule CA (540) moves them (line 1a column C, line 3 columns B
 * and C, lines 15 and 17 column B). Each is a number unless noted.
 */

export const CA_EMPLOYEE_CLASSIFICATION_KEYS = {
  /* Classified as an employee for California for work reported on Schedule C (boolean). */
  classifiedAsEmployee: "ca_employee_classification.classified_as_employee",
  /* The gross income of those businesses (Schedule C line 7). */
  grossIncome: "ca_employee_classification.gross_income",
  /* Their total net profit. */
  netProfit: "ca_employee_classification.net_profit",
  /* Their total net loss, a positive number. */
  netLoss: "ca_employee_classification.net_loss",
  /* The deductible part of self-employment tax on them (Schedule 1 line 15). */
  selfEmploymentTaxDeduction: "ca_employee_classification.self_employment_tax_deduction",
  /* The self-employed health insurance deduction for them (Schedule 1 line 17). */
  selfEmployedHealthInsurance: "ca_employee_classification.self_employed_health_insurance",
} as const;
