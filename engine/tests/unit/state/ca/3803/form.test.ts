/*
 * FTB 3803 on a whole return: its copies, Schedule CA (540) line 8z and line
 * 9a column C (ca-3803-inst-2025::sec::line-6::b01), Form 540 line 31 and its
 * box (ca-540-inst-2025::sec::line-31-tax::b01, ::b02), and the lines with no
 * FTB 3803. The synthetic verin scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeChildInvestmentIncomeFactKey,
  makeTradeFactKey,
  OTHER_INCOME_KEYS,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { LUCIA, NOOR } from "../../../../scenarios/synthetic/verin/facts.js";
import { verinScenario as base } from "../../../../scenarios/synthetic/verin/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const CHILD_KEYS = [LUCIA, NOOR].map(makeChildInvestmentIncomeFactKey);

function evaluate(facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-3803-test", taxYear: base.taxYear },
    facts,
    decisions: [
      ...base.decisions.filter(
        (each) => !extra.some((one) => one.decisionKey === each.decisionKey),
      ),
      ...extra,
    ],
    authEmail: null,
  });
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const gap = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const pending = () => {
    const { pendingDecisions, pendingFacts } = pendingInputs(result);
    return [...pendingDecisions, ...pendingFacts];
  };
  return { value, gap, files, pending };
}

const ca = (run: ReturnType<typeof evaluate>, id: string) => run.value("schedule-ca", id);
const line31 = (run: ReturnType<typeof evaluate>) => run.value("form-540", "line.31_tax_amount");
const NO_CHILDREN = base.facts.filter((fact) => !CHILD_KEYS.includes(fact.key));

describe("FTB 3803 on verin's return", () => {
  it("adds FTB 3803 line 6 over Form 8814 line 6 in line 8z column C", () => {
    const run = evaluate();
    /* FTB 3803 line 6: 3,050 (Lucia) + 0 (Noor); Form 8814 line 6: 2,450 + 0. */
    expect(ca(run, "1.line.b8z_additions")).toBe(600);
    expect(ca(run, "1.line.b8z_subtractions")).toBeUndefined();
    expect(ca(run, "2.line.b9a_additions")).toBe(600);
    expect(ca(run, "1.line.b8z_income_type")).toBe("Form 8814, FTB 3803");
    expect(run.value("form-540", "line.16_ca_adjustments_additions")).toBe(600);
  });

  it("adds each form's line 9 to Form 540 line 31 and checks the FTB 3803 box", () => {
    const run = evaluate();
    /* Schedule Y on 160,038: 7,760.81 → 7,761; plus 14 (Lucia) and 4 (Noor). */
    expect(line31(run)).toBe(7779);
    expect(run.value("form-540", "line.31_tax_from_ftb_3803")).toBe(true);
  });

  it("asks for nothing", () => {
    expect(evaluate().pending()).toEqual([]);
  });
});

describe("one return only", () => {
  it("a California election alone adds all of line 6 in column C", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_8814", false)]);
    expect(ca(run, "1.line.b8z_additions")).toBe(3050);
    expect(ca(run, "1.line.b8z_income_type")).toBe("FTB 3803");
  });

  it("a federal election alone subtracts all of Form 8814 line 6 (ca-3800-inst-2025::sec::purpose::b02)", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_3803", false)]);
    expect(run.files("form-3803")).toBe(false);
    expect(ca(run, "1.line.b8z_subtractions")).toBe(2450);
    expect(ca(run, "2.line.b9a_subtractions")).toBe(2450);
    expect(run.value("form-540", "line.31_tax_from_ftb_3803")).toBeUndefined();
    /* CA AGI 168,400 less 11,412: 156,988 on Schedule Y, 7,477.16; no FTB 3803 tax. */
    expect(line31(run)).toBe(7477);
  });

  it("asks for the California decision when it is missing", () => {
    const undecided = evaluateScenario({
      filing: { id: "form-3803-test", taxYear: base.taxYear },
      facts: base.facts,
      decisions: base.decisions.filter(
        (each) => each.decisionKey !== "decisions.scope.must_file_3803",
      ),
      authEmail: null,
    });
    expect(pendingInputs(undecided).pendingDecisions).toContain("decisions.scope.must_file_3803");
  });
});

describe("with no child's income, the lines are as before", () => {
  it("line 8z columns B and C and line 9a column C keep their reasons; line 31 is the table tax", () => {
    const run = evaluate(NO_CHILDREN, [
      decision("decisions.scope.must_file_8814", false),
      decision("decisions.scope.must_file_3803", false),
    ]);
    expect(run.files("form-3803")).toBe(false);
    expect(run.gap("schedule-ca", "1.line.b8z_subtractions")).toBe(true);
    expect(run.gap("schedule-ca", "1.line.b8z_additions")).toBe(true);
    expect(run.gap("schedule-ca", "2.line.b9a_additions")).toBe(true);
    expect(run.value("form-540", "line.31_tax_from_ftb_3803")).toBeUndefined();
    /* Federal AGI 168,400 less 11,412: 156,988 on Schedule Y. */
    expect(line31(run)).toBe(7477);
  });
});

describe("gaps and waits", () => {
  it("a child's California withholding makes line 31 and line 8z unsupported", () => {
    const facts = base.facts.map((fact) =>
      fact.key === CHILD_KEYS[1]
        ? { ...fact, value: { ...(fact.value as object), stateTaxWithheld: 20 } }
        : fact,
    );
    const run = evaluate(facts);
    expect(run.gap("form-540", "line.31_tax_amount")).toBe(true);
    expect(run.gap("schedule-ca", "1.line.b8z_additions")).toBe(true);
    expect(run.gap("form-3803", "0.line.9_tax_on_first_2700")).toBe(false);
  });

  it("line 31 waits for a child's missing answer", () => {
    const facts = base.facts.map((fact) =>
      fact.key === CHILD_KEYS[0]
        ? { ...fact, value: { ...(fact.value as object), californiaEstimatedTaxPaid: undefined } }
        : fact,
    );
    const run = evaluate(facts);
    expect(line31(run)).toBeUndefined();
    expect(ca(run, "1.line.b8z_additions")).toBeUndefined();
    expect(run.pending()).toContain(CHILD_KEYS[0]);
  });

  it("line 8z is unsupported when Schedule D (540) files and a child's capital gain distributions reach line 6", () => {
    const sale: TaxFactRow = {
      ...base.facts[0],
      id: "f-sale",
      category: "investment_income",
      key: makeTradeFactKey("brokerage", "t-1"),
      value: {
        tradeId: "t-1",
        description: "10 sh Fund",
        dateAcquired: "01/05/2020",
        dateSold: "06/05/2025",
        proceeds: 5000,
        costBasis: 3000,
      },
    };
    const run = evaluate(
      [...base.facts, sale],
      [
        decision("decisions.scope.has_reportable_sales", true),
        decision("decisions.scope.must_file_schedule_d", true),
        decision("decisions.scope.must_file_schedule_d_ca", true),
      ],
    );
    expect(run.files("schedule-d-ca")).toBe(true);
    expect(run.gap("schedule-ca", "1.line.b8z_additions")).toBe(true);
  });

  it("line 8z columns B and C and line 9a column C are unsupported when Schedule 1 line 8z holds another item (::line-8-other-income::b05)", () => {
    /* A Fire Victims Trust payment is income on line 8z and excluded in column B (::b12). */
    const fireVictimsTrust: TaxFactRow = {
      ...base.facts[0],
      id: "f-other-items",
      category: "other",
      key: OTHER_INCOME_KEYS.otherItems,
      value: [{ description: "Fire Victims Trust", amount: 5000 }],
    };
    const run = evaluate([...base.facts, fireVictimsTrust]);
    /* Schedule 1 line 8z: 5,000 plus Form 8814 line 12. */
    expect(ca(run, "1.line.b8z_federal")).toBeGreaterThan(5000);
    expect(run.gap("schedule-ca", "1.line.b8z_subtractions")).toBe(true);
    expect(run.gap("schedule-ca", "1.line.b8z_additions")).toBe(true);
    expect(run.gap("schedule-ca", "2.line.b9a_additions")).toBe(true);
  });
});
