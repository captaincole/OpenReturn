/*
 * FTB 3807 on a whole return: who files, what it asks, the investor's items,
 * the credit limits through Schedule P (540) Section A2, Form 540 lines 43 to
 * 45, Schedule S line 2, Schedule CA (540) line 9b3, the gaps, and "no facts,
 * nothing changes". The synthetic shemerin (credits) and tarna (NOL)
 * scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import { CA_LAMBRA_KEYS, type CaLambraBusinessFactValue } from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { javindhraScenario } from "../../../../scenarios/synthetic/javindhra/index.js";
import { shemerinScenario as base } from "../../../../scenarios/synthetic/shemerin/index.js";
import { tarnaScenario } from "../../../../scenarios/synthetic/tarna/index.js";

const LAMBRA_KEYS: string[] = Object.values(CA_LAMBRA_KEYS);

const row = (key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category: "other",
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

/* The base facts with some LAMBRA facts replaced; null leaves a key unstated. */
function withLambra(changes: Partial<Record<string, unknown>>, facts = base.facts): TaxFactRow[] {
  const kept = facts.filter((fact) => !(fact.key in changes));
  const added = Object.entries(changes)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => row(key, value));
  return [...kept, ...added];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3807-test", taxYear: base.taxYear },
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
  const form = (id: string) => value("form-3807", id);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3807")?.missingInputs ?? [];
  return { files, field, value, form, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const reasonOf = (result: unknown) => (result as { reason?: string } | undefined)?.reason ?? "";

const BUSINESS = base.facts.find((fact) => fact.key === CA_LAMBRA_KEYS.business)
  ?.value as CaLambraBusinessFactValue;

describe("FTB 3807 who files", () => {
  it("files with the shemerin credit carryovers and asks nothing", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3807")).toBe(true);
    expect(run.files("schedule-p")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("files with an NOL carryover alone, and Schedule P stays off", () => {
    const run = evaluate(tarnaScenario.facts, tarnaScenario.decisions);
    expect(run.files("form-3807")).toBe(true);
    expect(run.files("schedule-p")).toBe(false);
  });

  it("does not file when every carryover is 0", () => {
    const run = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.hiringCreditCarryover]: 0,
        [CA_LAMBRA_KEYS.salesUseTaxCreditCarryover]: 0,
      }),
    );
    expect(run.files("form-3807")).toBe(false);
    expect(run.form540("43_credit_name")).toBe("Other State Tax");
  });

  it("files with the business alone and asks for each carryover", () => {
    const run = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.hiringCreditCarryover]: null,
        [CA_LAMBRA_KEYS.salesUseTaxCreditCarryover]: null,
        [CA_LAMBRA_KEYS.nolCarryovers]: null,
      }),
    );
    expect(run.files("form-3807")).toBe(true);
    expect(run.missing).toEqual([
      CA_LAMBRA_KEYS.hiringCreditCarryover,
      CA_LAMBRA_KEYS.salesUseTaxCreditCarryover,
      CA_LAMBRA_KEYS.nolCarryovers,
    ]);
  });

  it("asks for the business and the income rows when they are missing", () => {
    const run = evaluate(
      withLambra({ [CA_LAMBRA_KEYS.business]: null, [CA_LAMBRA_KEYS.businessIncome]: null }),
    );
    expect(run.missing).toEqual([CA_LAMBRA_KEYS.business, CA_LAMBRA_KEYS.businessIncome]);
    expect(run.form("1.line.7_lambra_income_limitation")).toBeUndefined();
  });

  it("asks for the business when an operator leaves out items E to H or Section A", () => {
    const noReceipts = { ...BUSINESS, grossReceipts: undefined };
    const noSectionA = { ...BUSINESS, property: undefined, payroll: undefined };
    expect(evaluate(withLambra({ [CA_LAMBRA_KEYS.business]: noReceipts })).missing).toEqual([
      CA_LAMBRA_KEYS.business,
    ]);
    expect(evaluate(withLambra({ [CA_LAMBRA_KEYS.business]: noSectionA })).missing).toEqual([
      CA_LAMBRA_KEYS.business,
    ]);
  });

  it("follows the explicit decision", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_3807", false));
    expect(run.files("form-3807")).toBe(false);
    const forced = evaluate(javindhraScenario.facts, [
      ...javindhraScenario.decisions,
      decisionRow({
        userId: javindhraScenario.userId,
        taxYear: 2025,
        key: "decisions.scope.must_file_3807",
        decision: true,
        rationale: "t",
      }),
    ]);
    expect(forced.files("form-3807")).toBe(true);
  });
});

describe("FTB 3807 items and Part II", () => {
  it("fills items A to H and line 2 for an operator", () => {
    const run = evaluate(base.facts);
    expect(run.form("0.header.a_entity_type")).toBe("individual");
    expect(run.form("0.header.id_number_type")).toBe("ssn_or_itin");
    expect(run.form("0.header.d_lambra_name")).toBe("Tustin Legacy");
    expect(run.form("0.header.e_principal_business_activity_code")).toBe("332710");
    expect(run.form("0.header.h_total_asset_value")).toBe(410_000);
    expect(run.form("0.header.sos_file_number")).toBeUndefined();
    expect(run.form("0.line.2_average_apportionment_percentage")).toBe("0.7750");
  });

  it("leaves items E to H and line 2 blank for an investor with a K-1 only", () => {
    const investor: CaLambraBusinessFactValue = {
      businessName: "Harbor Fabrication LLC",
      businessAddress: "77 Dock Street, Tustin, CA 92780",
      lambraName: "Tustin Legacy",
      operatesBusiness: false,
    };
    const run = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.business]: investor,
        [CA_LAMBRA_KEYS.businessIncome]: [
          {
            line: "pass_through",
            description: "Harbor Fabrication LLC",
            amount: 50_000,
            percentage: 0.8,
          },
        ],
      }),
    );
    expect(run.missing).toEqual([]);
    expect(run.form("0.header.b_lambra_business_name")).toBe("Harbor Fabrication LLC");
    expect(run.form("0.header.e_principal_business_activity_code")).toBeUndefined();
    expect(run.form("0.header.g_gross_annual_receipts")).toBeUndefined();
    expect(run.form("0.line.2_average_apportionment_percentage")).toBeUndefined();
    expect(run.form("1.line.1_trade_or_business_income")).toBe(40_000);
  });

  it("prints 1.0000 for a business wholly within the former LAMBRA", () => {
    const wholly = {
      ...BUSINESS,
      property: undefined,
      payroll: undefined,
      whollyWithinLambra: true,
    };
    const run = evaluate(withLambra({ [CA_LAMBRA_KEYS.business]: wholly }));
    expect(run.form("0.line.2_average_apportionment_percentage")).toBe("1.0000");
    expect(run.form("1.line.1_trade_or_business_income")).toBe(160_000);
  });
});

describe("FTB 3807 credits through Schedule P (540)", () => {
  it("offers the credit up to the tax on LAMBRA income, and Schedule P limits it to the tax over TMT", () => {
    const run = evaluate(base.facts);
    const line6 = (id: string) => run.value("schedule-p", `2.part3.6_${id}`);
    expect(run.form("1.line.7_lambra_income_limitation")).toBe(7_971);
    expect([
      line6("credit_code"),
      line6("credit_amount_col_a"),
      line6("credit_used_col_b"),
    ]).toEqual(["198", 7_971, 6_095]);
    expect(line6("credit_carryover_col_d")).toBe(1_876);
    expect(run.form("0.line.1c_total_credit_carryover")).toBe(6_095);
    expect(run.form540("43_credit_amount")).toBe(6_095);
    expect(run.form540("43_credit_code")).toBe("198");
    // Schedule S line 2 leaves the LAMBRA credit out of the tax, as it does every other credit.
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(11_312 - 6_095);
  });

  it("never uses more than line 7, nor more than the carryovers", () => {
    const small = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.hiringCreditCarryover]: 300,
        [CA_LAMBRA_KEYS.salesUseTaxCreditCarryover]: 400,
      }),
    );
    expect(small.form("0.line.1c_total_credit_carryover")).toBe(700);
    expect(small.form("1.line.9b_sales_use_tax_credit_carryover_col_g")).toBe(0);
    const lowIncome = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.businessIncome]: [
          { line: "schedule_c", description: "shop", amount: 20_000 },
        ],
      }),
    );
    const line7 = lowIncome.form("1.line.7_lambra_income_limitation") as number;
    expect(line7).toBeGreaterThan(0);
    expect(lowIncome.form("0.line.1c_total_credit_carryover")).toBe(line7);
  });

  it("takes no credit when the LAMBRA business income is a loss", () => {
    const run = evaluate(
      withLambra({
        [CA_LAMBRA_KEYS.businessIncome]: [
          { line: "schedule_c", description: "shop", amount: -30_000 },
        ],
      }),
    );
    expect(run.form("1.line.1_trade_or_business_income")).toBe(0);
    expect(run.form("1.line.7_lambra_income_limitation")).toBe(0);
    expect(run.form("0.line.1c_total_credit_carryover")).toBe(0);
    expect(run.form("1.line.9b_sales_use_tax_credit_carryover_col_g")).toBe(9_000);
    expect(run.form540("43_credit_name")).toBe("Other State Tax");
  });

  it("is a gap when the decision says Schedule P (540) does not file", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_schedule_p", false));
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
    expect(reasonOf(run.field("form-3807", "0.line.1a_hiring_credit_carryover"))).toContain(
      "Schedule P (540)",
    );
  });

  it("is a gap on a Form 540NR return", () => {
    const run = evaluate(base.facts, [
      ...withDecision("decisions.scope.must_file_ca_540", false),
      decision("decisions.scope.must_file_540nr", true),
    ]);
    expect(run.files("form-3807")).toBe(true);
    expect(reasonOf(run.field("form-3807", "1.line.7_lambra_income_limitation"))).toContain(
      "540NR",
    );
  });

  it("leaves Schedule Z Parts III and IV blank for an individual", () => {
    const run = evaluate(base.facts);
    expect(run.form("1.line.10_hiring_credit_carryover_col_b")).toBeUndefined();
    expect(run.form("1.line.13_sales_use_tax_credit_carryover_col_d")).toBeUndefined();
    expect(run.form("1.line.8b_hiring_credit_carryover_col_c")).toBeUndefined();
    expect(run.form("1.line.2_average_apportionment_percentage")).toBeUndefined();
  });
});

describe("FTB 3807 NOL deduction and Schedule CA (540) line 9b3", () => {
  it("deducts the tarna carryovers up to the LAMBRA business income", () => {
    const run = evaluate(tarnaScenario.facts, tarnaScenario.decisions);
    expect([
      run.form("0.line.3a_nol_carryover_prior_years"),
      run.form("0.line.3b_nol_deduction_current_year"),
      run.form("0.line.3c_nol_carryover_future_years"),
    ]).toEqual([70_000, 54_000, 16_000]);
    expect(run.value("schedule-ca", "2.line.b9b3_subtractions")).toBe(54_000);
    expect(run.value("schedule-ca", "2.line.b10_subtractions")).toBe(54_000);
    expect(run.form540("14_ca_adjustments_subtractions")).toBe(54_000);
    // No credit carryover: Schedule Z is blank and Form 540 line 43 has no credit.
    expect(run.form("1.line.7_lambra_income_limitation")).toBeUndefined();
    expect(run.form540("43_credit_amount")).toBeUndefined();
  });

  it("is a gap for a carryover from a year outside Worksheet II", () => {
    const run = evaluate(
      withLambra(
        { [CA_LAMBRA_KEYS.nolCarryovers]: [{ yearOfLoss: 2015, carryover: 10_000 }] },
        tarnaScenario.facts,
      ),
      tarnaScenario.decisions,
    );
    expect(isGap(run.field("form-3807", "0.line.3b_nol_deduction_current_year"))).toBe(true);
    expect(isGap(run.field("schedule-ca", "2.line.b9b3_subtractions"))).toBe(true);
  });

  it("reduces Schedule Z line 5 by the deduction", () => {
    const run = evaluate(
      withLambra({ [CA_LAMBRA_KEYS.nolCarryovers]: [{ yearOfLoss: 2013, carryover: 24_000 }] }),
    );
    expect(run.form("0.line.3b_nol_deduction_current_year")).toBe(24_000);
    expect(run.form("1.line.4_lambra_nol_deduction")).toBe(24_000);
    expect(run.form("1.line.5_lambra_taxable_income")).toBe(100_000);
  });
});

describe("no LAMBRA facts, nothing changes", () => {
  it("leaves line 9b3 and Schedule P line 8 with their reasons", () => {
    const run = evaluate(javindhraScenario.facts, javindhraScenario.decisions);
    expect(run.files("form-3807")).toBe(false);
    expect(reasonOf(run.field("schedule-ca", "2.line.b9b3_subtractions"))).toContain(
      "FTB Forms 3805Z, 3807, or 3809",
    );
    expect(reasonOf(run.field("schedule-p", "2.part3.8_credit_amount_col_a"))).toContain(
      "Section A2 line 8",
    );
  });

  it("gives the shemerin return without its LAMBRA facts no LAMBRA line", () => {
    const facts = base.facts.filter((fact) => !LAMBRA_KEYS.includes(fact.key));
    const run = evaluate(facts);
    expect(run.files("form-3807")).toBe(false);
    expect(run.form540("43_credit_name")).toBe("Other State Tax");
    expect(run.form540("44_credit_name")).toBeUndefined();
  });
});
