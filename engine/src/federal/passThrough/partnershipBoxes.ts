/*
 * Schedule K-1 (Form 1065): every box and code the 2025 Partner's
 * Instructions describe, and its item type. The comment over each row is the
 * corpus block that describes it, after "irs-1065k1-inst-2025::sec::". Codes
 * marked "Reserved for future use" are not listed; rowFor maps them to
 * not_modeled. Boxes 16, 22 and 23 are checkboxes: header answers of the fact
 * (scheduleK1.ts), not items. The same code means something else here than on
 * the S corporation's K-1: box 13 is other deductions here, credits there.
 */

import { coded, plain, type BoxTable, type StatementBox } from "./boxTable.js";

/* Box 20 code Z carries the section 199A statement (box-20-other-information::b15). */
export const PARTNERSHIP_STATEMENT_BOX: StatementBox = { box: "20", code: "Z" };

const INCOME: BoxTable = [
  // income-loss::b01
  plain("1", "ordinary_business_income", "Ordinary business income (loss)"),
  // box-2-net-rental-real-estate-income-loss::b01
  plain("2", "net_rental_real_estate_income", "Net rental real estate income (loss)"),
  // box-3-other-net-rental-income-loss::b01
  plain("3", "other_net_rental_income", "Other net rental income (loss)"),
  // box-4a-guaranteed-payments-for-services::b01
  plain("4a", "guaranteed_payment_services", "Guaranteed payments for services"),
  // box-4b-guaranteed-payments-for-capital::b01
  plain("4b", "guaranteed_payment_capital", "Guaranteed payments for capital"),
  // box-4c-total-guaranteed-payments::b01
  plain("4c", "guaranteed_payments_total", "Total guaranteed payments"),
  // box-5-interest-income::b01
  plain("5", "interest", "Interest income"),
  // box-6a-ordinary-dividends::b01
  plain("6a", "ordinary_dividends", "Ordinary dividends"),
  // box-6b-qualified-dividends::b01
  plain("6b", "qualified_dividends", "Qualified dividends"),
  // box-6c-dividend-equivalents::b01: not reported on Form 1040.
  plain("6c", "other_information", "Dividend equivalents", "dividend_equivalents"),
  // box-7-royalties::b01
  plain("7", "royalties", "Royalties"),
  // box-8-net-short-term-capital-gain-loss::b01
  plain("8", "net_short_term_capital_gain", "Net short-term capital gain (loss)"),
  // box-9a-net-long-term-capital-gain-loss::b01
  plain("9a", "net_long_term_capital_gain", "Net long-term capital gain (loss)"),
  // box-9b-collectibles-28-gain-loss::b01
  plain("9b", "collectibles_gain", "Collectibles (28%) gain (loss)"),
  // box-9c-unrecaptured-section-1250-gain::b01
  plain("9c", "unrecaptured_section_1250_gain", "Unrecaptured section 1250 gain"),
  // box-10-net-section-1231-gain-loss::b01
  plain("10", "net_section_1231_gain", "Net section 1231 gain (loss)"),
];

const other = (code: string, label: string, detail: string) =>
  coded("11", code, "other_income", label, detail);

const BOX_11: BoxTable = [
  // box-11-other-income-loss::b01
  coded("11", "A", "other_portfolio_income", "Other portfolio income (loss)"),
  // box-11-other-income-loss::b01
  other("B", "Involuntary conversions", "involuntary_conversions"),
  // box-11-other-income-loss::b02
  other("C", "Section 1256 contracts and straddles", "section_1256_contracts"),
  // box-11-other-income-loss::b02
  other("D", "Mining exploration costs recapture", "mining_recapture"),
  // box-11-other-income-loss::b02
  other("E", "Cancellation of debt", "cancellation_of_debt"),
  // box-11-other-income-loss::b02
  other("F", "Section 743(b) positive income adjustments", "section_743b_positive"),
  // box-11-other-income-loss::b03
  other(
    "I",
    "Gain (loss) from disposition of oil, gas, geothermal, or other mineral properties",
    "mineral_property_disposition",
  ),
  // box-11-other-income-loss::b04
  other("J", "Recoveries of tax benefit items", "tax_benefit_recoveries"),
  // box-11-other-income-loss::b04
  other("K", "Gambling gains and losses", "gambling"),
  // box-11-other-income-loss::b05
  other("L", "Income, gain, or loss from a section 751(b) distribution", "section_751b"),
  // box-11-other-income-loss::b05
  other(
    "M",
    "Gain eligible for section 1045 rollover (replacement stock purchased by partnership)",
    "section_1045_gain_stock_purchased",
  ),
  // box-11-other-income-loss::b07
  other(
    "N",
    "Gain eligible for section 1045 rollover (replacement stock not purchased by the partnership)",
    "section_1045_gain_stock_not_purchased",
  ),
  // box-11-other-income-loss::b10
  other("O", "Sale or exchange of QSB stock with section 1202 exclusion", "section_1202_gain"),
  // box-11-other-income-loss::b11
  other(
    "P",
    "Gain or loss on disposition of farm recapture property (section 1252)",
    "farm_recapture_property",
  ),
  // box-11-other-income-loss::b12
  other(
    "Q",
    "Gain or loss on Fannie Mae or Freddie Mac qualified preferred stock",
    "fannie_freddie_preferred",
  ),
  // box-11-other-income-loss::b13
  other("R", "Specially allocated ordinary gain (loss)", "specially_allocated_ordinary"),
  // box-11-other-income-loss::b13
  other("S", "Non-portfolio capital gain (loss)", "non_portfolio_capital_gain"),
  // box-11-other-income-loss::b13
  other("ZZ", "Other", "other"),
];

const gift = (code: string, label: string, detail: string) =>
  coded("13", code, "charitable_contribution", label, detail);
const deduction = (code: string, label: string, detail: string) =>
  coded("13", code, "other_deduction", label, detail);

const BOXES_12_AND_13: BoxTable = [
  // box-12-section-179-deduction::b01
  plain("12", "section_179_deduction", "Section 179 deduction"),
  // box-13-other-deductions::b01
  gift("A", "Cash contributions (60%)", "cash_60"),
  // box-13-other-deductions::b02
  gift("B", "Cash contributions (30%)", "cash_30"),
  // box-13-other-deductions::b02
  gift("C", "Noncash contributions (50%)", "noncash_50"),
  // box-13-other-deductions::b07
  gift("D", "Noncash contributions (30%)", "noncash_30"),
  // box-13-other-deductions::b07
  gift("E", "Capital gain property to a 50% organization (30%)", "capital_gain_property_30"),
  // box-13-other-deductions::b07
  gift("F", "Capital gain property (20%)", "capital_gain_property_20"),
  // box-13-other-deductions::b07
  gift("G", "Contributions (100%)", "contributions_100"),
  // box-13-other-deductions::b08
  coded("13", "H", "investment_interest_expense", "Investment interest expense"),
  // box-13-other-deductions::b09
  coded("13", "I", "portfolio_deduction", "Deductions—royalty income", "royalty_deductions"),
  // box-13-other-deductions::b09
  deduction("J", "Section 59(e)(2) expenditures", "section_59e_expenditures"),
  // box-13-other-deductions::b11
  deduction("K", "Excess business interest expense (EBIE)", "excess_business_interest_expense"),
  // box-13-other-deductions::b11
  coded("13", "L", "portfolio_deduction", "Deductions—portfolio income (other)", "portfolio_other"),
  // box-13-other-deductions::b12
  deduction("M", "Amounts paid for medical insurance", "medical_insurance"),
  // box-13-other-deductions::b12
  deduction("N", "Educational assistance benefits", "educational_assistance"),
  // box-13-other-deductions::b12
  deduction("O", "Dependent care benefits", "dependent_care"),
  // box-13-other-deductions::b12
  deduction("P", "Preproductive period expenses", "preproductive_expenses"),
  // box-13-other-deductions::b13
  deduction("R", "Pensions and IRAs", "pensions_and_iras"),
  // box-13-other-deductions::b14
  deduction("S", "Reforestation expense deduction", "reforestation"),
  // box-13-other-deductions::b14
  deduction("V", "Section 743(b) negative income adjustments", "section_743b_negative"),
  // box-13-other-deductions::b15
  deduction("W", "Soil and water conservation", "soil_and_water_conservation"),
  // box-13-other-deductions::b15
  deduction(
    "X",
    "Qualified film, television, theatrical, and sound recording production expenditures",
    "film_and_television_production",
  ),
  // box-13-other-deductions::b16
  deduction("Y", "Expenditures for removal of barriers", "removal_of_barriers"),
  // box-13-other-deductions::b16
  deduction("Z", "Itemized deductions", "itemized_deductions"),
  // box-13-other-deductions::b16
  deduction(
    "AA",
    "Contributions to a capital construction fund (CCF)",
    "capital_construction_fund",
  ),
  // box-13-other-deductions::b16
  deduction("AB", "Penalty on early withdrawal of savings", "early_withdrawal_penalty"),
  // box-13-other-deductions::b17
  deduction(
    "AC",
    "Interest expense allocated to debt-financed distributions",
    "debt_financed_distribution_interest",
  ),
  // box-13-other-deductions::b17
  deduction("AD", "Interest expense on working interest in oil or gas", "oil_gas_working_interest"),
  // box-13-other-deductions::b18
  coded("13", "AE", "portfolio_deduction", "Deductions—portfolio income", "portfolio_income"),
  // box-13-other-deductions::b19
  deduction("ZZ", "Other", "other"),
];

const BOX_14: BoxTable = [
  // box-14-self-employment-earnings::b02
  coded("14", "A", "self_employment_earnings", "Net earnings (loss) from self-employment"),
  // box-14-self-employment-earnings::b02
  coded("14", "B", "gross_farming_fishing_income", "Gross farming or fishing income"),
  // box-14-self-employment-earnings::b02
  coded("14", "C", "gross_nonfarm_income", "Gross nonfarm income"),
];

/* Box 15: each credit; the detail names it. */
const credit = (code: string, label: string, detail: string) =>
  coded("15", code, "credit", label, detail);

const BOX_15: BoxTable = [
  // box-15-credits::b02
  credit("A", "Zero-emission nuclear power production credit", "zero_emission_nuclear"),
  // box-15-credits::b02
  credit("B", "Credit for production from advanced nuclear power facilities", "advanced_nuclear"),
  // box-15-credits::b02
  credit("C", "Low-income housing credit (section 42(j)(5))", "low_income_housing_42j5"),
  // box-15-credits::b02
  credit("D", "Low-income housing credit (other)", "low_income_housing_other"),
  // box-15-credits::b03
  credit(
    "E",
    "Qualified rehabilitation expenditures (rental real estate)",
    "rehabilitation_rental",
  ),
  // box-15-credits::b03
  credit("F", "Other rental real estate credits", "other_rental_real_estate"),
  // box-15-credits::b04
  credit("G", "Other rental credits", "other_rental"),
  // box-15-credits::b04
  credit("H", "Undistributed capital gains credit", "undistributed_capital_gains"),
  // box-15-credits::b04
  credit("I", "Biofuel producer credit", "biofuel_producer"),
  // box-15-credits::b06
  credit("J", "Work opportunity credit", "work_opportunity"),
  // box-15-credits::b06
  credit("K", "Disabled access credit", "disabled_access"),
  // box-15-credits::b06
  credit("L", "Empowerment zone employment credit", "empowerment_zone"),
  // box-15-credits::b06
  credit("M", "Credit for increasing research activities", "research"),
  // box-15-credits::b06
  credit(
    "N",
    "Credit for employer social security and Medicare taxes",
    "employer_social_security_on_tips",
  ),
  // box-15-credits::b07
  coded("15", "O", "backup_withholding", "Backup withholding"),
  // box-15-credits::b07
  credit("P", "Unused investment credit: advanced coal or gasification project", "unused_coal"),
  // box-15-credits::b07
  credit("Q", "Unused investment credit: advanced energy project", "unused_advanced_energy"),
  // box-15-credits::b07
  credit(
    "R",
    "Unused investment credit: advanced manufacturing investment",
    "unused_manufacturing",
  ),
  // box-15-credits::b08
  credit("S", "Unused investment credit: clean electricity", "unused_clean_electricity"),
  // box-15-credits::b08
  credit("T", "Unused investment credit: energy credit", "unused_energy"),
  // box-15-credits::b08
  credit("U", "Unused investment credit: rehabilitation credit", "unused_rehabilitation"),
  // box-15-credits::b08
  credit("V", "Advanced manufacturing production credit", "advanced_manufacturing_production"),
  // box-15-credits::b08
  credit("W", "Clean electricity production credit", "clean_electricity_production"),
  // box-15-credits::b08
  credit("X", "Clean fuel production credit", "clean_fuel_production"),
  // box-15-credits::b08
  credit("Y", "Clean hydrogen production credit", "clean_hydrogen_production"),
  // box-15-credits::b08
  credit("Z", "Orphan drug credit", "orphan_drug"),
  // box-15-credits::b08
  credit("AA", "Enhanced oil recovery credit", "enhanced_oil_recovery"),
  // box-15-credits::b09
  credit("AB", "Renewable electricity production credit", "renewable_electricity_production"),
  // box-15-credits::b09
  credit("AC", "Biodiesel, renewable diesel, or sustainable aviation fuels credit", "biodiesel"),
  // box-15-credits::b09
  credit("AD", "New markets credit", "new_markets"),
  // box-15-credits::b09
  credit("AE", "Small employer pension plan startup costs credit", "pension_startup"),
  // box-15-credits::b09
  credit("AF", "Small employer auto-enrollment credit", "auto_enrollment"),
  // box-15-credits::b09
  credit(
    "AG",
    "Small employer military spouse participation credit",
    "military_spouse_participation",
  ),
  // box-15-credits::b09
  credit("AH", "Credit for employer-provided childcare facilities and services", "childcare"),
  // box-15-credits::b10
  credit("AI", "Low sulfur diesel fuel production credit", "low_sulfur_diesel"),
  // box-15-credits::b10
  credit("AJ", "Qualified railroad track maintenance credit", "railroad_track_maintenance"),
  // box-15-credits::b10
  credit("AK", "Credit for oil and gas production from marginal wells", "marginal_wells"),
  // box-15-credits::b10
  credit("AL", "Distilled spirits credit", "distilled_spirits"),
  // box-15-credits::b10
  credit("AM", "Energy efficient home credit", "energy_efficient_home"),
  // box-15-credits::b11
  credit("AO", "Alternative fuel vehicle refueling property credit", "refueling_property"),
  // box-15-credits::b11
  credit("AP", "Clean renewable energy bond credit", "clean_renewable_energy_bond"),
  // box-15-credits::b11
  credit("AQ", "New clean renewable energy bond credit", "new_clean_renewable_energy_bond"),
  // box-15-credits::b11
  credit("AR", "Qualified energy conservation bond credit", "energy_conservation_bond"),
  // box-15-credits::b11
  credit("AS", "Qualified zone academy bond credit", "zone_academy_bond"),
  // box-15-credits::b11
  credit("AT", "Qualified school construction bond credit", "school_construction_bond"),
  // box-15-credits::b11
  credit("AU", "Build America bond credit", "build_america_bond"),
  // box-15-credits::b11
  credit("AV", "Credit for employer differential wage payments", "differential_wage"),
  // box-15-credits::b11
  credit("AW", "Carbon oxide sequestration credit", "carbon_oxide_sequestration"),
  // box-15-credits::b11
  coded(
    "15",
    "AX",
    "credit_recapture",
    "Carbon oxide sequestration credit recapture",
    "carbon_oxide_sequestration",
  ),
  // box-15-credits::b11
  credit("AY", "New clean vehicle credit", "new_clean_vehicle"),
  // box-15-credits::b12
  credit("AZ", "Credit for qualified commercial clean vehicles", "commercial_clean_vehicle"),
  // box-15-credits::b12
  credit("BA", "Credit for small employer health insurance premiums", "small_employer_health"),
  // box-15-credits::b12
  credit("BB", "Employer credit for paid family and medical leave", "paid_family_leave"),
  // box-15-credits::b12
  credit("BC", "Eligible credits from transferor(s) under section 6418", "transferred_credits"),
  // box-15-credits::b12
  credit("ZZ", "Other credits", "other"),
];

const amt = (code: string, label: string, detail: string) =>
  coded("17", code, "amt_item", label, detail);
const distribution = (code: string, label: string, detail: string) =>
  coded("19", code, "distribution", label, detail);

const BOXES_17_TO_19: BoxTable = [
  // box-17-alternative-minimum-tax::b01
  amt("A", "Post-1986 depreciation adjustment", "post_1986_depreciation"),
  // box-17-alternative-minimum-tax::b01
  amt("B", "Adjusted gain or loss", "adjusted_gain_or_loss"),
  // box-17-alternative-minimum-tax::b01
  amt("C", "Depletion (other than oil & gas)", "depletion"),
  // box-17-alternative-minimum-tax::b01
  amt("D", "Oil, gas, & geothermal—gross income", "oil_gas_geothermal_gross_income"),
  // box-17-alternative-minimum-tax::b01
  amt("E", "Oil, gas, & geothermal—deductions", "oil_gas_geothermal_deductions"),
  // box-17-alternative-minimum-tax::b02
  amt("F", "Other AMT items", "other"),
  // box-18-tax-exempt-income-and::b01
  coded("18", "A", "tax_exempt_interest", "Tax-exempt interest income"),
  // box-18-tax-exempt-income-and::b01
  coded("18", "B", "other_tax_exempt_income", "Other tax-exempt income"),
  // box-18-tax-exempt-income-and::b01
  coded("18", "C", "nondeductible_expenses", "Nondeductible expenses"),
  // box-19-distributions::b01
  distribution("A", "Cash and marketable securities", "cash_and_marketable_securities"),
  // box-19-distributions::b02
  distribution("B", "Distribution subject to section 737", "section_737"),
  // computation-of-section-737-gain::b01
  distribution("C", "Other property", "other_property"),
  // computation-of-section-737-gain::b03
  distribution(
    "D",
    "Deemed distributions of money—decreases in partner's share of liabilities",
    "deemed_money",
  ),
  // codes-f-and-g-certain-distributions-of-property::b01
  distribution("F", "Certain distributions of cash or marketable securities", "certain_cash"),
  // codes-f-and-g-certain-distributions-of-property::b02
  distribution("G", "Certain distributions of other property", "certain_property"),
];

/* Box 20: other information; the detail names it. */
const info = (code: string, label: string, detail: string) =>
  coded("20", code, "other_information", label, detail);
const recapture = (code: string, label: string, detail: string) =>
  coded("20", code, "credit_recapture", label, detail);

const BOXES_20_AND_21: BoxTable = [
  // box-20-other-information::b01
  coded("20", "A", "investment_income", "Investment income"),
  // box-20-other-information::b01
  coded("20", "B", "investment_expenses", "Investment expenses"),
  // box-20-other-information::b01
  info("C", "Fuel tax credit information", "fuel_tax_credit"),
  // box-20-other-information::b01
  info("D", "Qualified rehabilitation expenditures (other than rental real estate)", "qre"),
  // box-20-other-information::b02
  info("E", "Basis of energy property", "energy_property_basis"),
  // box-20-other-information::b02
  recapture("F", "Recapture of low-income housing credit (section 42(j)(5))", "lih_42j5"),
  // box-20-other-information::b02
  recapture("G", "Recapture of low-income housing credit (other)", "lih_other"),
  // box-20-other-information::b02
  recapture("H", "Recapture of investment credit", "investment_credit"),
  // box-20-other-information::b03
  recapture("I", "Recapture of other credits", "other_credits"),
  // box-20-other-information::b03
  info("J", "Look-back interest—completed long-term contracts", "look_back_long_term_contracts"),
  // box-20-other-information::b04
  info("K", "Look-back interest—income forecast method", "look_back_income_forecast"),
  // box-20-other-information::b05
  info("L", "Dispositions of property with section 179 deductions", "section_179_dispositions"),
  // box-20-other-information::b06
  info("M", "Recapture of section 179 deduction", "section_179_recapture"),
  // box-20-other-information::b07
  info("N", "Business interest expense (BIE)", "business_interest_expense"),
  // box-20-other-information::b08
  info("O", "Section 453(l)(3) information", "section_453l3"),
  // box-20-other-information::b08
  info("P", "Section 453A(c) information", "section_453ac"),
  // box-20-other-information::b11
  info("Q", "Section 1260(b) information", "section_1260b"),
  // box-20-other-information::b11
  info("R", "Interest allocable to production expenditures", "production_interest"),
  // box-20-other-information::b11
  info("S", "Capital construction fund (CCF) nonqualified withdrawals", "ccf_withdrawals"),
  // box-20-other-information::b12
  info("T", "Depletion information—oil and gas", "oil_gas_depletion"),
  // box-20-other-information::b12
  info("U", "Section 743(b) basis adjustment", "section_743b_basis_adjustment"),
  // box-20-other-information::b12
  info("V", "Unrelated business taxable income", "unrelated_business_taxable_income"),
  // box-20-other-information::b13
  info("W", "Precontribution gain (loss)", "precontribution_gain"),
  // box-20-other-information::b14
  info("X", "Payment obligations including guarantees and deficit restoration", "guarantees"),
  // box-20-other-information::b14
  coded("20", "Y", "net_investment_income", "Net investment income (NII)"),
  // box-20-other-information::b15
  coded("20", "Z", "section_199a_information", "Section 199A information"),
  // box-20-other-information::b19
  info("AA", "Section 704(c) information", "section_704c"),
  // box-20-other-information::b20
  info("AB", "Section 751 gain (loss)", "section_751_gain"),
  // part-xiii::b01
  info("AC", "Section 1(h)(5) collectibles gain", "interest_sale_collectibles_gain"),
  // part-xiii::b01
  info("AD", "Section 1(h)(6) unrecaptured section 1250 gain", "interest_sale_unrecaptured_1250"),
  // part-xiii::b02
  info("AE", "Excess taxable income", "excess_taxable_income"),
  // part-xiii::b02
  info("AF", "Excess business interest income", "excess_business_interest_income"),
  // part-xiii::b02
  coded("20", "AG", "gross_receipts_448c", "Gross receipts for section 448(c)"),
  // part-xiii::b04
  info("AH", "Noncash charitable contributions", "noncash_charitable_contributions"),
  // part-xiii::b04
  info("AI", "Interest and tax on deferred compensation to partners", "deferred_compensation"),
  // part-xiii::b05
  info("AJ", "Excess business loss limitation", "excess_business_loss_statement"),
  // part-xiii::b05
  info("AK", "Gain from mark-to-market election", "mark_to_market_gain"),
  // part-xiii::b05
  info("AL", "Section 721(c) partnership", "section_721c"),
  // part-xiii::b07
  info("AM", "Section 1061 information", "section_1061"),
  // part-xiii::b07
  info("AN", "Farming and fishing business", "farming_fishing_business"),
  // part-xiii::b07
  info("AO", "PTP information", "ptp_information"),
  // part-xiii::b07
  info("AP", "Inversion gain", "inversion_gain"),
  // part-xiii::b08
  info("AQ", "Conservation reserve program payments", "conservation_reserve_payments"),
  // part-xiii::b09
  info("AR", "IRA disclosure", "ira_disclosure"),
  // part-xiii::b09
  info("AS", "Qualifying advanced coal and gasification project property", "coal_property"),
  // part-xiii::b09
  info("AT", "Qualifying advanced energy project property", "advanced_energy_property"),
  // part-xiii::b09
  info("AU", "Advanced manufacturing investment property", "manufacturing_property"),
  // part-xiii::b09
  info("AV", "Clean electricity investment property", "clean_electricity_property"),
  // part-xiii::b09
  info("AW", "Reportable transactions", "reportable_transactions"),
  // part-xiii::b10
  info("AX", "Corporate alternative minimum tax (CAMT)", "corporate_amt"),
  // part-xiii::b10
  info("AY", "Foreign partners, Form 8990, Schedule A", "foreign_partners_8990"),
  // part-xiii::b11
  info("AZ", "Reimbursement of preformation expenditures", "preformation_reimbursement"),
  // part-xiii::b11
  info("ZZ", "Other", "other"),
  // box-21-foreign-taxes-paid-or::b01
  plain("21", "foreign_tax_paid", "Foreign taxes paid or accrued"),
];

export const PARTNERSHIP_BOXES: BoxTable = [
  ...INCOME,
  ...BOX_11,
  ...BOXES_12_AND_13,
  ...BOX_14,
  ...BOX_15,
  ...BOXES_17_TO_19,
  ...BOXES_20_AND_21,
];
