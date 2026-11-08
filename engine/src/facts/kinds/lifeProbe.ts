/*
 * The life probe: yes/no answers about the taxpayer's year, asked in plain
 * words before any form line ("do you own your home?"). A yes opens a branch
 * of the deductions catalog and its questions; a no closes it, so a renter is
 * never asked about mortgage interest. No form reads these: only the
 * deductions module (engine/src/deductions/).
 */
export const LIFE_KEYS = {
  ownsHome: "life.owns_home",
  caVehicle: "life.ca_vehicle",
  gaveMoney: "life.gave_money",
  gaveThings: "life.gave_things",
  bigMedicalYear: "life.big_medical_year",
  marginLoan: "life.margin_loan",
  investmentAdvisor: "life.investment_advisor",
} as const;
