/*
 * Form 8621 on a whole return: who files, one copy per fund, the lines of
 * other forms that take its results, and the cases the engine does not
 * figure. The synthetic leane scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  makePficFundFactKey,
  type PficFundFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { nordicIndex, pacificRim, rhineValley } from "../../../scenarios/synthetic/leane/facts.js";
import { leaneScenario as base } from "../../../scenarios/synthetic/leane/index.js";

const isFund = (fact: TaxFactRow) => fact.key.startsWith("pfic_fund.");
const otherFacts = base.facts.filter((fact) => !isFund(fact));
const template = base.facts.find(isFund)!;

const fund = (slug: string, value: PficFundFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makePficFundFactKey(slug),
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

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8621-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extra],
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
  const copies = result.filingInfo.form8621Totals?.filed.length ?? 0;
  return { files, field, value, copies };
}

const UNSUPPORTED = { ok: false, unsupported: true };
const smallFund: PficFundFactValue = {
  fundName: "Small Fund",
  fundAddress: "1 Main Street, Dublin, Ireland",
  shareClass: "Ordinary",
  acquiredDate: "2020-01-15",
  sharesAtYearEnd: 100,
  valueAtYearEnd: 20000,
  regime: "section_1291",
};

describe("No fund fact: nothing changes", () => {
  it("Form 8621 does not file; the lines that take its amounts keep what they had", () => {
    const run = evaluate([]);
    expect(run.files("form-8621")).toBe(false);
    expect(run.value("form-1040", "line.8")).toBeUndefined();
    expect(run.value("form-1040", "line.3b")).toBe(0); // as before: no dividend fact sums to 0
    expect(run.field("form-1040", "line.16_from_other_form")).toMatchObject(UNSUPPORTED);
    expect(run.files("schedule-d")).toBe(false);
    expect(run.files("schedule-b")).toBe(false);
  });
});

describe("Who files", () => {
  it("leane: one copy for each of three funds", () => {
    const run = evaluate([
      fund("rhine", rhineValley),
      fund("nordic", nordicIndex),
      fund("rim", pacificRim),
    ]);
    expect(run.files("form-8621")).toBe(true);
    expect(run.copies).toBe(3);
  });

  it("a section 1291 fund with no excess distribution under $25,000 does not file", () => {
    const run = evaluate([fund("small", smallFund)]);
    expect([run.files("form-8621"), run.copies]).toEqual([false, 0]);
  });

  it("above $25,000 in all PFIC stock it files", () => {
    const run = evaluate([fund("small", { ...smallFund, valueAtYearEnd: 25001 })]);
    expect([run.files("form-8621"), run.copies]).toEqual([true, 1]);
  });

  it("a joint return has a $50,000 limit", () => {
    const joint = [
      ...base.decisions.filter((row) => row.decisionKey !== "decisions.scope.filing_status"),
      decision("decisions.scope.filing_status", "married_filing_jointly"),
    ];
    const run = evaluate([fund("small", { ...smallFund, valueAtYearEnd: 40000 })], joint);
    expect(run.files("form-8621")).toBe(false);
  });

  it("a QEF or a marked fund files at any value", () => {
    const run = evaluate([
      fund("rim", { ...pacificRim, valueAtYearEnd: 1000, prior1294Elections: [] }),
    ]);
    expect(run.files("form-8621")).toBe(true);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [fund("rhine", rhineValley)],
      [...base.decisions, decision("decisions.scope.must_file_8621", false)],
    );
    expect(run.files("form-8621")).toBe(false);
  });
});

describe("Lines of other forms", () => {
  it("the section 1291 tax goes on line 16 with box 3 and 1291TAX", () => {
    const run = evaluate([fund("rhine", rhineValley)]);
    expect(run.value("form-1040", "line.16_from_other_form")).toBe(true);
    expect(run.value("form-1040", "line.16_other_form_number")).toBe("1291TAX 1,305");
    expect(run.value("schedule-2", "1.line.17p_interest_form8621_line16f_section_1291_fund")).toBe(
      252,
    );
  });

  it("without Schedule B, the nonexcess dividend still reaches line 3b", () => {
    const small = {
      ...rhineValley.section1291!,
      distributions: [{ date: "2025-06-20", amount: 1000, usdPerUnit: 1.1 }],
    };
    const run = evaluate([
      fund("rhine", { ...rhineValley, section1291: { ...small, precedingDistributions: 3000 } }),
    ]);
    expect(run.files("schedule-b")).toBe(false);
    expect(run.value("form-1040", "line.3b")).toBe(1100);
  });

  it("a fund the engine cannot figure makes the lines that take its amounts unsupported", () => {
    const run = evaluate([fund("rhine", { ...rhineValley, acquiredDate: "sometime" })]);
    expect(run.field("schedule-1", "0.line.8z")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.16")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-8621", "0.line.3_shares_held_year_end")).toMatchObject(UNSUPPORTED);
  });

  it("a line 14c loss makes Schedule D line 11 unsupported: the engine does not place it", () => {
    const sale = {
      date: "2025-08-14",
      amountRealized: 20000,
      adjustedBasis: 30000,
      unreversedInclusions: 4000,
    };
    const run = evaluate([fund("nordic", { ...nordicIndex, disposition: sale })]);
    expect(run.value("form-8621", "1.line.14c_disposition_loss_over_inclusions")).toBe(-6000);
    expect(run.field("schedule-d", "0.line.11_long_term_gain_other_forms")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("a section 1291 fund sold at a loss: Schedule D files, and line 11 is unsupported", () => {
    const sale = { date: "2025-06-30", amountRealized: 30000, adjustedBasis: 40000 };
    const lossFund = { ...smallFund, acquiredDate: "2020-01-10", disposition: sale };
    const run = evaluate([fund("small", lossFund)]);
    // A loss is no gain: under $25,000 in all PFIC stock, Form 8621 itself does not file.
    expect(run.files("form-8621")).toBe(false);
    expect(run.files("schedule-d")).toBe(true);
    expect(run.field("schedule-d", "0.line.11_long_term_gain_other_forms")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("a section 1291 fund sold at a gain: the gain is an excess distribution, not Schedule D", () => {
    const sale = { date: "2025-06-30", amountRealized: 40000, adjustedBasis: 30000 };
    const gainFund = { ...smallFund, acquiredDate: "2020-01-10", disposition: sale };
    const run = evaluate([fund("small", gainFund)]);
    expect(run.value("form-8621", "2.line.15f_gain_or_loss_disposition")).toBe(10000);
    expect(run.files("schedule-d")).toBe(false);
  });
});

describe("Branches of the form", () => {
  it("Election B: lines 8a–8e, and lines 9a–9c unsupported", () => {
    const qef = {
      ...pacificRim,
      elections: { extendTime: true },
      qef: { ...pacificRim.qef!, distributions: 1000 },
    };
    const run = evaluate([fund("rim", qef)]);
    expect(run.value("form-8621", "0.line.election_b_extend_time_payment")).toBe(true);
    expect(run.value("form-8621", "1.line.8e_undistributed_qef_earnings")).toBe(3841 + 2215 - 1000);
    expect(run.field("form-8621", "1.line.9c_deferred_tax_election_b")).toMatchObject(UNSUPPORTED);
  });

  it("Election C on stock held before 2025: a deemed sale on line 15f, no Part IV", () => {
    const first = { ...nordicIndex, elections: { markToMarket: true }, disposition: undefined };
    const run = evaluate([fund("nordic", first)]);
    expect(run.value("form-8621", "2.line.15f_gain_or_loss_disposition")).toBe(27150);
    expect(run.value("form-8621", "1.line.10c_mark_to_market_gain_loss")).toBeUndefined();
    expect(run.value("form-8621", "0.line.5a_section_1291_box")).toBe(true);
  });

  it("Election E: the deemed dividend on line 15e(2), lines 16b–16f unsupported", () => {
    const deemed = {
      ...rhineValley,
      elections: { deemedDividend: true },
      section1291: { deemedDividend: 5000 },
    };
    const run = evaluate([fund("rhine", deemed)]);
    expect(run.value("form-8621", "2.line.15e2_excess_distribution_us_dollars")).toBe(5000);
    expect(run.field("form-8621", "2.line.16b_current_year_and_pre_pfic_amounts")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("the qualifying insurance corporation election alone: the names and numbers, no Part I", () => {
    const run = evaluate([fund("rhine", { ...rhineValley, qualifyingInsuranceElection: true })]);
    expect(run.value("form-8621", "0.header.qualifying_insurance_corporation_election")).toBe(true);
    expect(run.value("form-8621", "0.header.pfic_name")).toBe(rhineValley.fundName);
    expect(run.value("form-8621", "0.line.3_shares_held_year_end")).toBeUndefined();
  });

  it("line 20 is unsupported for each outstanding section 1294 election", () => {
    const run = evaluate([fund("rim", pacificRim)]);
    expect(run.field("form-8621", "3.line.20_interest_accrued_deferred_tax_col_ii")).toMatchObject(
      UNSUPPORTED,
    );
    expect(
      run.value("form-8621", "3.line.20_interest_accrued_deferred_tax_col_iii"),
    ).toBeUndefined();
  });
});

describe("Form 8960 line 5b and Schedule 2 line 17z on a return with a fund", () => {
  const withElection = { ...pacificRim, qef: { ...pacificRim.qef!, section1411gElection: true } };
  const carryover: TaxFactRow = {
    ...template,
    id: "f-carryover",
    category: "capital_gains",
    key: CAPITAL_LOSS_CARRYOVER_KEYS.longTerm,
    value: 5000,
  };

  it("a QEF without the section 1.1411-10(g) election: line 5b takes line 7c back out", () => {
    expect(evaluate([fund("rim", pacificRim)]).value("form-8960", "0.line.5b")).toBe(-2215);
  });

  it("with the election the gain stays on line 5a: line 5b is blank", () => {
    const run = evaluate([fund("rim", withElection)]);
    expect(run.field("form-8960", "0.line.5b")).not.toMatchObject(UNSUPPORTED);
    expect(run.value("form-8960", "0.line.5b")).toBeUndefined();
  });

  it("a capital loss carried in is a line 5b item the engine does not figure", () => {
    const run = evaluate([fund("rim", withElection), carryover]);
    expect(run.field("form-8960", "0.line.5b")).toMatchObject(UNSUPPORTED);
  });

  it("no section 1294 election ends: line 17z keeps the other taxes' gap and says so", () => {
    const run = evaluate([fund("rhine", rhineValley)]);
    expect(run.field("schedule-2", "1.line.17z_other_taxes_amount")).toMatchObject({
      ...UNSUPPORTED,
      reason: expect.stringContaining("Form 8621 line 23 is blank"),
    });
  });
});
