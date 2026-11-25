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
    /^casualty\.[^.]+$/,
    "each fact is a whole casualty event (Form 4684); whether one happened is Cade's question",
  ],
  [
    /^armed_forces_move\.[^.]+$/,
    "each fact is a whole Armed Forces move (Form 3903); whether one happened is Cade's question",
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
    /^business_property_sale\.(?!nonrecaptured_section_1231_losses$)[^.]+$/,
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
    /^section_179_recapture\.[^.]+$/,
    "a Form 4797 Part IV fact is the whole recapture of one property; whether business use " +
      "dropped to 50% or less is Cade's question",
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
    /^prior_year\.ca_amt(_credit_carryover)?$/,
    "an answer Cade records only when the user paid California AMT for 2024 or carries an AMT " +
      "credit from 2024; either above 0 files FTB 3510, which then asks for the other",
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
