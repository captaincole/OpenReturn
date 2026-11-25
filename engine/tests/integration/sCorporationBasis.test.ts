import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  isK1FactKey,
  isK1HoldingFactKey,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { elaidaScenario } from "../scenarios/synthetic/elaida";
import { garethScenario } from "../scenarios/synthetic/gareth";
import { lanScenario } from "../scenarios/synthetic/lan";
import type { Scenario } from "../types";

function run(scenario: Scenario, facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
    authEmail: null,
  });
  const field = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    return result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId)?.result;
  };
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { result, field, value, files };
}

const editK1 = (
  facts: TaxFactRow[],
  edit: (k1: SCorporationK1FactValue) => SCorporationK1FactValue,
) =>
  facts.map((fact) =>
    isK1FactKey(fact.key) ? { ...fact, value: edit(fact.value as SCorporationK1FactValue) } : fact,
  );

const editHolding = (
  facts: TaxFactRow[],
  edit: (holding: K1HoldingFactValue) => K1HoldingFactValue,
) =>
  facts.map((fact) =>
    isK1HoldingFactKey(fact.key)
      ? { ...fact, value: edit(fact.value as K1HoldingFactValue) }
      : fact,
  );

const unsupportedReason = (result: ReturnType<ReturnType<typeof run>["field"]>) =>
  result && !result.ok && result.unsupported ? result.reason : undefined;

describe("an S corporation's portfolio and tax-exempt items (lan)", () => {
  const facts = editK1(lanScenario.facts, (k1) => ({
    ...k1,
    boxes: [...k1.boxes, { box: "4", amount: 120 }, { box: "16", code: "A", amount: 250 }],
  }));
  const withItems = run(lanScenario, facts);

  it("adds box 4 to Form 1040 line 2b and box 16 code A to line 2a", () => {
    expect(withItems.value("form-1040.line.2a")).toBe(250);
    expect(withItems.value("form-1040.line.2b")).toBe(120);
  });

  it("files no Form 7203: income and tax-exempt income need no basis computation", () => {
    expect(withItems.files("form-7203")).toBe(false);
    expect(withItems.value("schedule-e.1.line.28_row_a_col_e_basis_computation_required")).toBe(
      false,
    );
  });
});

describe("a loss waits for the shareholder's stock basis (lan)", () => {
  const facts = editK1(lanScenario.facts, (k1) => ({
    ...k1,
    boxes: [{ box: "1", amount: -5000 }],
  }));
  const loss = run(lanScenario, facts);

  it("files Form 7203 and asks for the holding, with the lines blank", () => {
    expect(loss.files("form-7203")).toBe(true);
    expect(loss.value("form-7203.0.line.1_stock_basis_beginning")).toBeUndefined();
    expect(pendingInputs(loss.result).pendingFacts).toContain("k1.holding.malkier-fencing");
    expect(loss.value("form-1040.line.11a")).toBeUndefined();
  });
});

describe("the basis limit in proportion (elaida)", () => {
  it("allows the whole loss when the basis covers it, and the statement's QBI unscaled", () => {
    const facts = editHolding(elaidaScenario.facts, (holding) => ({
      ...holding,
      stockBasisAtStart: 100000,
    }));
    const covered = run(elaidaScenario, facts);
    expect(covered.value("schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed")).toBe(60000);
    expect(covered.value("form-7203.1.line.35_ordinary_business_loss_col_e")).toBeUndefined();
    expect(covered.value("form-8995.0.line.1iii_c")).toBe(-60000);
  });

  const withLoss = (amount: number) =>
    editHolding(
      editK1(elaidaScenario.facts, (k1) => ({
        ...k1,
        boxes: k1.boxes.map((entry) => (entry.box === "1" ? { ...entry, amount } : entry)),
      })),
      (holding) => ({ ...holding, stockBasisAtStart: 1000000 }),
    );

  it("allows a joint loss of $200,000 in full and files Form 461 with no excess", () => {
    const large = run(elaidaScenario, withLoss(-200000));
    expect(large.value("schedule-e.1.line.41_total_income_or_loss")).toBe(-200000);
    expect(large.files("form-461")).toBe(true);
    expect(large.value("form-461.0.line.2_schedule_1_line_3")).toBe(400);
    expect(large.value("form-461.0.line.14_net_business_income_loss")).toBe(-199600);
    expect(large.value("form-461.0.line.16_excess_business_loss")).toBe(426400);
    expect(large.value("schedule-1.0.line.8p")).toBeUndefined();
    expect(large.value("form-8995.0.line.1iii_c")).toBe(-60000);
    expect(typeof large.value("form-1040.line.11a")).toBe("number");
    expect(large.value("form-1040.line.15")).toBe(0);
  });

  it("adds back the excess of a joint loss of $700,000 over $626,000 on Schedule 1 line 8p", () => {
    const larger = run(elaidaScenario, withLoss(-700000));
    expect(larger.value("schedule-e.1.line.41_total_income_or_loss")).toBe(-700000);
    expect(larger.value("form-461.0.line.9_total_income_loss_items")).toBe(-701100);
    expect(larger.value("form-461.0.line.11_nonbusiness_losses_deductions")).toBe(1500);
    expect(larger.value("form-461.0.line.16_excess_business_loss")).toBe(-73600);
    expect(larger.value("schedule-1.0.line.8p")).toBe(73600);
    expect(larger.value("schedule-1.0.line.10")).toBe(-626000);
    /*
     * The suspended loss is not QBI. The K-1 is the only business with a loss,
     * so only its allowed part counts: -60,000 x (700,000 - 73,600) / 700,000
     * (irs-8995-inst-2025::sec::determining-your-qualified-business::b03).
     */
    expect(larger.value("form-8995.0.line.1iii_c")).toBe(-53691);
  });

  it("files no Form 461 for elaida's own loss", () => {
    expect(run(elaidaScenario, elaidaScenario.facts).files("form-461")).toBe(false);
  });
});

describe("a carried basis loss allowed this year (gareth)", () => {
  it("reports a noncash K-1 contribution as a gap on Schedule A line 11", () => {
    const facts = editK1(garethScenario.facts, (k1) => ({
      ...k1,
      boxes: [...k1.boxes, { box: "12", code: "C", amount: 400 }],
    }));
    const noncash = run(garethScenario, facts);
    expect(unsupportedReason(noncash.field("schedule-a.0.line.11_gifts_cash_check"))).toContain(
      "box 12 code C",
    );
  });

  it("waits for the qualified part of the carried loss before Form 8995 line 3", () => {
    const facts = editHolding(garethScenario.facts, (holding) => ({
      ...holding,
      carriedQualifiedBusinessLoss: undefined,
    }));
    const unanswered = run(garethScenario, facts);
    expect(unanswered.value("form-8995.0.line.2")).toBeUndefined();
    expect(pendingInputs(unanswered.result).pendingFacts).toContain(
      "k1.holding.kore-springs-stables",
    );
  });
});
