/*
 * Schedule K-1 (Form 1041): every box and code the 2025 Instructions for a
 * Beneficiary describe, and its item type. The comment over each row is the
 * corpus block that describes it, after "irs-1041k1-inst-2025::sec::". The
 * instructions do not describe every code that page 2 of the K-1 lists (box 13
 * codes F, G, I, K, M, N, P, Q; box 14 codes A, B, E, G): those map to
 * not_modeled until the K-1 itself is in the corpus (QUESTIONS.md). The same
 * box number means something else here: box 1 is interest, not business income.
 */

import { coded, plain, type BoxTable, type StatementBox } from "./boxTable.js";

/* Box 14 code I carries the section 199A statement (box-14-other-information::b03). */
export const TRUST_STATEMENT_BOX: StatementBox = { box: "14", code: "I" };

const INCOME: BoxTable = [
  // box-1-interest-income::b01
  plain("1", "interest", "Interest income"),
  // box-2a-ordinary-dividends::b01
  plain("2a", "ordinary_dividends", "Ordinary dividends"),
  // box-2b-qualified-dividends::b01
  plain("2b", "qualified_dividends", "Qualified dividends"),
  // boxes-3-and-4a-net-short-term-and-net::b01
  plain("3", "net_short_term_capital_gain", "Net short-term capital gain"),
  // boxes-3-and-4a-net-short-term-and-net::b01
  plain("4a", "net_long_term_capital_gain", "Net long-term capital gain"),
  // boxes-4b-and-4c-28-rate-gain-and::b01
  plain("4b", "collectibles_gain", "28% rate gain"),
  // boxes-4b-and-4c-28-rate-gain-and::b01
  plain("4c", "unrecaptured_section_1250_gain", "Unrecaptured section 1250 gain"),
  // box-5-other-portfolio-and-nonbusiness-income::b01
  plain("5", "other_portfolio_income", "Other portfolio and nonbusiness income"),
  // box-5-other-portfolio-and-nonbusiness-income::b01 ("Boxes 6 Through 8")
  plain("6", "ordinary_business_income", "Ordinary business income"),
  // box-5-other-portfolio-and-nonbusiness-income::b01
  plain("7", "net_rental_real_estate_income", "Net rental real estate income"),
  // box-5-other-portfolio-and-nonbusiness-income::b01
  plain("8", "other_net_rental_income", "Other rental income"),
];

/*
 * Box 9 (box-9-directly-apportioned-deductions::b01): depreciation, depletion
 * and amortization. The instructions do not say which code is which, so the
 * rows carry no detail (QUESTIONS.md).
 */
const apportioned = (code: string) =>
  coded(
    "9",
    code,
    "directly_apportioned_deduction",
    `Directly apportioned deduction (code ${code})`,
  );

const DEDUCTIONS: BoxTable = [
  // box-9-directly-apportioned-deductions::b01
  apportioned("A"),
  // box-9-directly-apportioned-deductions::b01
  apportioned("B"),
  // box-9-directly-apportioned-deductions::b01
  apportioned("C"),
  // box-10-estate-tax-deduction-including-certain::b01
  plain("10", "estate_tax_deduction", "Estate tax deduction"),
  // box-11-code-a-excess-deductions-on::b01
  coded(
    "11",
    "A",
    "termination_deduction",
    "Excess deductions on termination—section 67(e) expenses",
    "section_67e",
  ),
  // box-11-code-b-excess-deductions-on::b01
  coded(
    "11",
    "B",
    "termination_deduction",
    "Excess deductions on termination—non-miscellaneous itemized deductions",
    "itemized",
  ),
  // box-11-codes-c-and-d-unused-capital-loss::b01
  coded("11", "C", "capital_loss_carryover", "Short-term capital loss carryover", "short_term"),
  // box-11-codes-c-and-d-unused-capital-loss::b01
  coded("11", "D", "capital_loss_carryover", "Long-term capital loss carryover", "long_term"),
  // box-11-codes-e-and-f-nol-carryover::b01
  coded("11", "E", "net_operating_loss_carryover", "Net operating loss carryover", "regular"),
  // box-11-codes-e-and-f-nol-carryover::b01
  coded("11", "F", "net_operating_loss_carryover", "Alternative tax NOL carryover", "amt"),
];

/* Box 12 (box-12-alternative-minimum-tax-items::b01): code A is the total; B to F are part of it. */
const amt = (code: string, label: string, detail: string) =>
  coded("12", code, "amt_item", label, detail);

const BOX_12: BoxTable = [
  // box-12-alternative-minimum-tax-items::b01
  amt("A", "Adjustment for minimum tax purposes", "adjustment_total"),
  // box-12-alternative-minimum-tax-items::b01
  amt("B", "AMT item included in code A", "part_of_code_a"),
  // box-12-alternative-minimum-tax-items::b01
  amt("C", "AMT item included in code A", "part_of_code_a"),
  // box-12-alternative-minimum-tax-items::b01
  amt("D", "AMT item included in code A", "part_of_code_a"),
  // box-12-alternative-minimum-tax-items::b01
  amt("E", "AMT item included in code A", "part_of_code_a"),
  // box-12-alternative-minimum-tax-items::b01
  amt("F", "AMT item included in code A", "part_of_code_a"),
  // box-12-alternative-minimum-tax-items::b01
  amt("G", "AMT item for its own Form 6251 line", "own_line"),
  // box-12-alternative-minimum-tax-items::b01
  amt("H", "AMT item for its own Form 6251 line", "own_line"),
  // box-12-alternative-minimum-tax-items::b01
  amt("I", "AMT item for its own Form 6251 line", "own_line"),
  // box-12-alternative-minimum-tax-items::b01
  amt("J", "Exclusion items", "exclusion_items"),
];

const credit = (code: string, label: string, detail: string) =>
  coded("13", code, "credit", label, detail);

const BOX_13: BoxTable = [
  // box-13-credits-and-credit-recapture::b01
  coded("13", "A", "estimated_tax_payment", "Credit for estimated taxes"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b01
  coded("13", "B", "backup_withholding", "Credit for backup withholding"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b01
  credit("C", "Low-income housing credit", "low_income_housing"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b01
  credit("D", "Advanced manufacturing production credit", "advanced_manufacturing_production"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b01
  credit("E", "Clean electricity production credit", "clean_electricity_production"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b01
  credit("H", "Biofuel producer credit", "biofuel_producer"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b02
  credit("J", "Renewable electricity production credit", "renewable_electricity_production"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b02
  credit("L", "Clean fuel production credit", "clean_fuel_production"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b02
  credit("O", "Biodiesel, renewable diesel, or sustainable aviation fuels credit", "biodiesel"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b03
  coded("13", "R", "credit_recapture", "Recapture of credits", "credits"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b03
  credit("S", "Credit for production from advanced nuclear power facilities", "advanced_nuclear"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b03
  credit("T", "Zero-emission nuclear power production credit", "zero_emission_nuclear"),
  // note-form-1041-t-allocation-of-estimated-tax-payments-to::b03
  credit("ZZ", "Other credits", "other"),
];

const info = (code: string, label: string, detail: string) =>
  coded("14", code, "other_information", label, detail);

const BOX_14: BoxTable = [
  // box-14-other-information::b01
  info("C", "Qualified rehabilitation expenditures", "qre"),
  // box-14-other-information::b02
  info("D", "Basis of energy property", "energy_property_basis"),
  // box-14-other-information::b02
  coded("14", "F", "gross_farming_fishing_income", "Gross farming and fishing income"),
  // box-14-other-information::b03
  coded("14", "H", "net_investment_income", "Net investment income tax"),
  // box-14-other-information::b03
  coded("14", "I", "section_199a_information", "Section 199A information"),
  // box-14-other-information::b06
  info("J", "Qualifying advanced coal and gasification project property", "coal_property"),
  // box-14-other-information::b07
  info("K", "Qualifying advanced energy project property", "advanced_energy_property"),
  // box-14-other-information::b07
  info("L", "Advanced manufacturing investment property", "manufacturing_property"),
  // box-14-other-information::b07
  info("M", "Clean electricity investment credit", "clean_electricity_property"),
  // box-14-other-information::b08
  info("ZZ", "Other information", "other"),
];

export const TRUST_BOXES: BoxTable = [...INCOME, ...DEDUCTIONS, ...BOX_12, ...BOX_13, ...BOX_14];
