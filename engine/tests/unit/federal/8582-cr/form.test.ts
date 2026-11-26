/*
 * Form 8582-CR on a whole return: who files, the answers it asks, the gaps,
 * Part VI, the tax attributable to an amount, and what Form 3800 takes. The
 * synthetic arram and beldeine scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeCreditCarryoverFactKey,
  makeGeneralBusinessCreditFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  SPOUSE_KEYS,
  type CreditCarryoverFactValue,
  type GeneralBusinessCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form8582CRBindings } from "../../../../src/federal/8582-cr/bindings.js";
import catalogJson from "../../../../src/federal/8582-cr/catalog.json";
import type { PassiveLimitInfo } from "../../../../src/federal/8582-cr/filingInfo.js";
import { taxAttributableOf } from "../../../../src/federal/8582-cr/returnInputs.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { arramScenario as base } from "../../../scenarios/synthetic/arram/index.js";
import { beldeineScenario } from "../../../scenarios/synthetic/beldeine/index.js";
import { renaldScenario } from "../../../scenarios/synthetic/renald/index.js";

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});
const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const isCredit = (fact: TaxFactRow) => fact.key.startsWith("general_business_credit.");

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  scenario = base,
) {
  const result = evaluateScenario({
    filing: { id: "form-8582-cr-test", taxYear: scenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const line = (id: string) => value("form-8582-cr", id);
  const missing = result.forms.get("form-8582-cr")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_37 = "1.line.37_passive_activity_credit_allowed";
const stated = (slug: string, value: GeneralBusinessCreditFactValue) =>
  row("other", makeGeneralBusinessCreditFactKey(slug), value);
const carried = (slug: string, value: CreditCarryoverFactValue) =>
  row("other", makeCreditCarryoverFactKey(slug), value);

describe("Form 8582-CR bindings", () => {
  it("give every catalog field one rule, and no rule without a field", () => {
    const bound = Object.keys(form8582CRBindings()).sort();
    const fields = catalogJson.fields
      .map((field) => field.fieldId.slice("form-8582-cr.".length))
      .sort();
    expect(bound).toEqual(fields);
  });
});

describe("who files Form 8582-CR (who-must-file::b01)", () => {
  it("no passive credit: no Form 8582-CR, and the rest of the return is as before", () => {
    const run = evaluate(base.facts.filter((fact) => !isCredit(fact)));
    expect(run.files("form-8582-cr")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
    expect(run.value("form-1040", "line.15")).toBe(96_250);
  });

  it("a return whose credits are all nonpassive does not file it (renald)", () => {
    const run = evaluate(renaldScenario.facts, renaldScenario.decisions, renaldScenario);
    expect(run.files("form-8582-cr")).toBe(false);
    expect(run.files("form-3800")).toBe(true);
  });

  it("a passive credit files it, and the explicit decision wins", () => {
    expect(evaluate(base.facts).files("form-8582-cr")).toBe(true);
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8582_cr", false),
    ]);
    expect(run.files("form-8582-cr")).toBe(false);
    expect(isGap(run.field("form-3800", "0.line.3_passive_credits_allowed"))).toBe(true);
  });
});

describe("the answers it asks", () => {
  it("a passive credit with no activity is asked again, and the form waits", () => {
    const bare = stated("bare", { sourceForm: "8826", line: "1e", amount: 500, passive: true });
    const run = evaluate([...base.facts, bare]);
    expect(run.missing).toContain(bare.key);
    expect(run.line(LINE_37)).toBeUndefined();
  });

  it("a low-income housing credit without the 1990 answer is asked again", () => {
    const housing = stated("housing", {
      sourceForm: "8586",
      line: "4d",
      amount: 500,
      passive: true,
      passiveActivity: { name: "Apartments", rentalRealEstate: true },
    });
    expect(evaluate([...base.facts, housing]).missing).toContain(housing.key);
  });

  it("a separate return asks whether the spouses lived apart all year", () => {
    const decisions = base.decisions.map((each) =>
      each.decisionKey === "decisions.scope.filing_status"
        ? { ...each, decision: "married_filing_separately" }
        : each,
    );
    const run = evaluate(base.facts, decisions);
    expect(run.missing).toContain(SPOUSE_KEYS.livedApartAllYear);
  });

  it("a separate return living with the spouse: every credit on line 4, no Parts II to IV", () => {
    const decisions = base.decisions.map((each) =>
      each.decisionKey === "decisions.scope.filing_status"
        ? { ...each, decision: "married_filing_separately" }
        : each,
    );
    const spouse = [
      row("filing_status", SPOUSE_KEYS.livedApartAllYear, false),
      row("filing_status", SPOUSE_KEYS.livedApartLastSixMonths, false),
      row("filing_status", SPOUSE_KEYS.itemizesSeparately, false),
      row("identity", SPOUSE_KEYS.firstName, "Liandrin"),
      row("identity", SPOUSE_KEYS.lastName, "Thornwell"),
      row("identity", SPOUSE_KEYS.ssn, "400-00-8584"),
    ];
    const run = evaluate([...base.facts, ...spouse], decisions);
    expect(run.line("0.line.4a_other_passive_credits")).toBe(8_700);
    expect(run.line("0.line.4b_other_passive_prior_unallowed")).toBe(2_100);
    expect(run.line("0.line.1a_rental_active_credits")).toBeUndefined();
    expect(run.line("0.line.8_smaller_line_1c_or_7")).toBeUndefined();
    expect(run.line(LINE_37)).toBe(0);
  });
});

describe("the gaps", () => {
  it("a publicly traded partnership's credit is a gap on its Form 3800 line, the form still computes", () => {
    const ptp = stated("ptp", {
      sourceForm: "5884",
      line: "4b",
      amount: 700,
      passive: true,
      passiveActivity: {
        name: "Listed LP",
        rentalRealEstate: false,
        publiclyTradedPartnership: true,
      },
    });
    const run = evaluate([...base.facts, ptp]);
    expect(run.line(LINE_37)).toBe(4_180);
    expect(isGap(run.field("form-3800", "3.part3.4b_form_5884_col_g"))).toBe(true);
  });

  it("a recaptured passive carryover is a gap on every line", () => {
    const recaptured = carried("recaptured", {
      sourceForm: "5884",
      line: "4b",
      originYear: 2022,
      amount: 900,
      passive: true,
      passiveActivity: { name: "Bakery", rentalRealEstate: false },
      recapturedOrAdjusted: 100,
    });
    const run = evaluate([...base.facts, recaptured]);
    expect(isGap(run.field("form-8582-cr", LINE_37))).toBe(true);
    expect(isGap(run.field("form-8582-cr", "0.line.5_total_passive_credits"))).toBe(true);
  });

  it("modified AGI with a K-1 on the return is a gap where Parts II and III need it", () => {
    const rental = stated("rental", {
      sourceForm: "8826",
      line: "1e",
      amount: 1_000,
      passive: true,
      passiveActivity: { name: "Duplex", rentalRealEstate: true, activelyParticipated: true },
    });
    const run = evaluate(
      [...beldeineScenario.facts, rental],
      beldeineScenario.decisions,
      beldeineScenario,
    );
    expect(isGap(run.field("form-8582-cr", "0.line.10_modified_agi"))).toBe(true);
    expect(isGap(run.field("form-8582-cr", LINE_37))).toBe(true);
  });
});

describe("modified AGI with net passive income (line-10::b01, decision A45)", () => {
  /*
   * arram with W-2 wages of $100,000 and the duplex at a $10,000 profit (rents
   * $40,000, expenses $30,000), and $15,000 of Worksheet 1 credits. AGI is
   * $110,000 and taxable income $94,250, all in the 22% rows of the Tax Table.
   */
  const withIncome = (fact: TaxFactRow): TaxFactRow => {
    const value = fact.value as Record<string, unknown>;
    if (fact.key === makeW2FactKey("south-plains-regional")) {
      return { ...fact, value: { ...value, box1: 100_000 } };
    }
    if (fact.key === makeRentalFactKey("cedar-lane-duplex")) {
      return { ...fact, value: { ...value, rentsReceived: 40_000 } };
    }
    return fact;
  };
  const credit = stated("duplex-empowerment-zone", {
    sourceForm: "8844",
    line: "3",
    amount: 15_000,
    passive: true,
    passiveActivity: { name: "Duplex", rentalRealEstate: true, activelyParticipated: true },
  });
  // isCredit drops this year's credits and the carryovers (one key prefix).
  const facts = [...base.facts.filter((fact) => !isCredit(fact)).map(withIncome), credit];

  it("lines 10 to 16 count the $10,000 of Form 8582 line 3 in modified AGI", () => {
    const run = evaluate(facts);
    expect(run.value("form-8582", "0.line.3_combined")).toBe(10_000);
    expect(run.value("form-1040", "line.11a")).toBe(110_000);
    expect(run.line("0.line.6_tax_net_passive_income")).toBe(2_200);
    expect(run.line("0.line.7_credits_over_passive_tax")).toBe(12_800);
    expect(run.line("0.line.10_modified_agi")).toBe(110_000);
    expect(run.line("0.line.11_threshold_less_magi")).toBe(40_000);
    expect(run.line("0.line.12_half_of_line_11")).toBe(20_000);
    expect(run.line("0.line.13_form_8582_line_9")).toBeUndefined();
    expect(run.line("0.line.15_tax_on_line_14")).toBe(4_400);
    expect(run.line("0.line.16_smaller_line_8_or_15")).toBe(4_400);
    expect(run.line(LINE_37)).toBe(6_600);
    expect(run.value("schedule-3", "0.line.6a")).toBe(6_600);
  });
});

describe("Part VI, the election to increase basis (line-38::b01)", () => {
  const election = (slug: string, name: string) =>
    carried(slug, {
      sourceForm: "3468 Part VII",
      line: "4k",
      originYear: 2022,
      amount: 1_500,
      passive: true,
      passiveActivity: { name, rentalRealEstate: true },
      basisIncreaseElection: {
        propertyDescription:
          "Restored brick facade and roof of the 1911 Granary building on Avenue Q",
        amount: 1_200,
      },
    });

  it("checks line 38, names the activity and the property, and lowers line 2b by line 41", () => {
    const run = evaluate([...base.facts, election("granary", "Granary Lofts")]);
    expect(run.line("1.line.38_elect_increase_basis")).toBe(true);
    expect(run.line("1.line.39_passive_activity_disposed_name")).toBe("Granary Lofts");
    expect(run.line("1.line.40_credit_property_description")).toBe(
      "Restored brick facade and roof of the",
    );
    expect(run.line("1.line.40_credit_property_description_line2")).toBe(
      "1911 Granary building on Avenue Q",
    );
    expect(run.line("1.line.41_unallowed_credit_reduced_basis")).toBe(1_200);
    expect(run.line("0.line.2b_rehab_pre_1990_prior_unallowed")).toBe(400 + 300);
  });

  it("no election: line 38 unchecked and lines 39 to 41 blank", () => {
    const none = evaluate(base.facts);
    expect(none.line("1.line.38_elect_increase_basis")).toBe(false);
    expect(none.line("1.line.39_passive_activity_disposed_name")).toBeUndefined();
  });

  it("two elections are a gap", () => {
    const two = evaluate([
      ...base.facts,
      election("granary", "Granary Lofts"),
      election("depot", "Depot Lofts"),
    ]);
    expect(isGap(two.field("form-8582-cr", "1.line.39_passive_activity_disposed_name"))).toBe(true);
  });
});

describe("the tax attributable to an amount (line-35::b01)", () => {
  it("the example's taxable income of $305,000 on a 2025 joint return: $6,000 on $25,000 (24%)", () => {
    const form = { "form-1040.line.15": 305_000, "form-1040.line.3a": 0 };
    const info: PassiveLimitInfo = { filingStatus: "married_filing_jointly", mustFile: {} };
    const tax = taxAttributableOf(form, info);
    expect(typeof tax).toBe("function");
    expect((tax as (amount: number) => number)(25_000)).toBe(6_000);
  });

  it("an amount larger than taxable income takes the whole tax, never more", () => {
    const form = { "form-1040.line.15": 10_000, "form-1040.line.3a": 0 };
    const info: PassiveLimitInfo = { filingStatus: "single", mustFile: {} };
    const tax = taxAttributableOf(form, info) as (amount: number) => number;
    expect(tax(25_000)).toBe(tax(10_000));
    expect(tax(0)).toBe(0);
  });

  it("a return whose line 16 uses Form 8615 is a gap", () => {
    const info: PassiveLimitInfo = {
      filingStatus: "single",
      mustFile: { "form-8615": { decisionKey: "test", value: true, derivation: undefined } },
    };
    expect(isGap(taxAttributableOf({ "form-1040.line.15": 50_000 }, info))).toBe(true);
  });
});

describe("what Form 3800 takes (beldeine)", () => {
  it("line 24 and line 33 add the allowed credits of their tiers, and Schedule 3 takes line 38", () => {
    const run = evaluate(beldeineScenario.facts, beldeineScenario.decisions, beldeineScenario);
    expect(run.line("0.line.6_tax_net_passive_income")).toBe(3_500);
    const line24 = run.value("form-3800", "1.line.24_empowerment_zone_passive_credit_allowed");
    const line33 = run.value("form-3800", "1.line.33_specified_passive_credits_allowed");
    expect((line24 as number) + (line33 as number)).toBe(run.line(LINE_37));
    expect(run.value("form-3800", "0.line.3_passive_credits_allowed")).toBeUndefined();
    expect(run.value("schedule-3", "0.line.6a")).toBe(12_250);
  });
});
