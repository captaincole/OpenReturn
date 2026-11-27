import { beforeEach, describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import { isK1FactKey } from "../../src/facts";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionsWithPreparerStyle } from "../helpers/preparer";
import { loadScenarios } from "../scenarios/index";
import type { Scenario } from "../types";

/*
 * On a failure, add a missingInputs entry in the form's resolver, or list the
 * input here with the reason it is optional.
 * Document facts are skipped: the scope decisions cover whether they exist.
 * A business fact (Schedule C), a dependent fact and a rental property fact
 * (Schedule E) are skipped too: each is the whole business, person or property,
 * and whether one exists is Cade's question. A Schedule K-1 is a document; its
 * holding fact (the owner's answers) is not, so dropping it must be reported.
 */
const OPTIONAL: Array<[RegExp, string]> = [
  [/^decisions\.scope\.must_file_schedule_ca$/, "Schedule CA files with the 540 unless set false"],
  [
    /^decisions\.trade\..+\.form_8949_box$/,
    "override; the default box comes from the 1099-B facts",
  ],
  [/^identity\.address\.apt$/, "not every address has an apartment"],
  [
    /^hsa\.distributions_rolled_over$/,
    "Form 8889 line 14b, recorded only when the user rolled a distribution over or took out " +
      "an excess contribution by the due date; blank otherwise",
  ],
  [
    /^hsa\.archer_msa\.distributions_rolled_over$/,
    "Form 8853 line 6b, recorded only when the user rolled an Archer MSA distribution over or " +
      "took out an excess contribution by the due date; blank otherwise",
  ],
  [
    /^decisions\.scope\.must_file_schedule_a$/,
    "close-deductions records it when California itemizes and federal takes the standard " +
      "deduction (cade deductions/closing.ts); absent, Schedule A follows decisions.itemize_vs_standard",
  ],
  [
    /^capital_gains\.(short|long)_term_loss_carryover$/,
    "a prior-year answer Cade records when last year's return carried a capital loss over " +
      "(last year's return is not read, #79); Schedule D files with it",
  ],
  [
    /^ca_nol\.prior_year_carryovers$/,
    "a prior-year answer from last year's FTB 3805V Part III, recorded when the taxpayer carries " +
      "a California NOL or disaster loss over (last year's return is not read, #79); FTB 3805V files with it",
  ],
  [
    /^nol\.carryovers$/,
    "a prior-year answer from last year's Form 172 or carryover statement, recorded when the " +
      "taxpayer carries a federal NOL to 2025 (last year's return is not read, #79); Schedule 1 " +
      "line 8a deducts it",
  ],
  [
    /^capital_gains\.ca_loss_carryover$/,
    "a prior-year answer Cade records when the California carryover differs from the federal " +
      "one; Schedule D (540) files with it, and asks for it when it files and a federal carryover exists",
  ],
  [
    /^ca_passive\.prior_year_unallowed_loss\.[^.]+$/,
    "a prior-year answer from last year's FTB 3801; FTB 3801 asks for it for every property " +
      "that is passive for California on a California return",
  ],
  [
    /^decisions\.scope\.must_file_8995(_a)?$/,
    "override; the QBI form follows the taxable income upper bound (federal/qbi/whichForm.ts)",
  ],
  [
    /^gambling\.winnings_not_on_w2g$/,
    "an answer Cade records only when the user reports winnings with no W-2G; " +
      "otherwise line 8b comes from the W-2G facts",
  ],
  [
    /^other_income\.alaska_permanent_fund_dividends$/,
    "an answer Cade records only when the user received the dividend (Schedule 1 line 8g)",
  ],
  [
    /^farm_rental\.[^.]+$/,
    "each fact is a whole farm rented for crop or livestock shares (Form 4835); whether one " +
      "exists is Cade's question. Form 4835 lists the fact again while an answer inside it " +
      "(line A, the CCC loan election, line 34's at-risk box, material participation) is missing",
  ],
  [
    /^work_opportunity_employee\.[^.]+$/,
    "each fact is a whole targeted group employee the taxpayer claims the work opportunity " +
      "credit for (Form 5884); whether one exists is Cade's question, as for a business fact. " +
      "Form 5884 lists the fact again while it is malformed",
  ],
  [
    /^small_employer_plan\.[^.]+$/,
    "each fact is the whole retirement plan of the taxpayer's own business or farm that claims " +
      "the Form 8881 credits; whether one exists is Cade's question, as for a business fact. " +
      "Form 8881 lists the fact again while it is malformed",
  ],
  [
    /^casualty\.[^.]+$/,
    "each fact is a whole casualty event (Form 4684); whether one happened is Cade's question",
  ],
  [
    /^farm\.[^.]+$/,
    "each fact is a whole farm (Schedule F), as a business fact is a whole Schedule C business; " +
      "whether the taxpayer farms is Cade's question. Schedule F lists the fact again while an " +
      "answer inside it is missing",
  ],
  [
    /^general_business_credit\.(current|carryover)\.[^.]+$/,
    "each fact is one whole credit or carryover from last year's return (Form 3800 Parts III " +
      "and IV); whether one exists is Cade's question",
  ],
  [
    /^investment_credit\.(property|cooperative)\.[^.]+$/,
    "each fact is one whole Form 3468 property, or one cooperative's unused credits; whether " +
      "one exists is Cade's question, and Form 3468 lists a property fact whose answers are missing",
  ],
  [
    /^tax_credit_bond\.[^.]+$/,
    "each fact is one whole bond or pass-through credit of a Form 8912 Part IV; whether one " +
      "exists is Cade's question, and the form lists a fact whose answers are missing",
  ],
  [
    /^prior_year\.tax_credit_bond_credit_carryforward$/,
    "a prior-year answer from last year's Form 8912 (line 4 less line 12), recorded when a " +
      "credit was carried forward (last year's return is not read, #79); Form 8912 line 3 takes it",
  ],
  [
    /^electric_vehicle_credit\.passive_carryover\.[^.]+$/,
    "each fact is one whole prior year unallowed qualified electric vehicle credit from last " +
      "year's Form 8582-CR (Form 8834 line 1); whether one exists is Cade's question",
  ],
  [
    /^foreign_earned_income\.(taxpayer|spouse)$/,
    "each fact is a whole person's Form 2555 (Parts I to IX); whether the person claims the " +
      "exclusion is Cade's question. Form 2555 lists the fact again while an answer inside it " +
      "(the test, line 44's self-employment answer) is missing",
  ],
  [
    /^american_samoa_exclusion\.(taxpayer|spouse)$/,
    "each fact is a whole person's Form 4563 (Parts I and II); whether the person is a bona " +
      "fide resident of American Samoa with income to exclude is Cade's question. Form 4563 " +
      "lists the fact again while an answer inside it (Part I) is missing",
  ],
  [
    /^treaty_position\.[^.]+$/,
    "each fact is one whole treaty-based return position (one Form 8833); whether the taxpayer " +
      "takes one is Cade's question. Form 8833 lists the fact again while an answer inside it " +
      "(the boxes, lines 1a to 2, 5 and 6) is missing",
  ],
  [
    /^retirement\.qualified_disaster\.[^.]+$/,
    "each fact is a whole Form 8915-F (one person, one year in which the disasters began); " +
      "whether the taxpayer had a qualified disaster distribution, income spread from an earlier " +
      "year or a repayment is Cade's question",
  ],
  [
    /^community_property\.item\.[^.]+$/,
    "each fact is one whole item of Form 8958 (community or separate, the taxpayer's or the " +
      "spouse's); whether one exists is Cade's question. Form 8958 lists the item again while an " +
      "answer inside it (basis, owner, the community part) is missing",
  ],
  [
    /^community_property\.spouses_living_apart_rules$/,
    "an answer Cade records only when the spouses meet the four conditions of Pub. 555 " +
      "(Spouses living apart all year); absent, community property law applies as usual",
  ],
  [
    /^community_property\.married_during_year$/,
    "an answer Cade records only for a single or head of household filer who was married " +
      "during the year; absent, the other person on Form 8958 is a registered domestic partner",
  ],
  [
    /^canceled_debt\.[^.]+$/,
    "each fact is a whole canceled debt (Form 982, Schedule 1 line 8c); whether a debt was canceled " +
      "with no Form 1099-C is Cade's question. A Form 1099-C with no debt fact asks for one, and " +
      "Form 982 lists a debt fact again while an answer inside it is missing",
  ],
  [
    /^empowerment_zone_employee\.[^.]+$/,
    "each fact is one whole employee of the taxpayer's business or farm who worked in an " +
      "empowerment zone (Form 8844 line 1); whether one exists is Cade's question",
  ],
  [
    /^armed_forces_move\.[^.]+$/,
    "each fact is a whole Armed Forces move (Form 3903); whether one happened is Cade's question",
  ],
  [
    /^disabled_access\.[^.]+$/,
    "each fact is one group of a business's eligible access expenditures (Form 8826 line 1); " +
      "whether a business paid any is Cade's question. Form 8826 lists the fact again while it " +
      "is malformed, and asks the prior-year answers once one exists",
  ],
  [
    /^tip_credit\.[^.]+$/,
    "each fact is one whole business's payroll tip records (Form 8846 lines 1 to 4); whether a " +
      "business had tipped employees is Cade's question. Form 8846 lists the fact again while " +
      "its Medicare-only tips are missing",
  ],
  [
    /^research_credit$/,
    "the fact is the whole of the taxpayer's own research for Form 6765 (Sections A to G); " +
      "whether the business did qualified research is Cade's question. Form 6765 asks for it when " +
      "the decision files the form without one",
  ],
  [
    /^childcare_expenditure\.[^.]+$/,
    "each fact is one whole childcare expenditure the business claims the credit for (Form " +
      "8882 lines 1 and 3); whether one exists is Cade's question. Form 8882 lists the fact " +
      "again while it is malformed",
  ],
  [
    /^orphan_drug_credit$/,
    "the fact is the whole orphan drug credit of the taxpayer's own business (Form 8820 lines 1 " +
      "to 2b and Part II); whether the business paid for clinical testing of an orphan drug is " +
      "Cade's question. Form 8820 lists the fact again while Part II or line 2b is missing",
  ],
  [
    /^section_965\.(inclusion|other_liability|s_corporation|deferred)\.[^.]+$/,
    "each fact is one whole line of last year's Form 965-A (Part I with its Part II line, a " +
      "Part III row or a Part IV row); whether one exists is Cade's question. Form 965-A lists " +
      "a Part III year's Part I line, and a triggered liability whose amount or election is missing",
  ],
  [
    /^low_income_housing_recapture\.[^.]+$/,
    "each fact is a whole building's credit recapture (Form 8611); whether the qualified basis " +
      "fell is Cade's question. A K-1 with a recapture asks for its building fact",
  ],
  [
    /^low_income_housing_building\.[^.]+$/,
    "each fact is a whole building a taxpayer owns directly (Form 8609-A, one for each building); " +
      "whether one exists is Cade's question. A building fact missing an answer its year needs " +
      "is listed again",
  ],
  [
    /^look_back\.long_term_contracts$/,
    "the fact is the whole look-back computation (Form 8697); whether a long-term contract was " +
      "completed or adjusted in 2025 is Cade's question",
  ],
  [
    /^farm_income_averaging$/,
    "the Schedule J election itself (lines 2a to 2c): whether the taxpayer elects to average " +
      "farming or fishing income is Cade's question. Schedule J lists the fact again when the " +
      "decision files it without one",
  ],
  [
    /^trust_accumulation_distribution\.[^.]+$/,
    "each fact is a whole trust's Schedule J (Form 1041) Part IV (Form 4970, one copy per " +
      "trust); whether the taxpayer received an accumulation distribution is Cade's question",
  ],
  [
    /^mortgage_subsidy\.[^.]+\.sale$/,
    "each fact is a whole sale of a home with a federal mortgage subsidy (Form 8828); whether " +
      "the taxpayer sold one is Cade's question. The form asks for the issuer's notice of each sale",
  ],
  [
    /^installment_sale\.[^.]+$/,
    "each fact is a whole installment sale (Form 6252, one copy per sale); whether the " +
      "taxpayer made one is Cade's question",
  ],
  [
    /^pfic_fund\.[^.]+$/,
    "each fact is a whole foreign fund holding (Form 8621, one copy per fund); whether the " +
      "taxpayer holds one is Cade's question",
  ],
  [
    /^retirement\.lump_sum_distribution\.[^.]+$/,
    "each fact is a whole participant's lump-sum distribution with its Part I answers and " +
      "elections (Form 4972); whether the user elects the special tax is Cade's question",
  ],
  [
    /^refund_deposit\.account_[123]$/,
    "each fact is a whole account for the refund (Form 8888 lines 1–3); whether to split the " +
      "refund is Cade's question. Form 8888 asks for two accounts when it files without them",
  ],
  [
    /^employee_business_expenses\.[^.]+$/,
    "each fact is a whole Form 2106 (one person, one occupation); whether one exists is Cade's question",
  ],
  [
    /^uncollected_wages\.[^.]+$/,
    "each fact is a whole firm that paid wages with no social security or Medicare tax withheld " +
      "(Form 8919 lines 1 to 5); whether one exists is Cade's question",
  ],
  [
    /^clean_vehicle\.[^.]+$/,
    "each fact is a whole clean vehicle placed in service (Schedule A (Form 8936)); whether one " +
      "was bought is Cade's question",
  ],
  [
    /^clean_vehicle_credit\.(puerto_rico_excluded_income|prior_year_magi_additions|k1_credits)$/,
    "an answer Cade records only when the taxpayer has excluded Puerto Rico income, a 2024 " +
      "exclusion, or a K-1 code AY or AZ credit (Form 8936 lines 1b, 3b–3e, 7 and 20)",
  ],
  [
    /^refueling_property\.[^.]+$/,
    "each fact is a whole item of refueling property placed in service (Schedule A (Form 8911)); " +
      "whether one was installed is Cade's question. Form 8911 lists the fact again while line 13 " +
      "or line 17 inside it has no answer",
  ],
  [
    /^ca_work_move\.[^.]+$/,
    "each fact is a whole move for a new job (FTB 3913); whether one happened is Cade's question. " +
      "FTB 3913 lists the fact again while an answer inside it (time test, line 4) is missing",
  ],
  [
    /^adjustments\.armed_forces_storage_fees_only$/,
    "an answer Cade records only for storage fees alone from an earlier move (Schedule 1 line 14 box)",
  ],
  [
    /^charitable\.noncash_gift\.[^.]+$/,
    "each fact is a whole noncash gift (Form 8283, Schedule A line 12); whether one was given is " +
      "Cade's question",
  ],
  [
    /^mortgage\.credit_certificate$/,
    "the whole Mortgage Credit Certificate (Form 8396); whether the filer holds one is Cade's " +
      "question. Form 8396 asks for it when a carryforward files the form without it",
  ],
  [
    /^dependent_care\.(provider|qualifying_person)\.[^.]+$/,
    "each fact is a whole care provider or qualifying person (Form 2441 lines 1 and 2); " +
      "whether one exists is Cade's question",
  ],
  [
    /^ca_health_coverage\.unclaimed\.[^.]+$/,
    "each fact is a whole person the taxpayer can claim as a dependent but does not (FTB 3853 " +
      "Parts I and III); whether one lives in the household is Cade's question",
  ],
  [
    /^adoption\.child\.[^.]+$/,
    "each fact is a whole child the taxpayer adopted or tried to adopt (Form 8839 line 1); " +
      "whether one exists is Cade's question",
  ],
  [
    /^education\.savings_bond(_expense)?\.[^.]+$/,
    "each fact is a whole savings bond cashed or a whole line 1 row (Form 8815); whether one " +
      "exists is Cade's question",
  ],
  [
    /^gambling\.losses$/,
    "an answer Cade records only when the user reports gambling losses (Schedule A line 16)",
  ],
  [
    /^adjustments\.educator_expenses\.(taxpayer|spouse)$/,
    "an answer Cade records only for an eligible K-12 educator (Schedule 1 line 11)",
  ],
  [
    /^identity\.(spouse\.)?blind$/,
    "KNOWN GAP: Cade asks once and records it; absent counts as not visually impaired " +
      "(CA 540 line 8). Federal 1040 line 12d does not read it yet.",
  ],
  [
    /^ca_payments\.(estimated_tax|prior_year_overpayment_applied|extension_payment)$/,
    "an answer Cade records only when the user made that California payment (Form 540 line 72)",
  ],
  [
    /^business_property_sale\.ca_nonrecaptured_section_1231_losses$/,
    "Schedule D-1 line 8, recorded only when the California amount differs from the federal " +
      "answer; absent, Schedule D-1 takes the federal one (and asks for it when both are missing)",
  ],
  [
    /^business_property_sale\.(?!(ca_)?nonrecaptured_section_1231_losses$)[^.]+$/,
    "a Form 4797 sale fact is the whole sale (as a rental property fact is the whole property); " +
      "whether one exists is Cade's question",
  ],
  [
    /^(like_kind_exchange|conflict_of_interest_sale)\.[^.]+$/,
    "each fact is a whole like-kind exchange or section 1043 sale (Form 8824); whether one " +
      "happened is Cade's question. Form 8824 lists an exchange again while its lines 9 and 10 " +
      "are not answered",
  ],
  [
    /^fuel_tax_activity\.[^.]+$/,
    "a Form 4136 fact is one whole business activity's fuel claims (or the home's kerosene); " +
      "whether a nontaxable use happened is Cade's question. Form 4136 lists the fact again " +
      "while the Part I code or equipment it describes is missing",
  ],
  [
    /^section_179_recapture\.[^.]+$/,
    "a Form 4797 Part IV fact is the whole recapture of one property; whether business use " +
      "dropped to 50% or less is Cade's question",
  ],
  [
    /^credit_recapture\.(line|property|emissions_tier)\.[^.]+$/,
    "each Form 4255 fact is a whole Part I line, Part II property or Part III facility; " +
      "whether a recapture happened is Cade's question. Form 4255 lists a line's fact while a " +
      "property or facility on that line waits for it",
  ],
  [
    /^form8332\.revocation\.[^.]+$/,
    "each fact is one whole Form 8332 Part III revocation the taxpayer gave the other parent; " +
      "whether one was given is Cade's question. Form 8332 lists the fact again while an answer " +
      "inside it is missing",
  ],
  [/^identity\.email$/, "Cade records the login email at doc-gen time"],
  [/^identity\.(spouse\.)?name\.middle_initial$/, "printed when stated; not every name has one"],
  [
    /^amt\.iso_exercise_spread$/,
    "an answer Cade records only when the user exercised incentive stock options; " +
      "Schedule P (540) and Form 6251 read it (a spread above 0 files Form 6251)",
  ],
  [
    /^mortgage\.origination_date_form_1098$/,
    "the 1098's box 3, read only to pick the $1,000,000 limit for a loan from 2017 or earlier",
  ],
  [
    /^investment_interest\.ca_elected_net_capital_gain$/,
    "a separate California election on FTB 3526 line 4e, recorded only when the user states one",
  ],
  [
    /^investment_income\.niit_additional_modifications$/,
    "Form 8960 line 10, recorded only when the user states additional modifications; blank otherwise",
  ],
  [
    /^business_loss_limit\.(business_capital_gain|other_business_income)$/,
    "Form 461 answers Cade records only when a capital gain or loss, or an amount outside " +
      "Schedule 1 lines 3 to 6, comes from a trade or business (lines 3 and 8); absent means none",
  ],
  [
    /^decisions\.scope\.must_file_6251$/,
    "KNOWN GAP: an incentive stock option spread files Form 6251; a filer who owes AMT " +
      "for another reason (line 7 more than line 10) needs the explicit decision.",
  ],
  [
    /^other_income\.(alimony_received|jury_duty_pay|prizes_and_awards|stock_options|other_items)$/,
    "an answer Cade records only when the user had that income (Schedule 1 lines 2a, 8h, 8i, 8k, 8z)",
  ],
  [
    /^adjustments\.(self_employed_plan_deduction|alimony_paid|jury_duty_pay_to_employer|reforestation|trade_act_benefit_repayment|discrimination_claim_fees|whistleblower_award_fees)$/,
    "an answer Cade records only when the user had that adjustment (Schedule 1 lines 16, 19a, 24a–24i)",
  ],
  [
    /^retirement\.traditional_ira\.(taxpayer|spouse)$/,
    "recorded when the person has a traditional IRA; Form 8606 asks it for an IRA distribution, " +
      "and Schedule 1 line 20 reads its contributions",
  ],
  [
    /^(state_local_tax\.other_taxes(_description)?|other_itemized\.impairment_related_work_expenses)$/,
    "an answer Cade records only when the user paid other taxes or has impairment-related work " +
      "expenses (Schedule A lines 6 and 16)",
  ],
  [
    /^retirement\.early_distribution_exception\.[^.]+\.[^.]+$/,
    "an answer Cade records only when the user states an exception for an early distribution; " +
      "absent, the 1099-R's code 1 stands and no part is excluded (Form 5329 line 2)",
  ],
  [
    /^retirement\.ca_lump_sum\.[^.]+$/,
    "each fact is a whole Schedule G-1 choice for one plan participant (a lump-sum distribution " +
      "taxed by the special methods); whether the taxpayer makes it is Cade's question",
  ],
  [
    /^se_health_plan\.[^.]+$/,
    "each fact is a whole health plan established under a business (Form 7206, Schedule 1 " +
      "line 17); whether one exists is Cade's question",
  ],
  [
    /^foreign_tax\.[^.]+$/,
    "each fact is a whole foreign tax payment no payee statement shows (Form 1116 Parts I and II); " +
      "whether one was paid is Cade's question",
  ],
  [
    /^other_state_tax\.[^.]+$/,
    "each fact is a whole return filed with another state (Schedule S, one copy per state); " +
      "whether one was filed is Cade's question. Schedule S lists the fact again while an " +
      "amount inside it (items, tax, the other state's AGI) is missing",
  ],
  [
    /^foreign_tax_credit\.claim_accrued$/,
    "an answer Cade records only when the taxpayer chose, on an earlier return, to credit " +
      "foreign taxes when they accrue (Form 1116 Part II box k); absent, box j (paid)",
  ],
  [
    /^ca_pte_elective_credit\.[^.]+$/,
    "each fact is a whole electing entity's PTE elective tax credit (FTB 3804-CR Part I, one " +
      "row); whether the taxpayer has one is Cade's question. FTB 3804-CR lists the fact again " +
      "while an answer inside it (name, number, credit) is missing",
  ],
  [
    /^ca_prison_inmate_labor_pass_through\.[^.]+$/,
    "each fact is a whole entity's pass-through prison inmate labor credit (FTB 3507 line 3, " +
      "one K-1); whether the taxpayer has one is Cade's question. FTB 3507 lists the fact again " +
      "while an answer inside it (name, number, credit) is missing",
  ],
  [
    /^ca_film_credit\.[^.]+$/,
    "each fact is one whole California Film Commission credit certificate (one FTB 3541); " +
      "whether the taxpayer has one is Cade's question. FTB 3541 lists the fact again while an " +
      "answer inside it (number, year, copyright number, source, amounts, owner, price) is missing",
  ],
  [
    /^ca_passive_credit\.[^.]+$/,
    "each fact is one whole California credit from a passive activity (one FTB 3801-CR " +
      "worksheet row); whether the taxpayer has one is Cade's question. FTB 3801-CR lists the " +
      "fact again while an answer inside it (code, column, amount, the activity's answers) is missing",
  ],
  [
    /^decisions\.scope\.must_file_schedule_p$/,
    "override: Schedule P (540) is attached with more than two credits " +
      "(ca-540-sched-p-inst-2025::sec::b-who-must-file::b01), a count the resolver cannot see " +
      "before the credits are figured; absent, the resolver's own fallbacks decide",
  ],
  [
    /^prior_year\.ca_pte_elective_credit_carryover$/,
    "an answer Cade records only when the user carries a PTE elective tax credit from 2024; " +
      "above 0 it files FTB 3804-CR, which asks for it whenever it files",
  ],
  [
    /^prior_year\.ca_enterprise_zone_(hiring_credit_carryover|sales_tax_credit_carryover|nol_carryovers)$/,
    "prior-year answers Cade records only when the user carries an enterprise zone credit or " +
      "EZ NOL from last year's FTB 3805Z (the zones ended in 2014); any above 0 files FTB 3805Z, " +
      "which then asks for the others",
  ],
  [
    /^prior_year\.ca_amt(_credit_carryover)?$/,
    "an answer Cade records only when the user paid California AMT for 2024 or carries an AMT " +
      "credit from 2024; either above 0 files FTB 3510, which then asks for the other",
  ],
  [
    /^prior_year\.ca_tta_(hiring_credit_carryover|sales_use_tax_credit_carryover|nol_carryovers)$/,
    "an answer Cade records only when the user carries a Targeted Tax Area credit or NOL from " +
      "the 2024 FTB 3809 (the TTA ended in 2012); any one above 0 files FTB 3809, which then " +
      "asks for the others",
  ],
  [
    /^prior_year\.dc_homebuyer_credit_carryforward$/,
    "an answer Cade records only when the user carries a District of Columbia first-time " +
      "homebuyer credit from 2024 (the credit ended for homes bought after 2011); above 0 it " +
      "files Form 8859, which asks for it whenever it files",
  ],
  [
    /^refund\.injured_spouse$/,
    "the whole injured spouse claim (Form 8379): whether a spouse's refund share is applied " +
      "to the other spouse's debt is Cade's question. Form 8379 lists the fact again while its " +
      "share of itemized deductions is missing",
  ],
  [
    /^estimated_tax\.payment\.[^.]+$/,
    "each fact is one 2025 estimated tax payment (Form 1040 line 26, Form 2210 line 11); " +
      "whether one was made is Cade's question",
  ],
  [
    /^estimated_tax\.prior_year_overpayment_applied$/,
    "recorded only when the 2024 return applied an overpayment to 2025 estimated tax",
  ],
  [
    /^estimated_tax\.extension_payment$/,
    "an answer Cade records only when the user paid with Form 4868, an extension payment or " +
      "Form 2350 (Schedule 3 line 10); Schedule 3 files with it",
  ],
  [
    /^estimated_tax_penalty\.withholding_on\.[^.]+$/,
    "each fact is one date of withholding for Form 2210 box D; recorded only when the " +
      "taxpayer has the dates, else withholding counts in four equal parts",
  ],
  [
    /^estimated_tax_penalty\.waiver_request$/,
    "recorded only when the taxpayer asks for a waiver of the penalty (Form 2210 box A or B)",
  ],
  [
    /^prior_year\.unallowed_qualified_electric_vehicle_credit$/,
    "Form 8801 line 20, recorded only when a 2024 qualified electric vehicle credit was not " +
      "allowed because of the old section 30(b)(3)(B) limit; absent means none",
  ],
  [
    /^form_8986\.[^.]+$/,
    "each fact is a whole Form 8986 statement from a partnership, a document; whether one came " +
      "is Cade's question (Form 8978)",
  ],
  [
    /^form_8978_year\.[^.]+$/,
    "each fact is one earlier tax year of Form 8978 (the return's totals and the corrected tax); " +
      "whether an intervening year changed is Cade's question. Form 8978 asks for each first " +
      "affected year, and lists a year again while an answer inside it (the statement, the " +
      "penalty, the extension) is missing",
  ],
  [
    /^farmer_or_fisherman\.gross_income_(2024|2025)$/,
    "the two-thirds gross income test of a farmer or fisherman (FTB 5805F, who files); one " +
      "passing year is enough, so the other year is not asked; with farm income and no passing " +
      "year, FTB 5805 lists each year not stated (5805f/mustFile.ts farmerTestWaitingKeys), and " +
      "so does Form 2210 for Form 2210-F (2210-f/farmerTest.ts)",
  ],
  [
    /^prior_year\.(ca_lump_sum_tax|ca_no_twelve_month_return)$/,
    "FTB 5805F answers Cade records only when the 2024 Form 540 had a line 34 tax (line 8) or " +
      "there was no 12-month 2024 California return (lines 7 to 9 blank); absent means neither",
  ],
  [
    /^ca_farmer_estimated_tax\.(underpayment_paid_on|waiver)$/,
    "FTB 5805F answers Cade records only when the underpayment was paid before April 15, 2026 " +
      "(line 13; absent, April 15) or the taxpayer asks for a waiver (line 16)",
  ],
  [
    /^(ctc|aotc)\.(denied_in_earlier_year|barred_by_irs)$/,
    "Form 8862 answers Cade records only when the taxpayer states that the IRS reduced or " +
      "disallowed the child tax credits or the AOTC in an earlier year, or bars them; absent " +
      "means neither (federal/8862/QUESTIONS.md, Proposals for a discussion)",
  ],
  [
    /^farmer_estimated_tax\.(underpayment_paid_on|section_1062_net_tax_liability)$/,
    "Form 2210-F answers Cade records only when the rest of the underpayment was paid before " +
      "April 15, 2026 by a payment that is not a dated estimated payment (line 14; absent, the " +
      "dated payments or April 15) or the taxpayer made a section 1062(a) election (line 4)",
  ],
  [
    /^prior_year\.ca_tax$/,
    "KNOWN GAP: decides whether FTB 5805 files. Needed only when the CA balance due is " +
      "$500 or more, which the resolver cannot see before evaluation.",
  ],
];

const isDocument = (key: string) =>
  /^(employer|account|payer|employee|vendor|business|dependent|rental\.property|marketplace|lender)\./.test(
    key,
  ) || isK1FactKey(key);
const isOptional = (key: string) => OPTIONAL.some(([pattern]) => pattern.test(key));

interface Outcome {
  values: Map<string, string>;
  pending: Set<string>;
}

function evaluate(
  baseScenario: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[],
): Outcome {
  const scenario = evaluateScenario({
    filing: { id: baseScenario.name, taxYear: baseScenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const values = new Map<string, string>();
  for (const [formId, form] of scenario.forms) {
    values.set(`${formId}.mustFile`, JSON.stringify(form.mustFile.ok && form.mustFile.value));
    if (!form.mustFile.ok || !form.mustFile.value) continue;
    for (const field of form.fields) {
      values.set(field.fieldId, field.result.ok ? JSON.stringify(field.result.value) : "(blank)");
    }
  }
  const { pendingDecisions, pendingFacts } = pendingInputs(scenario);
  return { values, pending: new Set([...pendingDecisions, ...pendingFacts]) };
}

function unreported(base: Outcome, dropped: Outcome): string[] {
  if ([...dropped.pending].some((key) => !base.pending.has(key))) return [];
  const ids = new Set([...base.values.keys(), ...dropped.values.keys()]);
  return [...ids]
    .filter((id) => base.values.get(id) !== dropped.values.get(id))
    .map((id) => `${id}: ${base.values.get(id)} → ${dropped.values.get(id)}`);
}

const SCENARIOS = await loadScenarios();

/*
 * Each case runs synchronously and vitest chains them with microtasks, so the
 * file can hold the worker's event loop past its 60-second RPC timeout on a
 * busy machine. Yield to the event loop before each case.
 */
beforeEach(() => new Promise<void>((resolve) => setImmediate(resolve)));

describe.each(SCENARIOS)("required inputs: $name", (scenario) => {
  const decisions = decisionsWithPreparerStyle(scenario);
  /*
   * Evaluated on first use inside a test, not while the suite is collected:
   * one long synchronous collection of every scenario holds the worker past
   * vitest's RPC timeout on a busy machine.
   */
  let baseOutcome: Outcome | undefined;
  const base = (): Outcome => (baseOutcome ??= evaluate(scenario, scenario.facts, decisions));
  const answers = [
    ...decisions.map((decision) => ({
      key: decision.decisionKey,
      drop: () =>
        evaluate(
          scenario,
          scenario.facts,
          decisions.filter((other) => other !== decision),
        ),
    })),
    ...scenario.facts
      .filter((fact) => !isDocument(fact.key))
      .map((fact) => ({
        key: fact.key,
        drop: () =>
          evaluate(
            scenario,
            scenario.facts.filter((other) => other !== fact),
            decisions,
          ),
      })),
  ].filter((input) => !isOptional(input.key));

  it.each(answers)("missing $key is reported", ({ drop }) => {
    expect(unreported(base(), drop()).slice(0, 3)).toEqual([]);
  });
});
