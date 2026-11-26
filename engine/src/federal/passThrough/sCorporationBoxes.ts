/*
 * Schedule K-1 (Form 1120-S): every box and code the 2025 Shareholder's
 * Instructions describe, and its item type. The comment over each row is the
 * corpus block that describes it, after "irs-1120sk1-inst-2025::sec::". Codes
 * the List of Codes marks "Reserved for future use" are not listed; rowFor
 * maps them to not_modeled. Boxes 14, 18 and 19 are checkboxes: they are
 * header answers of the fact (scheduleK1.ts), not items.
 */

import { coded, plain, type BoxTable, type StatementBox } from "./boxTable.js";

/* Box 17 code V carries the section 199A statement (box-17-other-information::b11). */
export const S_CORPORATION_STATEMENT_BOX: StatementBox = { box: "17", code: "V" };

const INCOME: BoxTable = [
  // income-loss::b01
  plain("1", "ordinary_business_income", "Ordinary business income (loss)"),
  // box-2-net-rental-real-estate-income-loss::b01
  plain("2", "net_rental_real_estate_income", "Net rental real estate income (loss)"),
  // box-3-other-net-rental-income-loss::b01
  plain("3", "other_net_rental_income", "Other net rental income (loss)"),
  // box-4-interest-income::b01
  plain("4", "interest", "Interest income"),
  // box-5a-ordinary-dividends::b01
  plain("5a", "ordinary_dividends", "Ordinary dividends"),
  // box-5b-qualified-dividends::b01
  plain("5b", "qualified_dividends", "Qualified dividends"),
  // box-6-royalties::b01
  plain("6", "royalties", "Royalties"),
  // box-7-net-short-term-capital-gain-loss::b01
  plain("7", "net_short_term_capital_gain", "Net short-term capital gain (loss)"),
  // box-8a-net-long-term-capital-gain-loss::b01
  plain("8a", "net_long_term_capital_gain", "Net long-term capital gain (loss)"),
  // box-8b-collectibles-28-gain-loss::b01
  plain("8b", "collectibles_gain", "Collectibles (28%) gain (loss)"),
  // box-8c-unrecaptured-section-1250-gain::b01
  plain("8c", "unrecaptured_section_1250_gain", "Unrecaptured section 1250 gain"),
  // box-9-net-section-1231-gain-loss::b01
  plain("9", "net_section_1231_gain", "Net section 1231 gain (loss)"),
];

const BOX_10: BoxTable = [
  // box-10-other-income-loss::b01
  coded("10", "A", "other_portfolio_income", "Other portfolio income (loss)"),
  // box-10-other-income-loss::b01
  coded("10", "B", "other_income", "Involuntary conversions", "involuntary_conversions"),
  // box-10-other-income-loss::b02
  coded(
    "10",
    "C",
    "other_income",
    "Section 1256 contracts and straddles",
    "section_1256_contracts",
  ),
  // box-10-other-income-loss::b02
  coded("10", "D", "other_income", "Mining exploration costs recapture", "mining_recapture"),
  // box-10-other-income-loss::b02
  coded("10", "E", "other_income", "Section 951A(a) income inclusions", "section_951a_inclusion"),
  // box-10-other-income-loss::b03
  coded("10", "F", "other_income", "Inclusions of subpart F income", "subpart_f_inclusion"),
  // box-10-other-income-loss::b03
  coded("10", "G", "other_income", "Section 951(a)(1)(B) inclusions", "section_951a1b_inclusion"),
  // box-10-other-income-loss::b04
  coded(
    "10",
    "I",
    "other_income",
    "Gain (loss) from disposition of oil, gas, geothermal, or other mineral properties",
    "mineral_property_disposition",
  ),
  // box-10-other-income-loss::b04
  coded("10", "J", "other_income", "Recoveries of tax benefit items", "tax_benefit_recoveries"),
  // box-10-other-income-loss::b05
  coded("10", "K", "other_income", "Gambling gains and losses", "gambling"),
  // box-10-other-income-loss::b06
  coded(
    "10",
    "M",
    "other_income",
    "Gain eligible for section 1045 rollover (replacement stock purchased by the corporation)",
    "section_1045_gain_stock_purchased",
  ),
  // box-10-other-income-loss::b07
  coded(
    "10",
    "N",
    "other_income",
    "Gain eligible for section 1045 rollover (replacement stock not purchased by the corporation)",
    "section_1045_gain_stock_not_purchased",
  ),
  // box-10-other-income-loss::b08
  coded(
    "10",
    "O",
    "other_income",
    "Sale or exchange of QSB stock with section 1202 exclusion",
    "section_1202_gain",
  ),
  // box-10-other-income-loss::b09
  coded(
    "10",
    "S",
    "other_income",
    "Non-portfolio capital gain (loss)",
    "non_portfolio_capital_gain",
  ),
  // box-10-other-income-loss::b09
  coded("10", "ZZ", "other_income", "Other income (loss)", "other"),
];

const DEDUCTIONS: BoxTable = [
  // box-11-section-179-deduction::b01
  plain("11", "section_179_deduction", "Section 179 deduction"),
  // box-12-other-deductions::b06
  coded("12", "A", "charitable_contribution", "Cash contributions (60%)", "cash_60"),
  // box-12-other-deductions::b06
  coded("12", "B", "charitable_contribution", "Cash contributions (30%)", "cash_30"),
  // box-12-other-deductions::b06
  coded("12", "C", "charitable_contribution", "Noncash contributions (50%)", "noncash_50"),
  // box-12-other-deductions::b07
  coded("12", "D", "charitable_contribution", "Noncash contributions (30%)", "noncash_30"),
  // box-12-other-deductions::b08
  coded(
    "12",
    "E",
    "charitable_contribution",
    "Capital gain property to a 50% limit organization (30%)",
    "capital_gain_property_30",
  ),
  // box-12-other-deductions::b08
  coded(
    "12",
    "F",
    "charitable_contribution",
    "Capital gain property (20%)",
    "capital_gain_property_20",
  ),
  // box-12-other-deductions::b08
  coded("12", "G", "charitable_contribution", "Contributions (100%)", "contributions_100"),
  // box-12-other-deductions::b08
  coded("12", "H", "investment_interest_expense", "Investment interest expense"),
  // box-12-other-deductions::b09
  coded("12", "I", "portfolio_deduction", "Deductions—royalty income", "royalty_deductions"),
  // box-12-other-deductions::b09
  coded("12", "J", "other_deduction", "Section 59(e)(2) expenditures", "section_59e_expenditures"),
  // box-12-other-deductions::b11
  coded("12", "L", "portfolio_deduction", "Deductions—portfolio income (other)", "portfolio_other"),
  // box-12-other-deductions::b11
  coded("12", "M", "other_deduction", "Preproductive period expenses", "preproductive_expenses"),
  // box-12-other-deductions::b11
  coded("12", "O", "other_deduction", "Reforestation expense deduction", "reforestation"),
  // box-12-other-deductions::b12
  coded("12", "W", "other_deduction", "Soil and water conservation", "soil_and_water_conservation"),
  // box-12-other-deductions::b12
  coded(
    "12",
    "X",
    "other_deduction",
    "Film, television, theatrical, and qualified sound recording production expenditures",
    "film_and_television_production",
  ),
  // box-12-other-deductions::b14
  coded(
    "12",
    "Y",
    "other_deduction",
    "Expenditures for removal of barriers",
    "removal_of_barriers",
  ),
  // box-12-other-deductions::b14
  coded("12", "Z", "other_deduction", "Itemized deductions", "itemized_deductions"),
  // box-12-other-deductions::b14
  coded(
    "12",
    "AA",
    "other_deduction",
    "Contributions to a capital construction fund (CCF)",
    "capital_construction_fund",
  ),
  // box-12-other-deductions::b14
  coded(
    "12",
    "AB",
    "other_deduction",
    "Penalty on early withdrawal of savings",
    "early_withdrawal_penalty",
  ),
  // box-12-other-deductions::b14
  coded(
    "12",
    "AC",
    "other_deduction",
    "Interest expense allocated to debt-financed distributions",
    "debt_financed_distribution_interest",
  ),
  // box-12-other-deductions::b15
  coded("12", "ZZ", "other_deduction", "Other deductions", "other"),
];

/*
 * Box 13: each credit; the detail names it. A general business credit goes to
 * Form 3800 (business_credit); code H (Schedule 3 line 13a), the bond credits
 * (Form 8912) and code ZZ are other credits, which have no route yet.
 */
const credit = (code: string, label: string, detail: string) =>
  coded("13", code, "business_credit", label, detail);
const otherCredit = (code: string, label: string, detail: string) =>
  coded("13", code, "credit", label, detail);

const BOX_13: BoxTable = [
  // box-13-credits::b01
  credit("A", "Zero-emission nuclear power production credit", "zero_emission_nuclear"),
  // box-13-credits::b02
  credit("B", "Credit for production from advanced nuclear power facilities", "advanced_nuclear"),
  // box-13-credits::b02
  credit("C", "Low-income housing credit (section 42(j)(5))", "low_income_housing_42j5"),
  // box-13-credits::b02
  credit("D", "Low-income housing credit (other)", "low_income_housing_other"),
  // box-13-credits::b02
  credit(
    "E",
    "Qualified rehabilitation expenditures (rental real estate)",
    "rehabilitation_rental",
  ),
  // box-13-credits::b03
  credit("F", "Other rental real estate credits", "other_rental_real_estate"),
  // box-13-credits::b04
  credit("G", "Other rental credits", "other_rental"),
  // box-13-credits::b05
  otherCredit("H", "Undistributed capital gains credit", "undistributed_capital_gains"),
  // box-13-credits::b05
  credit("I", "Biofuel producer credit", "biofuel_producer"),
  // box-13-credits::b05
  credit("J", "Work opportunity credit", "work_opportunity"),
  // box-13-credits::b05
  credit("K", "Disabled access credit", "disabled_access"),
  // box-13-credits::b05
  credit("L", "Empowerment zone employment credit", "empowerment_zone"),
  // box-13-credits::b05
  credit("M", "Credit for increasing research activities", "research"),
  // box-13-credits::b06
  credit(
    "N",
    "Credit for employer social security and Medicare taxes",
    "employer_social_security_on_tips",
  ),
  // box-13-credits::b06
  coded("13", "O", "backup_withholding", "Backup withholding"),
  // box-13-credits::b07
  credit("P", "Unused investment credit: advanced coal or gasification project", "unused_coal"),
  // box-13-credits::b07
  credit("Q", "Unused investment credit: advanced energy project", "unused_advanced_energy"),
  // box-13-credits::b07
  credit(
    "R",
    "Unused investment credit: advanced manufacturing investment",
    "unused_manufacturing",
  ),
  // box-13-credits::b07
  credit("S", "Unused investment credit: clean electricity", "unused_clean_electricity"),
  // box-13-credits::b07
  credit("T", "Unused investment credit: energy credit", "unused_energy"),
  // box-13-credits::b07
  credit("U", "Unused investment credit: rehabilitation credit", "unused_rehabilitation"),
  // box-13-credits::b07
  credit("V", "Advanced manufacturing production credit", "advanced_manufacturing_production"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("W", "Clean electricity production credit", "clean_electricity_production"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("X", "Clean fuel production credit", "clean_fuel_production"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("Y", "Clean hydrogen production credit", "clean_hydrogen_production"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("Z", "Orphan drug credit", "orphan_drug"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("AA", "Enhanced oil recovery credit", "enhanced_oil_recovery"),
  // report-on-form-7207-advanced-manufacturing::b01
  credit("AB", "Renewable electricity production credit", "renewable_electricity_production"),
  // report-on-form-7207-advanced-manufacturing::b02
  credit("AC", "Biodiesel, renewable diesel, or sustainable aviation fuels credit", "biodiesel"),
  // report-on-form-7207-advanced-manufacturing::b02
  credit("AD", "New markets credit", "new_markets"),
  // report-on-form-7207-advanced-manufacturing::b02
  credit("AE", "Credit for small employer pension plan startup costs", "pension_startup"),
  // report-on-form-7207-advanced-manufacturing::b02
  credit("AF", "Credit for small employer auto-enrollment", "auto_enrollment"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AG", "Credit for military spouse participation", "military_spouse_participation"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AH", "Credit for employer-provided childcare facilities and services", "childcare"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AI", "Low sulfur diesel fuel production credit", "low_sulfur_diesel"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AJ", "Qualified railroad track maintenance credit", "railroad_track_maintenance"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AK", "Credit for oil and gas production from marginal wells", "marginal_wells"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AL", "Distilled spirits credit", "distilled_spirits"),
  // report-on-form-7207-advanced-manufacturing::b03
  credit("AM", "Energy efficient home credit", "energy_efficient_home"),
  // report-on-form-7207-advanced-manufacturing::b04
  credit("AO", "Alternative fuel vehicle refueling property credit", "refueling_property"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AP", "Clean renewable energy bond credit", "clean_renewable_energy_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AQ", "New clean renewable energy bond credit", "new_clean_renewable_energy_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AR", "Qualified energy conservation bond credit", "energy_conservation_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AS", "Qualified zone academy bond credit", "zone_academy_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AT", "Qualified school construction bond credit", "school_construction_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  otherCredit("AU", "Build America bond credit", "build_america_bond"),
  // report-on-form-7207-advanced-manufacturing::b04
  credit("AV", "Credit for employer differential wage payments", "differential_wage"),
  // report-on-form-7207-advanced-manufacturing::b04
  credit("AW", "Carbon oxide sequestration credit", "carbon_oxide_sequestration"),
  // report-on-form-7207-advanced-manufacturing::b04
  coded(
    "13",
    "AX",
    "credit_recapture",
    "Carbon oxide sequestration credit recapture",
    "carbon_oxide_sequestration",
  ),
  // report-on-form-7207-advanced-manufacturing::b05
  credit("AY", "New clean vehicle credit", "new_clean_vehicle"),
  // report-on-form-7207-advanced-manufacturing::b05
  credit("AZ", "Qualified commercial clean vehicle credit", "commercial_clean_vehicle"),
  // report-on-form-7207-advanced-manufacturing::b05
  credit("BA", "Credit for small employer health insurance premiums", "small_employer_health"),
  // report-on-form-7207-advanced-manufacturing::b05
  credit("BB", "Employer credit for paid family and medical leave", "paid_family_leave"),
  // report-on-form-7207-advanced-manufacturing::b05
  credit("BC", "Eligible credits from transferor(s) under section 6418", "transferred_credits"),
  // report-on-form-7207-advanced-manufacturing::b06
  otherCredit("ZZ", "Other credits", "other"),
];

/* Box 15: each AMT item; the detail names its Form 6251 use. */
const amt = (code: string, label: string, detail: string) =>
  coded("15", code, "amt_item", label, detail);

const BOXES_15_AND_16: BoxTable = [
  // box-15-alternative-minimum-tax-amt-items::b02
  amt("A", "Post-1986 depreciation adjustment", "post_1986_depreciation"),
  // box-15-alternative-minimum-tax-amt-items::b02
  amt("B", "Adjusted gain or loss", "adjusted_gain_or_loss"),
  // box-15-alternative-minimum-tax-amt-items::b02
  amt("C", "Depletion (other than oil & gas)", "depletion"),
  // box-15-alternative-minimum-tax-amt-items::b02
  amt("D", "Oil, gas, & geothermal—gross income", "oil_gas_geothermal_gross_income"),
  // box-15-alternative-minimum-tax-amt-items::b02
  amt("E", "Oil, gas, & geothermal—deductions", "oil_gas_geothermal_deductions"),
  // box-15-alternative-minimum-tax-amt-items::b03
  amt("F", "Other AMT items", "other"),
  // box-16-items-affecting-shareholder-basis::b01
  coded("16", "A", "tax_exempt_interest", "Tax-exempt interest income"),
  // box-16-items-affecting-shareholder-basis::b01
  coded("16", "B", "other_tax_exempt_income", "Other tax-exempt income"),
  // box-16-items-affecting-shareholder-basis::b01
  coded("16", "C", "nondeductible_expenses", "Nondeductible expenses"),
  // box-16-items-affecting-shareholder-basis::b01
  coded("16", "D", "distribution", "Distributions", "money_or_property"),
  // box-16-items-affecting-shareholder-basis::b02
  coded("16", "E", "loan_repayment", "Repayment of loans from shareholders"),
  // box-16-items-affecting-shareholder-basis::b02
  coded("16", "F", "foreign_tax_paid", "Foreign taxes paid or accrued"),
];

/* Box 17: other information; the detail names it. */
const info = (code: string, label: string, detail: string) =>
  coded("17", code, "other_information", label, detail);
const recapture = (code: string, label: string, detail: string) =>
  coded("17", code, "credit_recapture", label, detail);

const BOX_17: BoxTable = [
  // box-17-other-information::b01
  coded("17", "A", "investment_income", "Investment income"),
  // box-17-other-information::b01
  coded("17", "B", "investment_expenses", "Investment expenses"),
  // box-17-other-information::b01
  info("C", "Qualified rehabilitation expenditures (other than rental real estate)", "qre"),
  // box-17-other-information::b02
  info("D", "Basis of energy property", "energy_property_basis"),
  // box-17-other-information::b02: Form 8611 line 8, one form for each code
  coded(
    "17",
    "E",
    "low_income_housing_recapture_42j5",
    "Recapture of low-income housing credit (section 42(j)(5))",
  ),
  // box-17-other-information::b02
  coded(
    "17",
    "F",
    "low_income_housing_recapture",
    "Recapture of low-income housing credit (other)",
  ),
  // box-17-other-information::b02
  recapture("G", "Recapture of investment credit", "investment_credit"),
  // box-17-other-information::b03
  recapture("H", "Recapture of other credits", "other_credits"),
  // box-17-other-information::b03
  info("I", "Look-back interest—completed long-term contracts", "look_back_long_term_contracts"),
  // box-17-other-information::b03
  info("J", "Look-back interest—income forecast method", "look_back_income_forecast"),
  // box-17-other-information::b04
  info("K", "Dispositions of property with section 179 deductions", "section_179_dispositions"),
  // box-17-other-information::b05
  info("L", "Recapture of section 179 deduction", "section_179_recapture"),
  // box-17-other-information::b06
  info("M", "Section 453(l)(3) information", "section_453l3"),
  // box-17-other-information::b06
  info("N", "Section 453A(c) information", "section_453ac"),
  // box-17-other-information::b08
  info("O", "Section 1260(b) information", "section_1260b"),
  // box-17-other-information::b08
  info("P", "Interest allocable to production expenditures", "production_interest"),
  // box-17-other-information::b08
  info("Q", "Capital construction fund (CCF) nonqualified withdrawals", "ccf_withdrawals"),
  // box-17-other-information::b09
  info("R", "Depletion information—oil and gas", "oil_gas_depletion"),
  // box-17-other-information::b09
  coded("17", "U", "net_investment_income", "Net investment income"),
  // box-17-other-information::b11
  coded("17", "V", "section_199a_information", "Section 199A information"),
  // box-17-other-information::b15
  info("AA", "Excess taxable income", "excess_taxable_income"),
  // box-17-other-information::b15
  info("AB", "Excess business interest income", "excess_business_interest_income"),
  // box-17-other-information::b15
  coded("17", "AC", "gross_receipts_448c", "Gross receipts for section 448(c)"),
  // box-17-other-information::b16
  info("AJ", "Excess business loss limitation", "excess_business_loss_statement"),
  // box-17-other-information::b16
  coded("17", "AN", "gross_farming_fishing_income", "Farming and fishing income"),
  // box-17-other-information::b17
  info("AP", "Inversion gain", "inversion_gain"),
  // box-17-other-information::b17
  info("AS", "Qualifying advanced coal and gasification project property", "coal_property"),
  // box-17-other-information::b18
  info("AT", "Qualifying advanced energy project property", "advanced_energy_property"),
  // box-17-other-information::b18
  info("AU", "Advanced manufacturing investment property", "manufacturing_property"),
  // box-17-other-information::b18
  info("AV", "Clean electricity investment property", "clean_electricity_property"),
  // box-17-other-information::b18
  info("AW", "Reportable transactions", "reportable_transactions"),
  // box-17-other-information::b20
  info("BA", "Domestic research or experimental expenditures", "research_expenditures"),
  // box-17-other-information::b21
  info("ZZ", "Other information", "other"),
];

export const S_CORPORATION_BOXES: BoxTable = [
  ...INCOME,
  ...BOX_10,
  ...DEDUCTIONS,
  ...BOX_13,
  ...BOXES_15_AND_16,
  ...BOX_17,
];
