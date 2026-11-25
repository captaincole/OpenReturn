/*
 * Form 461 on a whole return: who files, the answers it waits on, the gaps,
 * the business and nonbusiness parts, and the lines that receive line 16
 * (Schedule 1 line 8p, the QBI forms). The synthetic juilin scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  BUSINESS_LOSS_LIMIT_KEYS,
  isRentalFactKey,
  makeBusinessFactKey,
  type RentalFactValue,
  type SCorporationK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { juilinScenario as base } from "../../../scenarios/synthetic/juilin/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-461-test", taxYear: base.taxYear },
    facts,
    decisions: [...base.decisions, ...extra],
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result;
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const reason = (fieldId: string) => {
    const found = field(fieldId) as { unsupported?: boolean; reason?: string } | undefined;
    return found?.unsupported ? found.reason : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { result, value, reason, files };
}

const LINE = (line: string) => `form-461.0.line.${line}`;
const K1_KEY = "k1.s_corporation.tanchico-dry-dock";

const editK1Loss = (facts: TaxFactRow[], amount: number) =>
  facts.map((fact) =>
    fact.key === K1_KEY
      ? {
          ...fact,
          value: { ...(fact.value as SCorporationK1FactValue), boxes: [{ box: "1", amount }] },
        }
      : fact,
  );

const editRentals = (facts: TaxFactRow[], edit: (value: RentalFactValue) => RentalFactValue) =>
  facts.map((fact) =>
    isRentalFactKey(fact.key) ? { ...fact, value: edit(fact.value as RentalFactValue) } : fact,
  );

describe("who files", () => {
  it("files with juilin's $650,000 K-1 loss (more than $156,500 on line 5)", () => {
    expect(evaluate().files("form-461")).toBe(true);
  });

  it("does not file with a $100,000 K-1 loss: no line loses more than $156,500, the total is under $313,000", () => {
    const small = evaluate(editK1Loss(base.facts, -100000));
    expect(small.files("form-461")).toBe(false);
    expect(small.value("schedule-1.0.line.8p")).toBeUndefined();
  });

  it("files for a stated line 8 loss of more than $156,500", () => {
    const facts = editK1Loss(
      base.facts.map((fact) =>
        fact.key === BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome
          ? { ...fact, value: -160000 }
          : fact,
      ),
      -10000,
    );
    expect(evaluate(facts).files("form-461")).toBe(true);
  });

  it("follows the explicit decision", () => {
    expect(
      evaluate(base.facts, [decision("decisions.scope.must_file_461", false)]).files("form-461"),
    ).toBe(false);
  });
});

describe("the lines", () => {
  it("adds nothing back when the net business loss is at most the threshold", () => {
    const run = evaluate(editK1Loss(base.facts, -300000));
    expect(run.files("form-461")).toBe(true);
    expect(run.value(LINE("14_net_business_income_loss"))).toBe(-252000);
    expect(run.value(LINE("16_excess_business_loss"))).toBe(61000);
    expect(run.value("schedule-1.0.line.8p")).toBeUndefined();
    expect(run.value("schedule-1.0.line.9")).toBe(6000);
  });

  it("keeps a stated business capital gain on line 3 (out of line 10)", () => {
    const facts: TaxFactRow[] = [
      ...base.facts,
      {
        ...base.facts[0],
        id: "f-cap",
        category: "other",
        key: BUSINESS_LOSS_LIMIT_KEYS.businessCapitalGain,
        value: 10000,
      },
    ];
    const run = evaluate(facts);
    expect(run.value(LINE("10_nonbusiness_income_gain"))).toBe(32000);
    expect(run.value(LINE("16_excess_business_loss"))).toBe(-279000);
    expect(run.value("schedule-1.0.line.8p")).toBe(279000);
  });

  it("counts a rental that is a trade or business as business (nothing on line 10 for it)", () => {
    const run = evaluate(editRentals(base.facts, (value) => ({ ...value, tradeOrBusiness: true })));
    expect(run.value(LINE("10_nonbusiness_income_gain"))).toBe(30000);
    expect(run.value(LINE("16_excess_business_loss"))).toBe(-277000);
  });

  it("waits for a rental's trade or business answer, and asks for the property", () => {
    const run = evaluate(
      editRentals(base.facts, (value) =>
        value.propertyType === "royalties" ? value : { ...value, tradeOrBusiness: undefined },
      ),
    );
    expect(run.value(LINE("9_total_income_loss_items"))).toBe(-561500);
    expect(run.value(LINE("10_nonbusiness_income_gain"))).toBeUndefined();
    expect(run.value("schedule-1.0.line.8p")).toBeUndefined();
    expect(run.value("schedule-1.0.line.10")).toBeUndefined();
    expect(pendingInputs(run.result).pendingFacts).toContain("rental.property.mayene-street");
  });
});

describe("gaps", () => {
  it("shows line 4 and the total lines as gaps when Form 4797 files", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_4797", true)]);
    expect(run.reason(LINE("4_schedule_1_line_4"))).toContain("Form 4797");
    expect(run.reason(LINE("16_excess_business_loss"))).toContain("Form 4797");
    expect(run.reason("schedule-1.0.line.8p")).toContain("Form 4797");
    expect(run.reason("schedule-1.0.line.10")).toContain("Form 4797");
    expect(run.value(LINE("2_schedule_1_line_3"))).toBe(42000);
  });

  it("shows line 6 as a gap when Schedule F files", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_schedule_f", true)]);
    expect(run.reason(LINE("6_schedule_1_line_6"))).toContain("Schedule F");
    expect(run.reason(LINE("9_total_income_loss_items"))).toContain("Schedule F");
  });
});

describe("QBI and an excess business loss", () => {
  it("leaves QBI alone when no QBI business has a loss (juilin's Schedule C profit)", () => {
    expect(evaluate().value("form-8995-a.0.line.2_a")).toBe(41437);
  });

  it("makes the QBI lines a gap when a QBI business has a loss", () => {
    const facts = base.facts.map((fact) =>
      fact.key === makeBusinessFactKey("torvane-harbor-consulting")
        ? {
            ...fact,
            value: { ...(fact.value as object), grossReceipts: 10000, allInvestmentAtRisk: true },
          }
        : fact,
    );
    const run = evaluate(facts);
    expect(run.value(LINE("2_schedule_1_line_3"))).toBe(-8000);
    expect(run.value("schedule-1.0.line.8p")).toBe(339000);
    const qbiForm = run.files("form-8995") ? "form-8995.0.line.2" : "form-8995-a.0.line.2_a";
    expect(run.reason(qbiForm)).toContain("Form 461");
  });

  /*
   * The consulting business is the only business with a loss: $400,000 on
   * line 2; the K-1 has $50,000 of income. Line 16 is -$31,000, so the
   * allowed loss is $369,000, and its QBI is -$400,000 x 369,000 / 400,000
   * (irs-8995-inst-2025::sec::determining-your-qualified-business::b03).
   */
  const oneLosingBusiness = (extra: (fact: TaxFactRow) => TaxFactRow = (fact) => fact) =>
    editK1Loss(base.facts, 50000)
      .map((fact) =>
        fact.key === makeBusinessFactKey("torvane-harbor-consulting")
          ? {
              ...fact,
              value: {
                ...(fact.value as object),
                grossReceipts: 10000,
                expenses: { supplies: 410000 },
                allInvestmentAtRisk: true,
              },
            }
          : fact,
      )
      .map(extra);

  it("takes the excess off the QBI loss of the one business with a loss", () => {
    const run = evaluate(oneLosingBusiness());
    expect(run.value(LINE("2_schedule_1_line_3"))).toBe(-400000);
    expect(run.value(LINE("16_excess_business_loss"))).toBe(-31000);
    expect(run.value("form-8995-a-schedule-c.0.line.1_col_a_qbi_a")).toBe(-369000);
    expect(run.value("form-8995-a-schedule-c.0.line.6_net_loss_carryforward")).toBe(369000);
  });

  it("keeps the gap when a stated line 8 loss is a second business loss", () => {
    const run = evaluate(
      oneLosingBusiness((fact) =>
        fact.key === BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome
          ? { ...fact, value: -6000 }
          : fact,
      ),
    );
    expect(run.value(LINE("8_other_business_income_loss"))).toBe(-6000);
    expect(run.reason("form-8995-a-schedule-c.0.line.1_col_a_qbi_a")).toContain("Form 461");
  });
});
